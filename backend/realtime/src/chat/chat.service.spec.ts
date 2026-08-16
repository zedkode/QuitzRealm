import { ApiClientService } from '../api-client/api-client.service';
import { GlobalChatContext } from '../game/game.types';
import { RedisService } from '../redis/redis.service';
import { ChatService } from './chat.service';

const userId = '11111111-1111-4111-8111-111111111111';
const matchId = '22222222-2222-4222-8222-222222222222';

describe('ChatService match chat', () => {
  let values: Map<string, string>;
  let lists: Map<string, string[]>;
  let counters: Map<string, number>;
  let api: { getGlobalChatContext: jest.Mock };
  let service: ChatService;

  beforeEach(() => {
    values = new Map([
      [`quizrealm:realtime:user:${userId}:match`, matchId],
      [
        `quizrealm:realtime:match:${matchId}`,
        JSON.stringify({
          status: 'active',
          players: [{ userId }, { userId: 'other-user' }],
        }),
      ],
    ]);
    lists = new Map();
    counters = new Map();

    const client = {
      get: jest.fn((key: string) => Promise.resolve(values.get(key) ?? null)),
      lrange: jest.fn((key: string, start: number, end: number) =>
        Promise.resolve((lists.get(key) ?? []).slice(start, end + 1)),
      ),
      incr: jest.fn((key: string) => {
        const next = (counters.get(key) ?? 0) + 1;
        counters.set(key, next);
        return Promise.resolve(next);
      }),
      expire: jest.fn(() => Promise.resolve(1)),
      multi: jest.fn(() => {
        const chain = {
          lpush: (key: string, value: string) => {
            lists.set(key, [value, ...(lists.get(key) ?? [])]);
            return chain;
          },
          ltrim: (key: string, start: number, end: number) => {
            lists.set(key, (lists.get(key) ?? []).slice(start, end + 1));
            return chain;
          },
          expire: () => chain,
          exec: () => Promise.resolve([]),
        };
        return chain;
      }),
    };
    api = { getGlobalChatContext: jest.fn() };
    service = new ChatService(
      { client } as unknown as RedisService,
      api as unknown as ApiClientService,
    );
  });

  function context(
    globalChat: GlobalChatContext['globalChat'],
    overrides: Partial<GlobalChatContext> = {},
  ): GlobalChatContext {
    return {
      displayName: 'Cavalerul Test',
      globalChat,
      canPostLinksInGlobal: false,
      tier: 0,
      mutedUntil: null,
      shadowBannedUntil: null,
      blockedUserIds: [],
      ...overrides,
    };
  }

  it('nu acceptă un matchId furnizat de un jucător din afara partidei', async () => {
    values.delete(`quizrealm:realtime:user:${userId}:match`);

    await expect(service.joinMatch(userId, matchId)).resolves.toEqual({
      ok: false,
      reason: 'not_in_match',
    });
    expect(api.getGlobalChatContext).not.toHaveBeenCalled();
  });

  it('lasă T0 să folosească reacții, dar nu text liber', async () => {
    api.getGlobalChatContext.mockResolvedValue(context('reactions'));

    await expect(service.joinMatch(userId, matchId)).resolves.toEqual({
      ok: true,
      access: 'reactions',
      messages: [],
    });
    await expect(
      service.sendMatchText(userId, matchId, 'Salut!'),
    ).resolves.toEqual({ ok: false, reason: 'tier_too_low' });

    const reaction = await service.sendMatchReaction(
      userId,
      matchId,
      'good_luck',
    );
    if (!reaction.ok) throw new Error('Reacția a fost refuzată în test.');
    expect(reaction.message.matchId).toBe(matchId);
    expect(reaction.message.senderId).toBe(userId);
    expect(reaction.message.kind).toBe('reaction');
    expect(reaction.message.content).toBe('good_luck');
  });

  it('permite text în meci pentru T1 și blochează linkurile înainte de T3', async () => {
    api.getGlobalChatContext.mockResolvedValue(
      context('ownMatches', { tier: 1 }),
    );

    const sent = await service.sendMatchText(userId, matchId, '  Bun duel!  ');
    if (!sent.ok) throw new Error('Mesajul a fost refuzat în test.');
    expect(sent.message.content).toBe('Bun duel!');
    expect(sent.message.kind).toBe('text');
    await expect(
      service.sendMatchText(userId, matchId, 'vezi exemplu.ro'),
    ).resolves.toEqual({ ok: false, reason: 'links_not_allowed' });

    const joined = await service.joinMatch(userId, matchId);
    expect(joined).toEqual(
      expect.objectContaining({
        ok: true,
        access: 'text',
        messages: [expect.objectContaining({ content: 'Bun duel!' })],
      }),
    );
  });

  it('păstrează mesajul shadow-banned numai în istoricul autorului', async () => {
    api.getGlobalChatContext.mockResolvedValue(
      context('public', {
        shadowBannedUntil: new Date(Date.now() + 60_000).toISOString(),
      }),
    );

    const sent = await service.sendGlobal(userId, 'Mesaj sancționat');
    expect(sent).toEqual(
      expect.objectContaining({ ok: true, shadowBanned: true }),
    );
    await expect(service.recentGlobal()).resolves.toEqual([]);
    await expect(service.recentGlobal(userId)).resolves.toEqual([
      expect.objectContaining({ content: 'Mesaj sancționat', senderId: userId }),
    ]);
  });

  it('aplică mutul și reacțiilor presetate', async () => {
    api.getGlobalChatContext.mockResolvedValue(
      context('public', {
        mutedUntil: new Date(Date.now() + 60_000).toISOString(),
      }),
    );

    await expect(
      service.sendMatchReaction(userId, matchId, 'wow'),
    ).resolves.toEqual({ ok: false, reason: 'muted' });
  });
});
