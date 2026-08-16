import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Server as HttpServer } from 'node:http';
import { AddressInfo } from 'node:net';
import { io, Socket } from 'socket.io-client';
import { ApiClientService } from '../src/api-client/api-client.service';
import { AppModule } from '../src/app.module';
import {
  InternalQuestion,
  PersistMatchPayload,
  RoundResultPayload,
} from '../src/game/game.types';
import { RedisService } from '../src/redis/redis.service';

const jwtSecret = 'generic_match_access_secret';
const redisUrl = process.env.TEST_REDIS_URL ?? 'redis://localhost:6380/14';
const userIds = [
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444',
];

jest.setTimeout(20_000);

function waitForEvent<T>(socket: Socket, event: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Evenimentul ${event} nu a fost primit.`)),
      6_000,
    );
    socket.once(event, (payload: T) => {
      clearTimeout(timeout);
      resolve(payload);
    });
  });
}

describe('Motor generic N participanți (e2e)', () => {
  let app: INestApplication;
  let redis: RedisService;
  let clients: Socket[] = [];
  let persistedPayload: PersistMatchPayload | undefined;

  const question: InternalQuestion = {
    id: '55555555-5555-4555-8555-555555555555',
    type: 'MULTIPLE_CHOICE',
    categoryId: '66666666-6666-4666-8666-666666666666',
    difficulty: 2,
    text: 'Care este răspunsul de test?',
    options: ['1', '2', '3', '4'],
    correctAnswer: '4',
    language: 'ro',
  };
  const api = {
    getRandomQuestion: jest.fn().mockResolvedValue(question),
    persistMatch: jest.fn((payload: PersistMatchPayload) => {
      persistedPayload = payload;
      return Promise.resolve();
    }),
    getCapabilities: jest.fn().mockResolvedValue({
      emailVerified: true,
      isMinor: false,
      canPlayRanked: true,
      canUseGlobalChat: true,
      canPostExternalLinks: false,
      dmPermissionLocked: false,
    }),
    getGlobalChatContext: jest.fn(),
  };

  beforeAll(async () => {
    process.env.REDIS_URL = redisUrl;
    process.env.API_BASE_URL = 'http://localhost:3000';
    process.env.JWT_ACCESS_SECRET = jwtSecret;
    process.env.INTERNAL_API_KEY = 'generic_match_internal_key';
    process.env.ROUND_DURATION_MS = '350';
    process.env.MATCH_STATE_TTL_SECONDS = '120';
    process.env.MATCH_TOTAL_ROUNDS = '1';

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ApiClientService)
      .useValue(api)
      .compile();
    app = moduleRef.createNestApplication();
    await app.listen(0, '127.0.0.1');
    redis = app.get(RedisService);
    await redis.client.flushdb();
  });

  afterEach(async () => {
    for (const client of clients) client.disconnect();
    clients = [];
    persistedPayload = undefined;
    await new Promise((resolve) => setTimeout(resolve, 30));
    await redis.client.flushdb();
    jest.clearAllMocks();
    api.getRandomQuestion.mockResolvedValue(question);
    api.persistMatch.mockImplementation((payload: PersistMatchPayload) => {
      persistedPayload = payload;
      return Promise.resolve();
    });
    api.getCapabilities.mockResolvedValue({
      emailVerified: true,
      isMinor: false,
      canPlayRanked: true,
      canUseGlobalChat: true,
      canPostExternalLinks: false,
      dmPermissionLocked: false,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  async function connectPlayers(): Promise<Socket[]> {
    const jwt = app.get(JwtService);
    const address = (
      app.getHttpServer() as HttpServer
    ).address() as AddressInfo;
    const namespaceUrl = `http://127.0.0.1:${address.port}/game`;

    clients = await Promise.all(
      userIds.map(async (userId, index) => {
        const token = await jwt.signAsync(
          { sub: userId, email: `player${index}@example.test` },
          { secret: jwtSecret, expiresIn: '5m' },
        );
        const client = io(namespaceUrl, {
          autoConnect: false,
          transports: ['websocket'],
          auth: { token },
        });
        const ready = waitForEvent(client, 'session:ready');
        client.connect();
        await ready;
        return client;
      }),
    );
    return clients;
  }

  it('formează un lobby de 4 și rezolvă atomic runda numai la deadline', async () => {
    const connected = await connectPlayers();
    const foundEvents = connected.map((client) =>
      waitForEvent<{
        matchId: string;
        mode: string;
        playerCountTarget: number;
        players: Array<{ userId: string }>;
      }>(client, 'match:found'),
    );
    const roundStarted = waitForEvent<{
      matchId: string;
      question: Record<string, unknown>;
    }>(connected[0], 'round:started');

    for (const client of connected.slice(0, 3)) {
      const queued = waitForEvent(client, 'matchmaking:queued');
      client.emit('matchmaking:join', { mode: 'classic', playerCount: 4 });
      await queued;
    }
    expect(
      await redis.client.zcard('quizrealm:realtime:matchmaking:classic:4'),
    ).toBe(3);

    connected[3].emit('matchmaking:join', {
      mode: 'classic',
      playerCount: 4,
    });
    const [matches, round] = await Promise.all([
      Promise.all(foundEvents),
      roundStarted,
    ]);
    expect(new Set(matches.map((match) => match.matchId)).size).toBe(1);
    expect(matches[0]).toMatchObject({
      mode: 'classic',
      playerCountTarget: 4,
    });
    expect(matches[0].players).toHaveLength(4);
    expect(round.question).not.toHaveProperty('correctAnswer');

    let roundWasResolved = false;
    const resultPromise = waitForEvent<RoundResultPayload>(
      connected[0],
      'round:result',
    ).then((result) => {
      roundWasResolved = true;
      return result;
    });
    const finishedPromise = waitForEvent(connected[0], 'match:finished');
    for (const client of connected) {
      client.emit('round:answer', { matchId: round.matchId, answer: '4' });
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(roundWasResolved).toBe(false);

    const result = await resultPromise;
    await finishedPromise;
    expect(result.players).toHaveLength(4);
    expect(result.players.every((player) => player.isCorrect)).toBe(true);
    expect(api.persistMatch).toHaveBeenCalledTimes(1);
    expect(persistedPayload).toMatchObject({ mode: 'CLASSIC' });
    expect(persistedPayload?.players).toHaveLength(4);
  });
});
