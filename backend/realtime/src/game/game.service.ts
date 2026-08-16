import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { WsException } from '@nestjs/websockets';
import { randomUUID } from 'node:crypto';
import { Namespace, Socket } from 'socket.io';
import { ApiClientService } from '../api-client/api-client.service';
import { RedisService } from '../redis/redis.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import {
  MatchEndReason,
  MatchSnapshotPayload,
  MatchState,
  PersistMatchPayload,
  PublicQuestion,
  RoundResultPayload,
} from './game.types';
import { canAttack, resolveAttacks } from './battle-resolution';
import { isSpectator, newlyEliminated } from './elimination';
import { buildTerritoryMap } from './territory-map';
import {
  attackableBy,
  claimTerritory,
  initialOwnership,
  phaseFor,
  pickContestedTerritory,
  territoryCounts,
} from './territory-state';
import {
  assertMatchParticipants,
  DUO_MATCH_PROFILE,
  MatchProfile,
} from './match-profile';
import { MatchmakingService } from './matchmaking.service';
import { calculateRoundAwards } from './scoring';

const KEY_PREFIX = 'quizrealm:realtime';

@Injectable()
export class GameService {
  private readonly roundDurationMs: number;
  private readonly matchTtlSeconds: number;
  private readonly totalRounds: number;
  private readonly reconnectGraceMs: number;
  private server?: Namespace;

  constructor(
    private readonly redis: RedisService,
    private readonly api: ApiClientService,
    private readonly matchmaking: MatchmakingService,
    config: ConfigService,
  ) {
    this.roundDurationMs = Number(config.get('ROUND_DURATION_MS', 12_000));
    this.matchTtlSeconds = Number(config.get('MATCH_STATE_TTL_SECONDS', 3_600));
    this.totalRounds = Math.max(
      1,
      Number(config.get('MATCH_TOTAL_ROUNDS', 5)) || 5,
    );
    // `init.md` cere păstrarea locului 60-90s; implicitul stă la mijlocul benzii.
    // Plafonul e 90s; valorile mai mici sunt permise doar pentru teste.
    const configuredGrace = Number(config.get('RECONNECT_GRACE_MS', 75_000));
    this.reconnectGraceMs = Math.min(
      90_000,
      Math.max(
        1_000,
        Number.isFinite(configuredGrace) && configuredGrace > 0
          ? configuredGrace
          : 75_000,
      ),
    );
  }

  attachServer(server: Namespace): void {
    this.server = server;
  }

  async createMatch(
    userIds: string[],
    profile: MatchProfile = DUO_MATCH_PROFILE,
    categoryCodes: string[] = [],
  ): Promise<MatchState> {
    try {
      assertMatchParticipants(userIds, profile);
    } catch (error) {
      throw new WsException((error as Error).message);
    }
    const socketIds = await Promise.all(
      userIds.map((userId) => this.matchmaking.getSocketId(userId)),
    );
    const connectedUserIds = userIds.filter((_, index) => socketIds[index]);
    if (connectedUserIds.length !== profile.playerCountTarget) {
      await this.matchmaking.requeue(connectedUserIds, profile);
      throw new WsException(
        'Cel puțin un jucător s-a deconectat înainte de start.',
      );
    }

    const question = await this.api.getRandomQuestion(categoryCodes);
    const startedAt = new Date();
    const state: MatchState = {
      id: randomUUID(),
      mode: profile.persistedMode,
      playerCountTarget: profile.playerCountTarget,
      lobbyType: profile.lobbyType,
      resolutionPolicy: profile.resolutionPolicy,
      status: 'active',
      mapId: 'realm-alpha',
      roundNumber: 1,
      totalRounds: this.totalRounds,
      startedAt: startedAt.toISOString(),
      roundStartedAt: startedAt.toISOString(),
      deadlineAt: new Date(
        startedAt.getTime() + this.roundDurationMs,
      ).toISOString(),
      question,
      categoryCodes,
      usedQuestionIds: [question.id],
      players: userIds.map((userId, index) => ({
        userId,
        socketId: socketIds[index]!,
        score: 0,
        territoriesWon: 0,
        correctAnswers: 0,
      })),
    };

    // Harta există doar la Clasic. Duo are doi jucători și niciun teritoriu de
    // disputat; a-i inventa o hartă ar schimba un mod care funcționează.
    if (profile.clientMode === 'classic') {
      const map = buildTerritoryMap(userIds);
      const ownership = initialOwnership(map);
      state.territory = {
        map,
        ownership,
        contestedTerritoryId: pickContestedTerritory(map, ownership),
      };
      const counts = territoryCounts(ownership, userIds);
      for (const player of state.players) {
        player.territoriesWon = counts[player.userId] ?? 0;
      }
    }

    await this.redis.client.set(
      this.matchKey(state.id),
      JSON.stringify(state),
      'EX',
      this.matchTtlSeconds,
    );
    await Promise.all(
      userIds.map((userId) =>
        this.matchmaking.setActiveMatch(userId, state.id, this.matchTtlSeconds),
      ),
    );

    const server = this.getServer();
    for (const player of state.players) {
      const socket = server.sockets.get(player.socketId);
      if (socket) {
        await socket.join(this.matchRoom(state.id));
      }
    }
    server.to(this.matchRoom(state.id)).emit('match:found', {
      matchId: state.id,
      mode: profile.clientMode,
      playerCountTarget: profile.playerCountTarget,
      lobbyType: profile.lobbyType,
      totalRounds: state.totalRounds,
      players: state.players.map((player) => ({ userId: player.userId })),
    });
    this.emitRoundStarted(state);
    return state;
  }

