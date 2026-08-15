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
  MatchSnapshotPayload,
  MatchState,
  PersistMatchPayload,
} from '../src/game/game.types';
import { RedisService } from '../src/redis/redis.service';

const jwtSecret = 'realtime_reconnect_access_secret';
const redisUrl = process.env.TEST_REDIS_URL ?? 'redis://localhost:6380/14';
const firstUserId = '55555555-5555-4555-8555-555555555555';
const secondUserId = '66666666-6666-4666-8666-666666666666';
const totalRounds = 3;
// Fereastra reală e 60-90 s (`init.md`); în test o scurtăm ca proba de abandon
// să nu dureze un minut.
const reconnectGraceMs = 3_000;

jest.setTimeout(40_000);

function questionForRound(round: number): InternalQuestion {
  return {
    id: `77777777-7777-4777-8777-00000000000${round}`,
    type: 'MULTIPLE_CHOICE',
    categoryId: '88888888-8888-4888-8888-888888888888',
    difficulty: 1,
    text: `Întrebarea rundei ${round}?`,
    options: ['3', '4', '5', '6'],
    correctAnswer: '4',
    language: 'ro',
  };
}

function waitForEvent<T>(
  socket: Socket,
  event: string,
  ms = 12_000,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Evenimentul ${event} nu a fost primit.`)),
      ms,
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
  deadlineAt: string;
  question: { id: string };
}

interface PausedPayload {
  matchId: string;
  disconnectedUserId: string;
  resumeDeadlineAt: string;
}

interface ResumedPayload {
  matchId: string;
  reconnectedUserId: string;
  deadlineAt: string;
}

interface FinishedPayload {
  matchId: string;
  roundsPlayed: number;
  endedBy: 'rounds' | 'forfeit';
  players: PersistMatchPayload['players'];
}

describe('Reconectare în partidă duo (e2e)', () => {
  let app: INestApplication;
  let redis: RedisService;
  let firstClient: Socket;
  let secondClient: Socket;
  let namespaceUrl: string;
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
    process.env.INTERNAL_API_KEY = 'realtime_reconnect_internal_key';
    // Runda trebuie să fie mai lungă decât pauza, ca proba să testeze
    // reconectarea, nu expirarea rundei.
    process.env.ROUND_DURATION_MS = '25000';
    process.env.MATCH_STATE_TTL_SECONDS = '120';
    process.env.MATCH_TOTAL_ROUNDS = String(totalRounds);
    process.env.RECONNECT_GRACE_MS = String(reconnectGraceMs);

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

    const address = (
      app.getHttpServer() as HttpServer
    ).address() as AddressInfo;
    namespaceUrl = `http://127.0.0.1:${address.port}/game`;
  });

  afterEach(async () => {
    firstClient?.disconnect();
    secondClient?.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 80));
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
      { sub: firstUserId, email: 'gazda@example.test' },
      { secret: jwtSecret, expiresIn: '10m' },
    );
    const secondToken = await jwt.signAsync(
      { sub: secondUserId, email: 'oaspete@example.test' },
      { secret: jwtSecret, expiresIn: '10m' },
    );

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

    const firstReady = waitForEvent<{ activeMatchId: string | null }>(
      firstClient,
      'session:ready',
    );
    const secondReady = waitForEvent<{ activeMatchId: string | null }>(
      secondClient,
      'session:ready',
    );
    firstClient.connect();
    secondClient.connect();
    const [firstSession, secondSession] = await Promise.all([
      firstReady,
      secondReady,
    ]);
    // Fără partidă în desfășurare, clientul intră normal în coadă.
    expect(firstSession.activeMatchId).toBeNull();
    expect(secondSession.activeMatchId).toBeNull();

    const found = waitForEvent<{ matchId: string }>(firstClient, 'match:found');
    const firstRound = waitForEvent<RoundStartedPayload>(
      firstClient,
      'round:started',
    );
    firstClient.emit('matchmaking:join', { mode: 'duo' });
    secondClient.emit('matchmaking:join', { mode: 'duo' });
    const [match, round] = await Promise.all([found, firstRound]);
    return { matchId: match.matchId, firstRound: round };
  }

  it('păstrează locul jucătorului deconectat și reia partida la revenire', async () => {
    const { matchId, firstRound } = await connectPair();

    // Runda 1 se închide normal, ca partida să aibă scor acumulat înainte de
    // deconectare.
    const firstResult = waitForEvent(firstClient, 'round:result');
    const secondRound = waitForEvent<RoundStartedPayload>(
      firstClient,
      'round:started',
    );
    firstClient.emit('round:answer', { matchId, answer: '4' });
    secondClient.emit('round:answer', { matchId, answer: '5' });
    await firstResult;
    const round2 = await secondRound;
    expect(round2.roundNumber).toBe(2);
    expect(round2.question.id).not.toBe(firstRound.question.id);

    // Al doilea jucător cade din rețea în mijlocul rundei 2.
    const paused = waitForEvent<PausedPayload>(firstClient, 'match:paused');
    secondClient.disconnect();
    const pausePayload = await paused;
    expect(pausePayload.matchId).toBe(matchId);
    expect(pausePayload.disconnectedUserId).toBe(secondUserId);
    expect(Date.parse(pausePayload.resumeDeadlineAt)).toBeGreaterThan(
      Date.now(),
    );

    const pausedState = JSON.parse(
      (await redis.client.get(`quizrealm:realtime:match:${matchId}`))!,
    ) as MatchState;
    expect(pausedState.status).toBe('paused');
    // Locul îi rămâne rezervat: cheia de partidă activă nu se șterge.
    expect(
      await redis.client.get(`quizrealm:realtime:user:${secondUserId}:match`),
    ).toBe(matchId);

    await new Promise((resolve) => setTimeout(resolve, 400));

    // Revine în fereastra de grație.
    const snapshot = waitForEvent<MatchSnapshotPayload>(
      secondClient,
      'match:state',
    );
    const resumed = waitForEvent<ResumedPayload>(firstClient, 'match:resumed');
    const secondSession = waitForEvent<{ activeMatchId: string | null }>(
      secondClient,
      'session:ready',
    );
    secondClient.connect();

    expect((await secondSession).activeMatchId).toBe(matchId);
    const state = await snapshot;
    expect(state.matchId).toBe(matchId);
    expect(state.status).toBe('active');
    expect(state.roundNumber).toBe(2);
    expect(state.totalRounds).toBe(totalRounds);
    expect(state.question.id).toBe(round2.question.id);
    // Instantaneul nu scapă niciun secret al rundei în curs.
    expect(state.question).not.toHaveProperty('correctAnswer');
    expect(state.players).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: firstUserId,
          score: 1,
          territoriesWon: 1,
          hasAnswered: false,
          connected: true,
        }),
        expect.objectContaining({
          userId: secondUserId,
          score: 0,
          hasAnswered: false,
          connected: true,
        }),
      ]),
    );

    const resumePayload = await resumed;
    // Timpul petrecut în pauză se adaugă la rundă, nu se pierde.
    expect(Date.parse(resumePayload.deadlineAt)).toBeGreaterThan(
      Date.parse(round2.deadlineAt),
    );
    expect(resumePayload.reconnectedUserId).toBe(secondUserId);

    // Partida continuă normal: runda 2 se poate juca după reconectare.
    const secondResult = waitForEvent<{ roundNumber: number }>(
      firstClient,
      'round:result',
    );
    firstClient.emit('round:answer', { matchId, answer: '4' });
    secondClient.emit('round:answer', { matchId, answer: '4' });
    expect((await secondResult).roundNumber).toBe(2);
    expect(api.persistMatch).not.toHaveBeenCalled();
  });

  it('acordă victoria prin abandon dacă jucătorul nu revine în fereastra de grație', async () => {
    const { matchId } = await connectPair();

    const paused = waitForEvent<PausedPayload>(firstClient, 'match:paused');
    const finished = waitForEvent<FinishedPayload>(
      firstClient,
      'match:finished',
      reconnectGraceMs + 8_000,
    );
    secondClient.disconnect();
    await paused;

    const payload = await finished;
    expect(payload.matchId).toBe(matchId);
    expect(payload.endedBy).toBe('forfeit');
    expect(payload.players).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: firstUserId, result: 'WIN' }),
        expect.objectContaining({ userId: secondUserId, result: 'LOSS' }),
      ]),
    );

    expect(api.persistMatch).toHaveBeenCalledTimes(1);
    expect(persistedPayload?.players).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: firstUserId, result: 'WIN' }),
        expect.objectContaining({ userId: secondUserId, result: 'LOSS' }),
      ]),
    );

    const state = JSON.parse(
      (await redis.client.get(`quizrealm:realtime:match:${matchId}`))!,
    ) as MatchState;
    expect(state.status).toBe('finished');
    // După încheiere, locul nu mai e rezervat nimănui.
    expect(
      await redis.client.get(`quizrealm:realtime:user:${secondUserId}:match`),
    ).toBeNull();
  });
});
