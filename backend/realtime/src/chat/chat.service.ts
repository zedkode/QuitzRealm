import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ApiClientService } from '../api-client/api-client.service';
import { GlobalChatContext } from '../game/game.types';
import { RedisService } from '../redis/redis.service';
import { MATCH_REACTIONS } from './dto/chat.dto';

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
const MATCH_HISTORY_SIZE = 50;
const MATCH_HISTORY_TTL_SECONDS = 3_600;

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

export interface MatchChatMessage extends GlobalChatMessage {
  matchId: string;
  kind: 'text' | 'reaction';
}

export type MatchChatAccess = 'reactions' | 'text';

export type MatchJoinOutcome =
  | {
      ok: true;
      access: MatchChatAccess;
      messages: MatchChatMessage[];
    }
  | { ok: false; reason: string };

export type MatchSendOutcome =
  | { ok: true; message: MatchChatMessage; excludedUserIds: string[] }
  | { ok: false; reason: string };

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

  /// Întoarce istoricul efemer al chatului numai dacă jucătorul aparține
  /// partidei indicate. `matchId` primit de la client nu este considerat
  /// dovadă de apartenență.
  async joinMatch(userId: string, matchId: string): Promise<MatchJoinOutcome> {
    if (!(await this.isActiveMatchMember(userId, matchId))) {
      return { ok: false, reason: 'not_in_match' };
    }
    const context = await this.contextFor(userId);
    return {
      ok: true,
      access: context.globalChat === 'reactions' ? 'reactions' : 'text',
      messages: await this.recentMatch(matchId),
    };
  }

  async sendMatchText(
    userId: string,
    matchId: string,
    rawContent: string,
  ): Promise<MatchSendOutcome> {
    const content = rawContent.trim();
    if (content.length === 0 || content.length > 500) {
      return { ok: false, reason: 'invalid' };
    }
    if (!(await this.isActiveMatchMember(userId, matchId))) {
      return { ok: false, reason: 'not_in_match' };
    }

    const context = await this.contextFor(userId);
    if (context.globalChat === 'reactions') {
      return { ok: false, reason: 'tier_too_low' };
    }
    if (context.mutedUntil && Date.parse(context.mutedUntil) > Date.now()) {
      return { ok: false, reason: 'muted' };
    }
    if (!context.canPostLinksInGlobal && this.containsLink(content)) {
      return { ok: false, reason: 'links_not_allowed' };
    }
    if (!(await this.withinRateLimit(userId, 'match'))) {
      return { ok: false, reason: 'rate_limited' };
    }

    return this.storeMatchMessage({
      matchId,
      senderId: userId,
      senderName: context.displayName,
      content,
      kind: 'text',
      excludedUserIds: context.blockedUserIds,
    });
  }

  async sendMatchReaction(
    userId: string,
    matchId: string,
    reaction: string,
  ): Promise<MatchSendOutcome> {
    if (
      !MATCH_REACTIONS.includes(reaction as (typeof MATCH_REACTIONS)[number])
    ) {
      return { ok: false, reason: 'invalid' };
    }
    if (!(await this.isActiveMatchMember(userId, matchId))) {
      return { ok: false, reason: 'not_in_match' };
    }

    const context = await this.contextFor(userId);
    if (context.mutedUntil && Date.parse(context.mutedUntil) > Date.now()) {
      return { ok: false, reason: 'muted' };
    }
    if (!(await this.withinRateLimit(userId, 'match'))) {
      return { ok: false, reason: 'rate_limited' };
    }

    return this.storeMatchMessage({
      matchId,
      senderId: userId,
      senderName: context.displayName,
      content: reaction,
      kind: 'reaction',
      excludedUserIds: context.blockedUserIds,
    });
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
  private async recentMatch(matchId: string): Promise<MatchChatMessage[]> {
    const raw = await this.redis.client.lrange(
      this.matchChatKey(matchId),
      0,
      MATCH_HISTORY_SIZE - 1,
    );
    return raw
      .map((entry) => {
        try {
          return JSON.parse(entry) as MatchChatMessage;
        } catch {
          return null;
        }
      })
      .filter((entry): entry is MatchChatMessage => entry !== null)
      .reverse();
  }

  private async storeMatchMessage(input: {
    matchId: string;
    senderId: string;
    senderName: string;
    content: string;
    kind: MatchChatMessage['kind'];
    excludedUserIds: string[];
  }): Promise<MatchSendOutcome> {
    const message: MatchChatMessage = {
      id: randomUUID(),
      matchId: input.matchId,
      senderId: input.senderId,
      senderName: input.senderName,
      content: input.content,
      kind: input.kind,
      createdAt: new Date().toISOString(),
    };
    await this.redis.client
      .multi()
      .lpush(this.matchChatKey(input.matchId), JSON.stringify(message))
      .ltrim(this.matchChatKey(input.matchId), 0, MATCH_HISTORY_SIZE - 1)
      .expire(this.matchChatKey(input.matchId), MATCH_HISTORY_TTL_SECONDS)
      .exec();
    return {
      ok: true,
      message,
      excludedUserIds: input.excludedUserIds,
    };
  }

  private async isActiveMatchMember(
    userId: string,
    matchId: string,
  ): Promise<boolean> {
    const activeMatchId = await this.redis.client.get(
      `${KEY_PREFIX}:user:${userId}:match`,
    );
    if (activeMatchId !== matchId) return false;

    const rawMatch = await this.redis.client.get(
      `${KEY_PREFIX}:match:${matchId}`,
    );
    if (!rawMatch) return false;
    try {
      const match = JSON.parse(rawMatch) as {
        status?: string;
        players?: Array<{ userId?: string }>;
      };
      return (
        (match.status === 'active' || match.status === 'paused') &&
        match.players?.some((player) => player.userId === userId) === true
      );
    } catch {
      return false;
    }
  }

  private containsLink(content: string): boolean {
    return /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:com|net|org|ro|io|gg|xyz|link|me|tk|top|shop)\b/i.test(
      content,
    );
  }

  private async withinRateLimit(
    userId: string,
    scope = 'global',
  ): Promise<boolean> {
    const key = `${KEY_PREFIX}:chat:rate:${scope}:${userId}`;
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

  private matchChatKey(matchId: string): string {
    return `${KEY_PREFIX}:chat:match:${matchId}`;
  }
}
