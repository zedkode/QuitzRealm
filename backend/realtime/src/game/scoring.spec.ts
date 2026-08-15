import { calculateRoundAwards } from './scoring';

describe('calculateRoundAwards', () => {
  it('acordă teritoriul celui mai rapid răspuns corect la grilă', () => {
    expect(
      calculateRoundAwards('MULTIPLE_CHOICE', 'București', [
        {
          userId: 'rapid',
          answer: { value: 'bucurești', responseTimeMs: 800 },
        },
        {
          userId: 'lent',
          answer: { value: 'București', responseTimeMs: 1200 },
        },
      ]),
    ).toEqual([
      {
        userId: 'rapid',
        isCorrect: true,
        scoreDelta: 1,
        territoryDelta: 1,
      },
      {
        userId: 'lent',
        isCorrect: true,
        scoreDelta: 1,
        territoryDelta: 0,
      },
    ]);
  });

  it('acordă punctul și teritoriul celei mai apropiate estimări numerice', () => {
    const awards = calculateRoundAwards('NUMERIC', '100', [
      { userId: 'aproape', answer: { value: '98', responseTimeMs: 1000 } },
      { userId: 'departe', answer: { value: '120', responseTimeMs: 500 } },
    ]);
    expect(awards[0]).toEqual({
      userId: 'aproape',
      isCorrect: true,
      scoreDelta: 1,
      territoryDelta: 1,
    });
    expect(awards[1].isCorrect).toBe(false);
  });

  it('nu acordă teritoriul când estimările numerice sunt la egalitate', () => {
    const awards = calculateRoundAwards('NUMERIC', '100', [
      { userId: 'sub', answer: { value: '90', responseTimeMs: 500 } },
      { userId: 'peste', answer: { value: '110', responseTimeMs: 700 } },
    ]);
    expect(awards.every((award) => award.scoreDelta === 1)).toBe(true);
    expect(awards.every((award) => award.territoryDelta === 0)).toBe(true);
  });
});