  /// Înregistrează ținta de atac a unui jucător pentru runda de luptă curentă.
  async declareAttack(userId: string, matchId: string, territoryId: string) {
    await this.withMatchLock(matchId, async () => {
      const state = await this.loadMatch(matchId);
      if (state.status !== 'active') {
        throw new WsException('Partida nu mai este activă.');
      }
      if (!state.territory) {
        throw new WsException('Modul acesta nu are hartă de cucerit.');
      }
      if (phaseFor(state.territory.ownership) !== 'battle') {
        throw new WsException('Faza de luptă nu a început încă.');
      }
      if (isSpectator(userId, state.eliminated ?? [])) {
        throw new WsException('Ești în mod spectator și nu mai poți ataca.');
      }
      if (!state.players.some((player) => player.userId === userId)) {
        throw new WsException('Jucătorul nu aparține acestei partide.');
      }

      const attackable = attackableBy(
        state.territory.map,
        state.territory.ownership,
        userId,
      );
      if (!canAttack(userId, territoryId, attackable)) {
        throw new WsException('Teritoriul nu e la granița ta.');
      }

      state.territory.attacks = {
        ...(state.territory.attacks ?? {}),
        [userId]: territoryId,
      };
      await this.saveMatch(state);
    });
  }

  async submitAnswer(userId: string, dto: SubmitAnswerDto): Promise<void> {
    await this.withMatchLock(dto.matchId, async () => {
      const state = await this.loadMatch(dto.matchId);
      if (state.status !== 'active') {
        throw new WsException('Partida nu mai este activă.');
      }
      if (Date.now() > Date.parse(state.deadlineAt)) {
        throw new WsException('Timpul rundei a expirat.');
      }
      const player = state.players.find((entry) => entry.userId === userId);
      if (!player) {
        throw new WsException('Jucătorul nu aparține acestei partide.');
      }
      if (player.answer) {
        throw new WsException('Răspunsul a fost deja înregistrat.');
      }
      // Eliminatul rămâne în partidă și o vede mai departe, dar nu mai
      // influențează rezultatul (§12.6). Verificarea stă pe server: clientul
      // poate ascunde butoanele, dar nu poate fi crezut pe cuvânt.
      if (isSpectator(userId, state.eliminated ?? [])) {
        throw new WsException('Ești în mod spectator și nu mai poți răspunde.');
      }

      const normalizedAnswer = dto.answer.trim();
      if (!normalizedAnswer) {
        throw new WsException('Răspunsul nu poate fi gol.');
      }
      player.answer = {
        value: normalizedAnswer,
        responseTimeMs: Date.now() - Date.parse(state.roundStartedAt),
        isCorrect: false,
      };
      if (
        state.resolutionPolicy !== 'deadline' &&
        state.players.every((entry) => entry.answer)
      ) {
        await this.resolveRound(state);
      } else {
        // FFA rămâne deschis până la deadline. Rezolvarea unică de sub lock
        // vede toate răspunsurile aceleiași ferestre fixe (§12.14).
        await this.saveMatch(state);
      }
    });
  }

