import { calculateEloDelta } from './elo';

describe('calculateEloDelta', () => {
  it('awards symmetric points when equally rated players have a winner', () => {
    expect(calculateEloDelta(1000, 1000, 1)).toBe(16);
    expect(calculateEloDelta(1000, 1000, 0)).toBe(-16);
  });

  it('awards fewer points to a higher-rated winner', () => {
    expect(calculateEloDelta(1400, 1000, 1)).toBe(3);
  });

  it('does not change equal ratings for a draw', () => {
    expect(calculateEloDelta(1000, 1000, 0.5)).toBe(0);
  });
});
