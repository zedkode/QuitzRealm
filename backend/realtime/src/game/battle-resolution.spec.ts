import { canAttack, resolveAttacks } from './battle-resolution';
import type { TerritoryOwnership } from './territory-state';

const ownership: TerritoryOwnership = {
  t0: 'a',
  t1: 'b',
  t2: 'c',
  t3: null,
};

describe('resolveAttacks', () => {
  it('atacatorul corect cucerește teritoriul', () => {
    const outcomes = resolveAttacks(
      { a: 't1' },
      { a: { isCorrect: true, responseTimeMs: 1200 } },
      ownership,
    );

    expect(outcomes).toEqual([
      { territoryId: 't1', winnerId: 'a', previousOwnerId: 'b' },
    ]);
  });

  it('apărarea reușește implicit când niciun atacator nu răspunde corect', () => {
    // Apărătorul n-are nimic de făcut: un atac greșit pur și simplu nu trece.
    const outcomes = resolveAttacks(
      { a: 't1', c: 't1' },
      {
        a: { isCorrect: false, responseTimeMs: 800 },
        c: { isCorrect: false, responseTimeMs: 400 },
      },
      ownership,
    );

    expect(outcomes).toEqual([]);
  });

  it('la mai mulți atacatori pe aceeași țintă câștigă cel mai rapid corect', () => {
    const outcomes = resolveAttacks(
      { a: 't1', c: 't1' },
      {
        a: { isCorrect: true, responseTimeMs: 2000 },
        c: { isCorrect: true, responseTimeMs: 900 },
      },
      ownership,
    );

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0].winnerId).toBe('c');
  });

  it('un atacator corect bate unul greșit chiar dacă a răspuns mai încet', () => {
    const outcomes = resolveAttacks(
      { a: 't1', c: 't1' },
      {
        a: { isCorrect: true, responseTimeMs: 5000 },
        c: { isCorrect: false, responseTimeMs: 100 },
      },
      ownership,
    );

    expect(outcomes[0].winnerId).toBe('a');
  });

  it('răspunsul corect fără timp măsurat pierde în fața unuia cronometrat', () => {
    // Altfel absența unei valori ar fi mai bună decât un răspuns real.
    const outcomes = resolveAttacks(
      { a: 't1', c: 't1' },
      {
        a: { isCorrect: true, responseTimeMs: null },
        c: { isCorrect: true, responseTimeMs: 4000 },
      },
      ownership,
    );

    expect(outcomes[0].winnerId).toBe('c');
  });

  it('timpi identici se departajează stabil, nu la întâmplare', () => {
    const first = resolveAttacks(
      { zeta: 't1', alfa: 't1' },
      {
        zeta: { isCorrect: true, responseTimeMs: 1000 },
        alfa: { isCorrect: true, responseTimeMs: 1000 },
      },
      ownership,
    );
    const second = resolveAttacks(
      { alfa: 't1', zeta: 't1' },
      {
        alfa: { isCorrect: true, responseTimeMs: 1000 },
        zeta: { isCorrect: true, responseTimeMs: 1000 },
      },
      ownership,
    );

    expect(first[0].winnerId).toBe('alfa');
    expect(second[0].winnerId).toBe(first[0].winnerId);
  });

  it('ignoră atacul asupra propriului teritoriu', () => {
    const outcomes = resolveAttacks(
      { a: 't0' },
      { a: { isCorrect: true, responseTimeMs: 100 } },
      ownership,
    );

    expect(outcomes).toEqual([]);
  });

  it('ignoră un teritoriu inexistent fără să arunce', () => {
    // O declarație invalidă scăpată de validare n-are voie să prăbușească runda.
    const outcomes = resolveAttacks(
      { a: 'inexistent' },
      { a: { isCorrect: true, responseTimeMs: 100 } },
      ownership,
    );

    expect(outcomes).toEqual([]);
  });

  it('rezolvă mai multe ținte în aceeași rundă', () => {
    const outcomes = resolveAttacks(
      { a: 't1', b: 't2' },
      {
        a: { isCorrect: true, responseTimeMs: 500 },
        b: { isCorrect: true, responseTimeMs: 700 },
      },
      ownership,
    );

    expect(outcomes.map((outcome) => outcome.territoryId)).toEqual(['t1', 't2']);
  });
});

describe('canAttack', () => {
  it('acceptă doar ținte din lista calculată de server', () => {
    expect(canAttack('a', 't1', ['t1', 't2'])).toBe(true);
    expect(canAttack('a', 't9', ['t1', 't2'])).toBe(false);
  });
});
