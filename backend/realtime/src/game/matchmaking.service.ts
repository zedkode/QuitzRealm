import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { RedisService } from '../redis/redis.service';

const KEY_PREFIX = 'quizrealm:realtime';

@Injectable()
export class MatchmakingService {
  private readonly queueKey = `${KEY_PREFIX}:matchmaking:duo`;

  constructor(private readonly redis: RedisService) {}

  async registerConnection(userId: string, socketId: string): Promise<void> {
    await this.redis.client
      .multi()
      .set(this.socketKey(socketId), userId, 'EX', 86_400)
      .set(this.userSocketKey(userId), socketId, 'EX', 86_400)
      .exec();
  }

  async unregisterConnection(userId: string, socketId: string): Promise<void> {
    await this.redis.client.zrem(this.queueKey, userId);
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

  async join(userId: string): Promise<string[] | null> {
    await this.enforceRateLimit(userId);
    if (await this.redis.client.get(this.userMatchKey(userId))) {
      throw new WsException('Jucătorul este deja într-o partidă activă.');
    }

    await this.redis.client.zadd(this.queueKey, 'NX', Date.now(), userId);
    const popped = (await this.redis.client.eval(
      `
        if redis.call('ZCARD', KEYS[1]) < 2 then
          return {}
        end
        local entries = redis.call('ZRANGE', KEYS[1], 0, 1)
        redis.call('ZREM', KEYS[1], entries[1], entries[2])
        return entries
      `,
      1,
      this.queueKey,
    )) as string[];
    return popped.length === 2 ? popped : null;
  }

  leave(userId: string): Promise<number> {
    return this.redis.client.zrem(this.queueKey, userId);
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

  async requeue(userIds: string[]): Promise<void> {
    if (userIds.length === 0) {
      return;
    }
    const pipeline = this.redis.client.pipeline();
    for (const userId of userIds) {
      pipeline.zadd(this.queueKey, 'NX', Date.now(), userId);
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
}
