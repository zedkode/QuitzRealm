import {
  finalPlacement,
  isSpectator,
  newlyEliminated,
  type EliminationRecord,
} from './elimination';
import type { TerritoryOwnership } from './territory-state';

const players = ['a', 'b', 'c', 'd'];

describe('newlyEliminated', () => {
  it('găsește jucătorii rămași fără teritorii', () => {
    const ownership: TerritoryOwnership = { t0: 'a', t1: 'a', t2: 'b' };
    expect(newlyEliminated(ownership, players, [])).toEqual(['c', 'd']);
  });

  it('nu elimină de două ori același jucător', () => {
    // Ordinea eliminărilor decide locul final; o dublură ar falsifica-o.
    const ownership: TerritoryOwnership = { t0: 'a' };
    const already: EliminationRecord[] = [
      { userId: 'b', roundNumber: 2 },
      { userId: 'c', roundNumber: 2 },
    ];
    expect(newlyEliminated(ownership, players, already)).toEqual(['d']);
  });

  it('nimeni nu e eliminat cât toți au teritorii', () => {
    const ownership: TerritoryOwnership = {
      t0: 'a',
      t1: 'b',
      t2: 'c',
      t3: 'd',
    };
    expect(newlyEliminated(ownership, players, [])).toEqual([]);
  });
});

describe('finalPlacement', () => {
  it('supraviețuitorii sunt înaintea eliminaților', () => {
    const placement = finalPlacement(
      players,
      { a: 5, b: 3, c: 0, d: 0 },
      { a: 100, b: 200, c: 50, d: 10 },
      [
        { userId: 'c', roundNumber: 2 },
        { userId: 'd', roundNumber: 4 },
      ],
    );

    expect(placement.slice(0, 2)).toEqual(['a', 'b']);
  });

  it('cine rezistă mai mult primește un loc mai bun între eliminați', () => {
    // Regula de battle royale din §12.6: ultimul eliminat e cel mai bine clasat
    // dintre ei. Fără ea, rezistența n-ar fi răsplătită cu nimic.
    const placement = finalPlacement(
      players,
      { a: 5, b: 0, c: 0, d: 0 },
      { a: 100, b: 10, c: 10, d: 10 },
      [
        { userId: 'b', roundNumber: 1 },
        { userId: 'c', roundNumber: 5 },
        { userId: 'd', roundNumber: 3 },
      ],
    );

    expect(placement).toEqual(['a', 'c', 'd', 'b']);
  });

  it('teritoriile bat scorul la departajarea supraviețuitorilor', () => {
    const placement = finalPlacement(
      ['a', 'b'],
      { a: 2, b: 9 },
      { a: 999, b: 1 },
      [],
    );
    expect(placement).toEqual(['b', 'a']);
  });

  it('egalitatea perfectă se rezolvă stabil', () => {
    const first = finalPlacement(['zeta', 'alfa'], { zeta: 1, alfa: 1 }, { zeta: 1, alfa: 1 }, []);
    const second = finalPlacement(['alfa', 'zeta'], { zeta: 1, alfa: 1 }, { zeta: 1, alfa: 1 }, []);
    expect(first).toEqual(['alfa', 'zeta']);
    expect(second).toEqual(first);
  });

  it('include fiecare jucător exact o dată', () => {
    const placement = finalPlacement(
      players,
      { a: 1, b: 0, c: 0, d: 2 },
      { a: 5, b: 5, c: 5, d: 5 },
      [
        { userId: 'b', roundNumber: 2 },
        { userId: 'c', roundNumber: 3 },
      ],
    );

    expect([...placement].sort()).toEqual([...players].sort());
  });
});

describe('isSpectator', () => {
  it('eliminatul rămâne în partidă, dar ca spectator', () => {
    const eliminated: EliminationRecord[] = [{ userId: 'c', roundNumber: 2 }];
    expect(isSpectator('c', eliminated)).toBe(true);
    expect(isSpectator('a', eliminated)).toBe(false);
  });
});