  /// Pune partida în pauză când un jucător pierde conexiunea. Locul îi rămâne
  /// rezervat până la `resumeDeadlineAt`; partida nu se închide imediat.
  async handleDisconnect(userId: string, socketId: string): Promise<void> {
    const matchId = await this.matchmaking.getActiveMatch(userId);
    if (!matchId) return;

    await this.withMatchLock(matchId, async () => {
      const state = await this.loadMatch(matchId);
      if (state.status !== 'active' && state.status !== 'paused') return;
      const player = state.players.find((entry) => entry.userId === userId);
      // Socket vechi închis după ce clientul s-a reconectat deja: îl ignorăm,
      // altfel am pune în pauză o partidă care tocmai a repornit.
      if (!player || player.socketId !== socketId) return;

      const now = new Date();
      player.disconnectedAt = now.toISOString();
      if (state.status === 'active') {
        state.status = 'paused';
        state.pausedAt = now.toISOString();
        state.resumeDeadlineAt = new Date(
          now.getTime() + this.reconnectGraceMs,
        ).toISOString();
      }
      await this.saveMatch(state);

      this.getServer().to(this.matchRoom(state.id)).emit('match:paused', {
        matchId: state.id,
        disconnectedUserId: userId,
        resumeDeadlineAt: state.resumeDeadlineAt,
      });
    }).catch(() => undefined);
  }

  /// Repune jucătorul în partida lui, dacă mai are una. Întoarce `true` dacă
  /// sesiunea a fost reluată, ca gateway-ul să nu-l trimită înapoi în coadă.
  async resumeMatch(userId: string, socket: Socket): Promise<boolean> {
    const matchId = await this.matchmaking.getActiveMatch(userId);
    if (!matchId) return false;

    return this.withMatchLock(matchId, async () => {
      const state = await this.loadMatch(matchId);
      if (state.status !== 'active' && state.status !== 'paused') return false;
      const player = state.players.find((entry) => entry.userId === userId);
      if (!player) return false;

      player.socketId = socket.id;
      delete player.disconnectedAt;
      await socket.join(this.matchRoom(state.id));

      const stillMissing = state.players.some((entry) => entry.disconnectedAt);
      const resumed = state.status === 'paused' && !stillMissing;
      if (resumed) {
        // Timpul petrecut în pauză nu se scade din runda curentă, nici pentru
        // jucătorul rămas conectat.
        const pausedMs = Date.now() - Date.parse(state.pausedAt!);
        state.roundStartedAt = new Date(
          Date.parse(state.roundStartedAt) + pausedMs,
        ).toISOString();
        state.deadlineAt = new Date(
          Date.parse(state.deadlineAt) + pausedMs,
        ).toISOString();
        state.status = 'active';
        delete state.pausedAt;
        delete state.resumeDeadlineAt;
      }
      await this.saveMatch(state);

      socket.emit('match:state', this.toSnapshot(state));
      if (resumed) {
        this.getServer().to(this.matchRoom(state.id)).emit('match:resumed', {
          matchId: state.id,
          reconnectedUserId: userId,
          deadlineAt: state.deadlineAt,
        });
      }
      return true;
    }).catch(() => false);
  }

