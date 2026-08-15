import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ApiClientService } from '../api-client/api-client.service';
import { GlobalChatContext } from '../game/game.types';
import { RedisService } from '../redis/redis.service';

const KEY_PREFIX = 'quizrealm:realtime';

/// Camera de chat global. Un singur flux deocamdată; §2.2 prevede sharding pe
/// limbă/regiune când volumul o cere.
export const GLOBAL_ROOM = 'chat:global';

/// Chatul global e efemer (§2.8): trăiește doar în Redis, atât cât să poată fi
/// raportat și moderat. 24 h e fereastra în care un raport are încă rost.
const GLOBAL_HISTORY_TTL_SECONDS = 86_400;
const GLOBAL_HISTORY_SIZE = 100;

/// Fereastra de rate limiting pentru chatul global. Mai strictă decât la
/// conversațiile private: expune la necunoscuți, fără niciun filtru de relație.
const GLOBAL_RATE_WINDOW_SECONDS = 10;
const GLOBAL_RATE_LIMIT = 5;

/// Cât timp reținem contextul unui jucător fără să reîntrebăm API-ul. Un mut
/// intră în vigoare cu cel mult atâta întârziere — compromis conștient, ca să
/// nu facem un apel HTTP pentru fiecare mesaj.
const CONTEXT_CACHE_MS = 10_000;

export interface GlobalChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export type GlobalSendOutcome =
  | { ok: true; message: GlobalChatMessage; excludedUserIds: string[] }
  | { ok: false; reason: string };

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly contextCache = new Map<
    string,
    { at: number; context: GlobalChatContext }
  >();

  constructor(
    private readonly redis: RedisService,
    private readonly api: ApiClientService,
  ) {}

  /// Istoricul recent al chatului global, trimis la intrarea în cameră ca
  /// jucătorul să nu vadă un ecran gol.
  async recentGlobal(): Promise<GlobalChatMessage[]> {
    const raw = await this.redis.client.lrange(
      this.globalKey(),
      0,
      GLOBAL_HISTORY_SIZE - 1,
    );
    return raw
      .map((entry) => {
        try {
          return JSON.parse(entry) as GlobalChatMessage;
        } catch {
          return null;
        }
      })
      .filter((entry): entry is GlobalChatMessage => entry !== null)
      .reverse();
  }

  /// Verifică și înregistrează un mesaj global.
  ///
  /// Întoarce un rezultat, nu aruncă: un mesaj refuzat pentru că jucătorul e
  /// prea nou nu e o defecțiune, ci un răspuns normal pe care clientul trebuie
  /// să-l poată afișa.
  async sendGlobal(
    userId: string,
    rawContent: string,
  ): Promise<GlobalSendOutcome> {
    const content = rawContent.trim();
    if (content.length === 0 || content.length > 500) {
      return { ok: false, reason: 'invalid' };
    }

    const context = await this.contextFor(userId);
    if (context.globalChat !== 'public') {
      // `ownMatches` nu deschide lobby-ul public: camera globală e cel mai
      // expus canal și cere treapta T2.
      return { ok: false, reason: 'tier_too_low' };
    }
    if (context.mutedUntil && Date.parse(context.mutedUntil) > Date.now()) {
      return { ok: false, reason: 'muted' };
    }
    if (!(await this.withinRateLimit(userId))) {
      return { ok: false, reason: 'rate_limited' };
    }

    const message: GlobalChatMessage = {
      id: randomUUID(),
      senderId: userId,
      senderName: context.displayName,
      content,
      createdAt: new Date().toISOString(),
    };
    await this.redis.client
      .multi()
      .lpush(this.globalKey(), JSON.stringify(message))
      .ltrim(this.globalKey(), 0, GLOBAL_HISTORY_SIZE - 1)
      .expire(this.globalKey(), GLOBAL_HISTORY_TTL_SECONDS)
      .exec();

    return {
      ok: true,
      message,
      // Blocarea se aplică la livrare, nu la afișare: cel blocat nu vede
      // mesajul deloc, iar expeditorul nu-l vede pe al lui.
      excludedUserIds: context.blockedUserIds,
    };
  }

  /// Golește contextul memorat, ca o schimbare de stare (mut, blocare,
  /// confirmare de email) să se vadă imediat.
  invalidate(userId: string): void {
    this.contextCache.delete(userId);
  }

  private async contextFor(userId: string): Promise<GlobalChatContext> {
    const cached = this.contextCache.get(userId);
    if (cached && Date.now() - cached.at < CONTEXT_CACHE_MS) {
      return cached.context;
    }
    const context = await this.api.getGlobalChatContext(userId);
    this.contextCache.set(userId, { at: Date.now(), context });
    return context;
  }

  /// Contorul stă în Redis, nu în memoria procesului: cu mai multe instanțe,
  /// un contor local ar înmulți limita cu numărul de noduri.
  private async withinRateLimit(userId: string): Promise<boolean> {
    const key = `${KEY_PREFIX}:chat:rate:${userId}`;
    const hits = await this.redis.client.incr(key);
    if (hits === 1) {
      await this.redis.client.expire(key, GLOBAL_RATE_WINDOW_SECONDS);
    }
    if (hits > GLOBAL_RATE_LIMIT) {
      this.logger.warn(`Rate limit la chat global pentru ${userId}.`);
      return false;
    }
    return true;
  }

  private globalKey(): string {
    return `${KEY_PREFIX}:chat:global`;
  }
}
