import { RealtimeQuestionType } from './game.types';

export interface ScoringPlayer {
  userId: string;
  answer?: {
    value: string;
    responseTimeMs: number;
  };
}

export interface RoundAward {
  userId: string;
  isCorrect: boolean;
  scoreDelta: number;
  territoryDelta: number;
}

export function calculateRoundAwards(
  type: RealtimeQuestionType,
  correctAnswer: string,
  players: ScoringPlayer[],
): RoundAward[] {
  const awards = players.map((player) => ({
    userId: player.userId,
    isCorrect: false,
    scoreDelta: 0,
    territoryDelta: 0,
  }));

  if (type === 'NUMERIC') {
    const target = Number(correctAnswer);
    const candidates = players
      .map((player, index) => ({
        index,
        distance: player.answer
          ? Math.abs(Number(player.answer.value) - target)
          : Number.NaN,
      }))
      .filter((entry) => Number.isFinite(entry.distance));
    if (candidates.length === 0) return awards;
    const minimum = Math.min(...candidates.map((entry) => entry.distance));
    const closest = candidates.filter((entry) => entry.distance === minimum);
    for (const entry of closest) {
      awards[entry.index].isCorrect = true;
      awards[entry.index].scoreDelta = 1;
    }
    if (closest.length === 1) {
      awards[closest[0].index].territoryDelta = 1;
    }
    return awards;
  }

  const normalizedCorrectAnswer = normalize(correctAnswer);
  const correctPlayers = players
    .map((player, index) => ({ player, index }))
    .filter(
      ({ player }) =>
        player.answer &&
        normalize(player.answer.value) === normalizedCorrectAnswer,
    );
  for (const entry of correctPlayers) {
    awards[entry.index].isCorrect = true;
    awards[entry.index].scoreDelta = 1;
  }
  if (correctPlayers.length > 0) {
    correctPlayers.sort(
      (left, right) =>
        left.player.answer!.responseTimeMs -
        right.player.answer!.responseTimeMs,
    );
    awards[correctPlayers[0].index].territoryDelta = 1;
  }
  return awards;
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase('ro-RO');
}