  @Interval(1_000)
  async finalizeExpiredMatches(): Promise<void> {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await this.redis.client.scan(
        cursor,
        'MATCH',
        this.matchKey('*'),
        'COUNT',
        100,
      );
      cursor = nextCursor;
      for (const key of keys) {
        const raw = await this.redis.client.get(key);
        if (!raw) continue;
        const state = JSON.parse(raw) as MatchState;
        if (
          state.status === 'active' &&
          Date.now() >= Date.parse(state.deadlineAt)
        ) {
          await this.withMatchLock(state.id, async () => {
            const current = await this.loadMatch(state.id);
            if (
              current.status === 'active' &&
              Date.now() >= Date.parse(current.deadlineAt)
            ) {
              await this.resolveRound(current);
            }
          }).catch(() => undefined);
        } else if (this.graceExpired(state)) {
          await this.withMatchLock(state.id, async () => {
            const current = await this.loadMatch(state.id);
            if (this.graceExpired(current)) {
              await this.finalizeMatch(current, 'forfeit');
            }
          }).catch(() => undefined);
        }
      }
    } while (cursor !== '0');
  }

  private graceExpired(state: MatchState): boolean {
    return (
      state.status === 'paused' &&
      state.resumeDeadlineAt !== undefined &&
      Date.now() >= Date.parse(state.resumeDeadlineAt)
    );
  }

  /// Închide runda curentă: punctează, anunță rezultatul și fie pornește runda
  /// următoare, fie încheie partida.
  private async resolveRound(state: MatchState): Promise<void> {
    this.scoreRound(state);

    const result: RoundResultPayload = {
      matchId: state.id,
      roundNumber: state.roundNumber,
      totalRounds: state.totalRounds,
      correctAnswer: state.question.correctAnswer,
      players: state.players.map((player) => ({
        userId: player.userId,
        score: player.score,
        territoriesWon: player.territoriesWon,
        isCorrect: player.answer?.isCorrect ?? false,
        answer: player.answer?.value ?? null,
        responseTimeMs: player.answer?.responseTimeMs ?? null,
      })),
      ...(state.territory
        ? {
            territory: {
              ownership: state.territory.ownership,
              contestedTerritoryId: state.territory.contestedTerritoryId,
            },
            eliminatedUserIds: (state.eliminated ?? [])
              .filter((record) => record.roundNumber === state.roundNumber)
              .map((record) => record.userId),
            conquests: state.lastConquests ?? [],
          }
        : {}),
    };
    this.getServer().to(this.matchRoom(state.id)).emit('round:result', result);

    if (state.roundNumber >= state.totalRounds) {
      await this.finalizeMatch(state);
      return;
    }
    await this.startNextRound(state);
  }

  /// Trece partida la runda următoare, cu o întrebare nefolosită încă.
  private async startNextRound(state: MatchState): Promise<void> {
    let question: MatchState['question'];
    try {
      question = await this.pickUnusedQuestion(state);
    } catch {
      // Fără întrebări noi, partida se încheie cinstit cu scorul de până acum.
      await this.finalizeMatch(state);
      return;
    }

    const roundStartedAt = new Date();
    state.roundNumber += 1;
    state.roundStartedAt = roundStartedAt.toISOString();
    state.deadlineAt = new Date(
      roundStartedAt.getTime() + this.roundDurationMs,
    ).toISOString();
    state.question = question;
    state.usedQuestionIds.push(question.id);
    for (const player of state.players) {
      delete player.answer;
    }

    await this.saveMatch(state);
    this.emitRoundStarted(state);
  }

  /// Cere întrebări până găsește una nefolosită în partida curentă.
  private async pickUnusedQuestion(
    state: MatchState,
  ): Promise<MatchState['question']> {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const question = await this.api.getRandomQuestion(
        state.categoryCodes ?? [],
      );
      if (!state.usedQuestionIds.includes(question.id)) return question;
    }
    throw new Error('Banca de întrebări nu a livrat o întrebare nefolosită.');
  }

  private emitRoundStarted(state: MatchState): void {
    this.getServer()
      .to(this.matchRoom(state.id))
      .emit('round:started', {
        matchId: state.id,
        roundNumber: state.roundNumber,
        totalRounds: state.totalRounds,
        deadlineAt: state.deadlineAt,
        question: this.toPublicQuestion(state.question),
      });
  }

  private async finalizeMatch(
    state: MatchState,
    endedBy: MatchEndReason = 'rounds',
  ): Promise<void> {
    const payload: PersistMatchPayload = {
      mode: state.mode,
      mapId: state.mapId,
      startedAt: state.startedAt,
      endedAt: new Date().toISOString(),
      players: this.buildResults(state, endedBy),
    };

    try {
      await this.api.persistMatch(payload);
      state.status = 'finished';
      await this.saveMatch(state);
    } catch (error) {
      state.status = 'persistence_failed';
      await this.saveMatch(state);
      this.getServer().to(this.matchRoom(state.id)).emit('match:error', {
        matchId: state.id,
        message: 'Rezultatul nu a putut fi persistat.',
      });
      throw error;
    }

    this.getServer().to(this.matchRoom(state.id)).emit('match:finished', {
      matchId: state.id,
      roundsPlayed: state.roundNumber,
      endedBy,
      players: payload.players,
    });
    await Promise.all(
      state.players.map((player) =>
        this.matchmaking.clearActiveMatch(player.userId),
      ),
    );
  }

  /// Rezultatul per jucător: după scor la final de runde, după prezență la
  /// abandon. Nimeni nu câștigă prin abandon dacă au plecat toți.
  private buildResults(
    state: MatchState,
    endedBy: MatchEndReason,
  ): PersistMatchPayload['players'] {
    if (endedBy === 'forfeit') {
      const present = state.players.filter((player) => !player.disconnectedAt);
      const decided =
        present.length > 0 && present.length < state.players.length;
      return state.players.map((player) => ({
        userId: player.userId,
        territoriesWon: player.territoriesWon,
        score: player.score,
        correctAnswers: player.correctAnswers,
        result: !decided ? 'DRAW' : player.disconnectedAt ? 'LOSS' : 'WIN',
      }));
    }

    const ranking = state.players.map((player) => ({
      player,
      rank: player.territoriesWon * 10_000 + player.score,
    }));
    const bestRank = Math.max(...ranking.map((entry) => entry.rank));
    const winners = ranking.filter((entry) => entry.rank === bestRank);
    return state.players.map((player) => ({
      userId: player.userId,
      territoriesWon: player.territoriesWon,
      score: player.score,
      correctAnswers: player.correctAnswers,
      result:
        winners.length === state.players.length
          ? 'DRAW'
          : winners[0].player.userId === player.userId
            ? 'WIN'
            : 'LOSS',
    }));
  }

  private toSnapshot(state: MatchState): MatchSnapshotPayload {
    return {
      matchId: state.id,
      mode: state.mode === 'DUO' ? 'duo' : 'classic',
      playerCountTarget: state.playerCountTarget,
      lobbyType: state.lobbyType,
      status: state.status === 'paused' ? 'paused' : 'active',
      roundNumber: state.roundNumber,
      totalRounds: state.totalRounds,
      deadlineAt: state.deadlineAt,
      resumeDeadlineAt: state.resumeDeadlineAt ?? null,
      question: this.toPublicQuestion(state.question),
      players: state.players.map((player) => ({
        userId: player.userId,
        score: player.score,
        territoriesWon: player.territoriesWon,
        hasAnswered: player.answer !== undefined,
        connected: player.disconnectedAt === undefined,
      })),
      // La reconectare clientul primește harta întreagă: n-o poate reconstrui
      // singur, iar fără ea ecranul de Clasic ar rămâne gol.
      ...(state.territory
        ? {
            territoryMap: state.territory.map,
            territory: {
              ownership: state.territory.ownership,
              contestedTerritoryId: state.territory.contestedTerritoryId,
            },
          }
        : {}),
    };
  }

  private scoreRound(state: MatchState): void {
    const awards = calculateRoundAwards(
      state.question.type,
      state.question.correctAnswer,
      state.players,
    );
    for (const award of awards) {
      const player = state.players.find(
        (entry) => entry.userId === award.userId,
      )!;
      if (player.answer) {
        player.answer.isCorrect = award.isCorrect;
      }
      player.score += award.scoreDelta;
      if (award.isCorrect) player.correctAnswers += 1;

      // La Clasic, teritoriul câștigat e unul **anume** de pe hartă, nu un
      // contor. La Duo rămâne contorul, ca modul existent să nu se schimbe.
      if (!state.territory) {
        player.territoriesWon += award.territoryDelta;
      } else if (
        award.territoryDelta > 0 &&
        phaseFor(state.territory.ownership) === 'capture'
      ) {
        const contested = state.territory.contestedTerritoryId;
        if (contested) {
          state.territory.ownership = claimTerritory(
            state.territory.ownership,
            contested,
            player.userId,
          );
        }
      }
    }

    // Faza de luptă are propria regulă: nu câștigă cel mai rapid din rundă, ci
    // cel mai rapid **dintre atacatorii aceleiași ținte** (§12.3 faza 2).
    if (state.territory && phaseFor(state.territory.ownership) === 'battle') {
      const answers: Record<
        string,
        { isCorrect: boolean; responseTimeMs: number | null }
      > = {};
      for (const player of state.players) {
        answers[player.userId] = {
          isCorrect: player.answer?.isCorrect ?? false,
          responseTimeMs: player.answer?.responseTimeMs ?? null,
        };
      }

      state.lastConquests = resolveAttacks(
        state.territory.attacks ?? {},
        answers,
        state.territory.ownership,
      );
      for (const conquest of state.lastConquests) {
        state.territory.ownership = claimTerritory(
          state.territory.ownership,
          conquest.territoryId,
          conquest.winnerId,
        );
      }
      // Declarațiile nu se moștenesc: fiecare rundă de luptă cere o țintă nouă.
      state.territory.attacks = {};
    } else if (state.territory) {
      state.lastConquests = [];
    }

    if (state.territory) {
      // Contoarele se recalculează din hartă, nu se incrementează: harta e
      // sursa de adevăr, iar o sumă ținută separat s-ar putea desincroniza.
      const counts = territoryCounts(
        state.territory.ownership,
        state.players.map((player) => player.userId),
      );
      for (const player of state.players) {
        player.territoriesWon = counts[player.userId] ?? 0;
      }
      state.territory.contestedTerritoryId = pickContestedTerritory(
        state.territory.map,
        state.territory.ownership,
      );

      const fresh = newlyEliminated(
        state.territory.ownership,
        state.players.map((player) => player.userId),
        state.eliminated ?? [],
      );
      if (fresh.length > 0) {
        state.eliminated = [
          ...(state.eliminated ?? []),
          ...fresh.map((userId) => ({
            userId,
            roundNumber: state.roundNumber,
          })),
        ];
      }
    }
  }

  private async loadMatch(matchId: string): Promise<MatchState> {
    const raw = await this.redis.client.get(this.matchKey(matchId));
    if (!raw) {
      throw new WsException('Partida nu există sau a expirat.');
    }
    return JSON.parse(raw) as MatchState;
  }

  private async saveMatch(state: MatchState): Promise<void> {
    await this.redis.client.set(
      this.matchKey(state.id),
      JSON.stringify(state),
      'EX',
      this.matchTtlSeconds,
    );
  }

  private async withMatchLock<T>(
    matchId: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    const lockKey = `${KEY_PREFIX}:lock:match:${matchId}`;
    const token = randomUUID();
    let acquired = false;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      acquired =
        (await this.redis.client.set(lockKey, token, 'PX', 10_000, 'NX')) ===
        'OK';
      if (acquired) break;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    if (!acquired) {
      throw new WsException('Partida este ocupată. Reîncearcă.');
    }
    try {
      return await operation();
    } finally {
      await this.redis.client.eval(
        `
          if redis.call('GET', KEYS[1]) == ARGV[1] then
            return redis.call('DEL', KEYS[1])
          end
          return 0
        `,
        1,
        lockKey,
        token,
      );
    }
  }

  private toPublicQuestion(question: MatchState['question']): PublicQuestion {
    return {
      id: question.id,
      type: question.type,
      categoryId: question.categoryId,
      difficulty: question.difficulty,
      text: question.text,
      options: question.options,
      language: question.language,
    };
  }

  private getServer(): Namespace {
    if (!this.server) {
      throw new Error('Serverul Socket.IO nu este inițializat.');
    }
    return this.server;
  }

  private matchKey(matchId: string): string {
    return `${KEY_PREFIX}:match:${matchId}`;
  }

  private matchRoom(matchId: string): string {
    return `match:${matchId}`;
  }
}
