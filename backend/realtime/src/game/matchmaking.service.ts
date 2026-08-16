import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { RedisService } from '../redis/redis.service';
import {
  DUO_MATCH_PROFILE,
  MatchProfile,
  publicMatchProfile,
} from './match-profile';

const KEY_PREFIX = 'quizrealm:realtime';

@Injectable()
export class MatchmakingService {
  constructor(private readonly redis: RedisService) {}

  async registerConnection(userId: string, socketId: string): Promise<void> {
    await this.redis.client
      .multi()
      .set(this.socketKey(socketId), userId, 'EX', 86_400)
      .set(this.userSocketKey(userId), socketId, 'EX', 86_400)
      .exec();
  }

  async unregisterConnection(userId: string, socketId: string): Promise<void> {
    await this.leave(userId);
    await this.redis.client.del(this.socketKey(socketId));
    await this.redis.client.eval(
      `
        if redis.call('GET', KEYS[1]) == ARGV[1] then
          return redis.call('DEL', KEYS[1])
        end
        return 0
      `,
      1,
      this.userSocketKey(userId),
      socketId,
    );
  }

  async join(userId: string, profile: MatchProfile): Promise<string[] | null> {
    await this.enforceRateLimit(userId);
    if (await this.redis.client.get(this.userMatchKey(userId))) {
      throw new WsException('Jucătorul este deja într-o partidă activă.');
    }

    const queueKey = this.queueKey(profile);
    const queuedInKey = this.userQueueKey(userId);
    const popped = (await this.redis.client.eval(
      `
        local previousQueue = redis.call('GET', KEYS[2])
        if previousQueue and previousQueue ~= KEYS[1] then
          redis.call('ZREM', previousQueue, ARGV[1])
        end
        redis.call('ZADD', KEYS[1], 'NX', ARGV[2], ARGV[1])
        redis.call('SET', KEYS[2], KEYS[1], 'EX', ARGV[4])
        if redis.call('ZCARD', KEYS[1]) < tonumber(ARGV[3]) then
          return {}
        end
        local entries = redis.call('ZRANGE', KEYS[1], 0, tonumber(ARGV[3]) - 1)
        for _, entry in ipairs(entries) do
          redis.call('ZREM', KEYS[1], entry)
          local membershipKey = ARGV[5] .. entry .. ':queue'
          if redis.call('GET', membershipKey) == KEYS[1] then
            redis.call('DEL', membershipKey)
          end
        end
        return entries
      `,
      2,
      queueKey,
      queuedInKey,
      userId,
      Date.now(),
      profile.playerCountTarget,
      3_600,
      `${KEY_PREFIX}:user:`,
    )) as string[];
    return popped.length === profile.playerCountTarget ? popped : null;
  }

  async leave(userId: string): Promise<MatchProfile | null> {
    const queuedInKey = this.userQueueKey(userId);
    const queueKey = await this.redis.client.get(queuedInKey);
    if (!queueKey) return null;

    await this.redis.client
      .multi()
      .zrem(queueKey, userId)
      .del(queuedInKey)
      .exec();
    return this.profileFromQueueKey(queueKey);
  }

  getSocketId(userId: string): Promise<string | null> {
    return this.redis.client.get(this.userSocketKey(userId));
  }

  /// Partida în care jucătorul își păstrează locul, inclusiv cât e deconectat.
  getActiveMatch(userId: string): Promise<string | null> {
    return this.redis.client.get(this.userMatchKey(userId));
  }

  setActiveMatch(userId: string, matchId: string, ttl: number): Promise<'OK'> {
    return this.redis.client.set(this.userMatchKey(userId), matchId, 'EX', ttl);
  }

  clearActiveMatch(userId: string): Promise<number> {
    return this.redis.client.del(this.userMatchKey(userId));
  }

  /// Categoriile cerute de un jucător la intrarea în coadă.
  ///
  /// Stau lângă coadă, nu în ea: coada e un sorted set de id-uri, iar
  /// preferințele sunt date variabile care n-au ce căuta în cheia de ordonare.
  /// Lista goală înseamnă „toate categoriile”.
  async setQueuePreferences(
    userId: string,
    categoryCodes: string[],
  ): Promise<void> {
    const key = this.queuePreferenceKey(userId);
    if (categoryCodes.length === 0) {
      await this.redis.client.del(key);
      return;
    }
    await this.redis.client.set(
      key,
      JSON.stringify(categoryCodes),
      'EX',
      3_600,
    );
  }

  async getQueuePreferences(userId: string): Promise<string[]> {
    const raw = await this.redis.client.get(this.queuePreferenceKey(userId));
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((entry): entry is string => typeof entry === 'string')
        : [];
    } catch {
      return [];
    }
  }

  async clearQueuePreferences(userIds: string[]): Promise<void> {
    if (userIds.length === 0) return;
    await this.redis.client.del(
      ...userIds.map((userId) => this.queuePreferenceKey(userId)),
    );
  }

  private queuePreferenceKey(userId: string): string {
    return `${KEY_PREFIX}:user:${userId}:queue-categories`;
  }

  async requeue(userIds: string[], profile: MatchProfile): Promise<void> {
    if (userIds.length === 0) {
      return;
    }
    const pipeline = this.redis.client.pipeline();
    const queueKey = this.queueKey(profile);
    for (const userId of userIds) {
      pipeline.zadd(queueKey, 'NX', Date.now(), userId);
      pipeline.set(this.userQueueKey(userId), queueKey, 'EX', 3_600);
    }
    await pipeline.exec();
  }

  private async enforceRateLimit(userId: string): Promise<void> {
    const attempts = Number(
      await this.redis.client.eval(
        `
          local count = redis.call('INCR', KEYS[1])
          if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
          return count
        `,
        1,
        `${KEY_PREFIX}:ratelimit:matchmaking:${userId}`,
        60,
      ),
    );
    if (attempts > 10) {
      throw new WsException(
        'Prea multe cereri de matchmaking. Încearcă din nou peste un minut.',
      );
    }
  }

  private socketKey(socketId: string): string {
    return `${KEY_PREFIX}:socket:${socketId}`;
  }

  private userSocketKey(userId: string): string {
    return `${KEY_PREFIX}:user:${userId}:socket`;
  }

  private userMatchKey(userId: string): string {
    return `${KEY_PREFIX}:user:${userId}:match`;
  }

  private userQueueKey(userId: string): string {
    return `${KEY_PREFIX}:user:${userId}:queue`;
  }

  private queueKey(profile: MatchProfile): string {
    return profile.clientMode === 'duo'
      ? `${KEY_PREFIX}:matchmaking:duo`
      : `${KEY_PREFIX}:matchmaking:classic:${profile.playerCountTarget}`;
  }

  private profileFromQueueKey(queueKey: string): MatchProfile {
    if (queueKey === `${KEY_PREFIX}:matchmaking:duo`) {
      return DUO_MATCH_PROFILE;
    }
    const playerCount = Number(queueKey.split(':').at(-1));
    return publicMatchProfile('classic', playerCount);
  }
}
