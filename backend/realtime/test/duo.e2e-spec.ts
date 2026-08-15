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
  MatchState,
  PersistMatchPayload,
  RoundResultPayload,
} from '../src/game/game.types';
import { RedisService } from '../src/redis/redis.service';

const jwtSecret = 'realtime_integration_access_secret';
// Redis-ul containerizat din `infra/` ascultă pe 6380; 6379 este ocupat pe
// mașinile care rulează un serviciu Redis local.
const redisUrl = process.env.TEST_REDIS_URL ?? 'redis://localhost:6380/15';
const firstUserId = '11111111-1111-4111-8111-111111111111';
const secondUserId = '22222222-2222-4222-8222-222222222222';
const totalRounds = 3;

jest.setTimeout(30_000);

function questionForRound(round: number): InternalQuestion {
  return {
    id: `33333333-3333-4333-8333-00000000000${round}`,
    type: 'MULTIPLE_CHOICE',
    categoryId: '44444444-4444-4444-8444-444444444444',
    difficulty: 1,
    text: `Întrebarea rundei ${round}?`,
    options: ['3', '4', '5', '6'],
    correctAnswer: '4',
    language: 'ro',
  };
}

function waitForEvent<T>(socket: Socket, event: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Evenimentul ${event} nu a fost primit.`)),
      8_000,
    );
    socket.once(event, (payload: T) => {
      clearTimeout(timeout);
      resolve(payload);
    });
  });
}

interface RoundStartedPayload {
  matchId: string;
  roundNumber: number;
  totalRounds: number;
  deadlineAt: string;
  question: Record<string, unknown>;
}

describe('Duo realtime flow (e2e)', () => {
  let app: INestApplication;
  let redis: RedisService;
  let firstClient: Socket;
  let secondClient: Socket;
  let persistedPayload: PersistMatchPayload | undefined;
  let servedQuestions = 0;

  /// Contul implicit din teste: email confirmat, adult, fără restricții.
  function verifiedCapabilities(isVerified = true) {
    return {
      emailVerified: isVerified,
      isMinor: false,
      canPlayRanked: isVerified,
      canUseGlobalChat: isVerified,
      canPostExternalLinks: false,
      dmPermissionLocked: false,
    };
  }

  const api = {
    getRandomQuestion: jest.fn(),
    persistMatch: jest.fn(),
    getCapabilities: jest.fn(),
  };

  function resetApiMocks(): void {
    servedQuestions = 0;
    api.getRandomQuestion.mockImplementation(() => {
      servedQuestions += 1;
      return Promise.resolve(questionForRound(servedQuestions));
    });
    api.persistMatch.mockImplementation((payload: PersistMatchPayload) => {
      persistedPayload = payload;
      return Promise.resolve();
    });
    // Implicit, conturile din teste au emailul confirmat; testul de refuz
    // își schimbă singur valoarea.
    api.getCapabilities.mockResolvedValue(verifiedCapabilities());
  }

  beforeAll(async () => {
    process.env.REDIS_URL = redisUrl;
    process.env.API_BASE_URL = 'http://localhost:3000';
    process.env.JWT_ACCESS_SECRET = jwtSecret;
    process.env.INTERNAL_API_KEY = 'realtime_integration_internal_key';
    process.env.ROUND_DURATION_MS = '5000';
    process.env.MATCH_STATE_TTL_SECONDS = '120';
    process.env.MATCH_TOTAL_ROUNDS = String(totalRounds);

    resetApiMocks();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ApiClientService)
      .useValue(api)
      .compile();

    app = moduleRef.createNestApplication();
    await app.listen(0, '127.0.0.1');
    redis = app.get(RedisService);
    await redis.client.flushdb();
  });

  afterEach(async () => {
    firstClient?.disconnect();
    secondClient?.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 50));
    await redis.client.flushdb();
    jest.clearAllMocks();
    persistedPayload = undefined;
    resetApiMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  async function connectPair(): Promise<{
    matchId: string;
    firstRound: RoundStartedPayload;
  }> {
    const jwt = app.get(JwtService);
    const firstToken = await jwt.signAsync(
      { sub: firstUserId, email: 'primul@example.test' },
      { secret: jwtSecret, expiresIn: '5m' },
    );
    const secondToken = await jwt.signAsync(
      { sub: secondUserId, email: 'aldoilea@example.test' },
      { secret: jwtSecret, expiresIn: '5m' },
    );
    const httpServer = app.getHttpServer() as HttpServer;
    const address = httpServer.address() as AddressInfo;
    const namespaceUrl = `http://127.0.0.1:${address.port}/game`;

    firstClient = io(namespaceUrl, {
      autoConnect: false,
      transports: ['websocket'],
      auth: { token: firstToken },
    });
    secondClient = io(namespaceUrl, {
      autoConnect: false,
      transports: ['websocket'],
      auth: { token: secondToken },
    });
    const firstReady = waitForEvent(firstClient, 'session:ready');
    const secondReady = waitForEvent(secondClient, 'session:ready');
    firstClient.connect();
    secondClient.connect();
    await Promise.all([firstReady, secondReady]);

    const firstMatch = waitForEvent<{
      matchId: string;
      totalRounds: number;
      players: Array<{ userId: string }>;
    }>(firstClient, 'match:found');
    const secondMatch = waitForEvent<{ matchId: string }>(
      secondClient,
      'match:found',
    );
    // Prima rundă pornește imediat după match:found, deci ascultătorul trebuie
    // înregistrat înainte de intrarea în coadă.
    const firstRound = waitForEvent<RoundStartedPayload>(
      firstClient,
      'round:started',
    );

    firstClient.emit('matchmaking:join', { mode: 'duo' });
    secondClient.emit('matchmaking:join', { mode: 'duo' });
    const [matchForFirst, matchForSecond, round] = await Promise.all([
      firstMatch,
      secondMatch,
      firstRound,
    ]);

    expect(matchForFirst.matchId).toBe(matchForSecond.matchId);
    expect(matchForFirst.totalRounds).toBe(totalRounds);
    expect(matchForFirst.players.map((player) => player.userId).sort()).toEqual(
      [firstUserId, secondUserId].sort(),
    );
    return { matchId: matchForFirst.matchId, firstRound: round };
  }

  it('joacă o partidă duo completă, rundă cu rundă, pe adevărul serverului', async () => {
    const { matchId, firstRound } = await connectPair();

    expect(firstRound.matchId).toBe(matchId);
    expect(firstRound.roundNumber).toBe(1);
    expect(firstRound.totalRounds).toBe(totalRounds);
    expect(firstRound.question).not.toHaveProperty('correctAnswer');

    const seenQuestionIds = new Set<string>([firstRound.question.id as string]);

    for (let round = 1; round <= totalRounds; round += 1) {
      const roundResult = waitForEvent<RoundResultPayload>(
        firstClient,
        'round:result',
      );
      const nextRound =
        round < totalRounds
          ? waitForEvent<RoundStartedPayload>(firstClient, 'round:started')
          : null;
      const finished =
        round === totalRounds
          ? waitForEvent<{ matchId: string; roundsPlayed: number }>(
              secondClient,
              'match:finished',
            )
          : null;

      firstClient.emit('round:answer', { matchId, answer: '4' });
      secondClient.emit('round:answer', { matchId, answer: '5' });

      const result = await roundResult;
      expect(result.roundNumber).toBe(round);
      expect(result.totalRounds).toBe(totalRounds);
      // Răspunsul corect se dezvăluie abia după închiderea rundei.
      expect(result.correctAnswer).toBe('4');
      expect(result.players).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            userId: firstUserId,
            score: round,
            territoriesWon: round,
            isCorrect: true,
            answer: '4',
          }),
          expect.objectContaining({
            userId: secondUserId,
            score: 0,
            territoriesWon: 0,
            isCorrect: false,
            answer: '5',
          }),
        ]),
      );

      if (nextRound) {
        const started = await nextRound;
        expect(started.roundNumber).toBe(round + 1);
        // Nicio întrebare nu se repetă în aceeași partidă.
        expect(seenQuestionIds.has(started.question.id as string)).toBe(false);
        seenQuestionIds.add(started.question.id as string);
        expect(api.persistMatch).not.toHaveBeenCalled();
      }
      if (finished) {
        const payload = await finished;
        expect(payload.matchId).toBe(matchId);
        expect(payload.roundsPlayed).toBe(totalRounds);
      }
    }

    expect(api.persistMatch).toHaveBeenCalledTimes(1);
    if (!persistedPayload) {
      throw new Error('Payload-ul de persistare nu a fost capturat.');
    }
    expect(persistedPayload.mode).toBe('DUO');
    expect(persistedPayload.players).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: firstUserId,
          result: 'WIN',
          score: totalRounds,
          territoriesWon: totalRounds,
        }),
        expect.objectContaining({
          userId: secondUserId,
          result: 'LOSS',
          score: 0,
        }),
      ]),
    );

    const stored = await redis.client.get(
      `quizrealm:realtime:match:${matchId}`,
    );
    expect(stored).not.toBeNull();
    const state = JSON.parse(stored!) as MatchState;
    expect(state.status).toBe('finished');
    expect(state.roundNumber).toBe(totalRounds);
    expect(state.usedQuestionIds).toHaveLength(totalRounds);
  });

  /// §1.3: ranked-ul cere email confirmat. Poarta stă în server, nu în
  /// aplicație — un client modificat n-are ce ocoli.
  it('refuză intrarea în coadă dacă emailul nu e confirmat', async () => {
    api.getCapabilities.mockResolvedValue(verifiedCapabilities(false));

    const jwt = app.get(JwtService);
    const token = await jwt.signAsync(
      { sub: firstUserId, email: 'neconfirmat@example.test' },
      { secret: jwtSecret, expiresIn: '5m' },
    );
    const address = (
      app.getHttpServer() as HttpServer
    ).address() as AddressInfo;
    firstClient = io(`http://127.0.0.1:${address.port}/game`, {
      autoConnect: false,
      transports: ['websocket'],
      auth: { token },
    });
    const ready = waitForEvent(firstClient, 'session:ready');
    firstClient.connect();
    await ready;

    const rejected = waitForEvent<{ mode: string; reason: string }>(
      firstClient,
      'matchmaking:rejected',
    );
    firstClient.emit('matchmaking:join', { mode: 'duo' });
    expect(await rejected).toEqual({
      mode: 'duo',
      reason: 'email_not_verified',
    });

    // Și, mai important decât mesajul: n-a ajuns în coadă.
    expect(await redis.client.zcard('quizrealm:realtime:matchmaking:duo')).toBe(
      0,
    );
  });
});
