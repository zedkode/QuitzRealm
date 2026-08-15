import { Injectable, Logger } from '@nestjs/common';
import { Namespace } from 'socket.io';
import { ApiClientService } from '../api-client/api-client.service';
import { RedisService } from '../redis/redis.service';

const KEY_PREFIX = 'quizrealm:realtime';

/// `in_match` se deduce din partida activă; nu are stare proprie, ca să nu
/// existe două surse care se pot contrazice.
export type PresenceStatus = 'online' | 'in_match' | 'offline';

/// Prezența din §2.3: online / în meci / offline, **vizibilă doar prietenilor**.
/// De aceea nu e o difuzare globală, ci o notificare țintită către camerele
/// personale ale prietenilor.
@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly api: ApiClientService,
  ) {}

  async announceOnline(server: Namespace, userId: string): Promise<void> {
    await this.redis.client.sadd(this.onlineKey(), userId);
    await this.notifyFriends(server, userId, 'online');
  }

  async announceOffline(server: Namespace, userId: string): Promise<void> {
    await this.redis.client.srem(this.onlineKey(), userId);
    await this.notifyFriends(server, userId, 'offline');
  }

  /// Cine dintre prietenii cuiva e online acum. Se trimite la conectare, ca
  /// lista de prieteni să nu arate toată lumea offline până se mișcă cineva.
  async friendsOnline(userId: string): Promise<string[]> {
    try {
      const friendIds = await this.api.getFriendIds(userId);
      if (friendIds.length === 0) return [];
      const flags = await this.redis.client.smismember(
        this.onlineKey(),
        ...friendIds,
      );
      return friendIds.filter((_, index) => flags[index] === 1);
    } catch (error) {
      // Prezența e un lux; dacă API-ul nu răspunde, jocul merge mai departe.
      this.logger.warn(`Prezența prietenilor a eșuat: ${String(error)}`);
      return [];
    }
  }

  private async notifyFriends(
    server: Namespace,
    userId: string,
    status: PresenceStatus,
  ): Promise<void> {
    try {
      const friendIds = await this.api.getFriendIds(userId);
      for (const friendId of friendIds) {
        server
          .to(`user:${friendId}`)
          .emit('friends:presence', { userId, status });
      }
    } catch (error) {
      this.logger.warn(`Anunțul de prezență a eșuat: ${String(error)}`);
    }
  }

  private onlineKey(): string {
    return `${KEY_PREFIX}:presence:online`;
  }
}
