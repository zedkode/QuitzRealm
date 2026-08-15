export function calculateEloDelta(
  playerRating: number,
  opponentRating: number,
  result: 0 | 0.5 | 1,
  kFactor = 32,
): number {
  const expected = 1 / (1 + 10 ** ((opponentRating - playerRating) / 400));
  return Math.round(kFactor * (result - expected));
}
