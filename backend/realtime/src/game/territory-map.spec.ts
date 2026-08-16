import {
  BASE_TERRITORIES_PER_PLAYER,
  buildTerritoryMap,
  territoryCountFor,
} from './territory-map';

/** Sursă de aleator deterministă, ca o hartă să poată fi reprodusă identic. */
const seeded = (seed: number) => {
  let value = seed;
  return () => {
    value = (value * 1103515245 + 12345) % 2147483648;
    return value / 2147483648;
  };
};

describe('territoryCountFor', () => {
  it('nu scade sub minimul orientativ din owner-plan §12.2', () => {
    const minimums: Record<number, number> = { 4: 24, 5: 28, 6: 32, 7: 36, 8: 40 };
    for (const [players, minimum] of Object.entries(minimums)) {
      expect(territoryCountFor(Number(players))).toBeGreaterThanOrEqual(minimum);
    }
  });

  it('are loc pentru toate bazele pe o subrețea fără vecini', () => {
    // Cerința care chiar contează, dincolo de tabelul orientativ: celulele care
    // nu se ating două câte două sunt o treime din hartă, deci harta trebuie să
    // fie de cel puțin trei ori numărul de baze. Sub pragul ăsta, poziționarea
    // corectă e imposibilă, nu doar improbabilă.
    for (let players = 2; players <= 8; players += 1) {
      const bases = players * BASE_TERRITORIES_PER_PLAYER;
      expect(territoryCountFor(players)).toBeGreaterThanOrEqual(bases * 3);
    }
  });

  it('crește monoton cu numărul de jucători', () => {
    for (let players = 3; players <= 8; players += 1) {
      expect(territoryCountFor(players)).toBeGreaterThan(
        territoryCountFor(players - 1),
      );
    }
  });

  it('refuză lobby-uri imposibile', () => {
    expect(() => territoryCountFor(1)).toThrow();
    expect(() => territoryCountFor(9)).toThrow();
    expect(() => territoryCountFor(4.5)).toThrow();
  });
});

describe('buildTerritoryMap', () => {
  const players = ['a', 'b', 'c', 'd'];

  it('generează exact numărul de teritorii cerut de lobby', () => {
    const map = buildTerritoryMap(players, seeded(1));
    expect(map.territories).toHaveLength(territoryCountFor(players.length));
    expect(new Set(map.territories.map((t) => t.id)).size).toBe(
      map.territories.length,
    );
  });

  it('adiacența e reciprocă', () => {
    // Dacă A îl vede pe B ca vecin dar B nu-l vede pe A, faza de atac ar permite
    // lovituri într-un singur sens — un avantaj invizibil în reguli.
    const map = buildTerritoryMap(players, seeded(7));
    const byId = new Map(map.territories.map((t) => [t.id, t]));

    for (const territory of map.territories) {
      for (const neighbourId of territory.neighbourIds) {
        expect(byId.get(neighbourId)?.neighbourIds).toContain(territory.id);
      }
    }
  });

  it('harta e conexă: din orice teritoriu se ajunge oriunde', () => {
    // O insulă izolată ar fi de necucerit, iar partida n-ar putea să se termine.
    const map = buildTerritoryMap(players, seeded(3));
    const byId = new Map(map.territories.map((t) => [t.id, t]));
    const seen = new Set<string>([map.territories[0].id]);
    const queue = [map.territories[0].id];

    while (queue.length > 0) {
      const current = queue.shift() as string;
      for (const neighbour of byId.get(current)?.neighbourIds ?? []) {
        if (seen.has(neighbour)) continue;
        seen.add(neighbour);
        queue.push(neighbour);
      }
    }

    expect(seen.size).toBe(map.territories.length);
  });

  it('fiecare jucător primește exact două baze, fără suprapuneri', () => {
    const map = buildTerritoryMap(players, seeded(11));
    const all: string[] = [];

    for (const playerId of players) {
      expect(map.bases[playerId]).toHaveLength(BASE_TERRITORIES_PER_PLAYER);
      all.push(...map.bases[playerId]);
    }

    expect(new Set(all).size).toBe(all.length);
  });

  it('bazele a doi jucători nu sunt niciodată vecine', () => {
    // Regula din §12.3: pornirea lipită ar decide partida în prima rundă.
    for (let seed = 1; seed <= 25; seed += 1) {
      const map = buildTerritoryMap(players, seeded(seed));
      const byId = new Map(map.territories.map((t) => [t.id, t]));
      const owner = new Map<string, string>();
      for (const playerId of players) {
        for (const base of map.bases[playerId]) owner.set(base, playerId);
      }

      for (const [territoryId, playerId] of owner) {
        for (const neighbour of byId.get(territoryId)?.neighbourIds ?? []) {
          const neighbourOwner = owner.get(neighbour);
          if (neighbourOwner !== undefined) {
            expect(neighbourOwner).toBe(playerId);
          }
        }
      }
    }
  });

  it('aceeași sămânță dă aceeași hartă', () => {
    const first = buildTerritoryMap(players, seeded(42));
    const second = buildTerritoryMap(players, seeded(42));
    expect(second).toEqual(first);
  });

  it('funcționează pentru toate lobby-urile acceptate', () => {
    for (let count = 4; count <= 8; count += 1) {
      const ids = Array.from({ length: count }, (_, index) => `p${index}`);
      const map = buildTerritoryMap(ids, seeded(count));
      expect(map.playerCount).toBe(count);
      expect(Object.keys(map.bases)).toHaveLength(count);
      // Trebuie să rămână teritorii libere de cucerit după împărțirea bazelor.
      const claimed = count * BASE_TERRITORIES_PER_PLAYER;
      expect(map.territories.length).toBeGreaterThan(claimed);
    }
  });

  it('refuză o listă cu jucători duplicați', () => {
    expect(() => buildTerritoryMap(['a', 'a', 'b', 'c'], seeded(1))).toThrow();
  });
});
