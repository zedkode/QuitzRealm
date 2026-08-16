import { buildTerritoryMap } from './territory-map';
import {
  attackableBy,
  claimTerritory,
  eliminatedPlayers,
  freeTerritoryIds,
  initialOwnership,
  phaseFor,
  pickContestedTerritory,
  territoriesOf,
  territoryCounts,
} from './territory-state';

const seeded = (seed: number) => {
  let value = seed;
  return () => {
    value = (value * 1103515245 + 12345) % 2147483648;
    return value / 2147483648;
  };
};

const players = ['a', 'b', 'c', 'd'];
const map = buildTerritoryMap(players, seeded(5));

describe('initialOwnership', () => {
  it('pune fiecare jucător pe bazele lui și lasă restul liber', () => {
    const ownership = initialOwnership(map);

    for (const userId of players) {
      expect(territoriesOf(ownership, userId).sort()).toEqual(
        [...map.bases[userId]].sort(),
      );
    }
    expect(freeTerritoryIds(ownership)).toHaveLength(
      map.territories.length - players.length * 2,
    );
  });

  it('partida începe în faza de capturare', () => {
    expect(phaseFor(initialOwnership(map))).toBe('capture');
  });
});

describe('pickContestedTerritory', () => {
  it('alege un teritoriu liber de la granița cuiva', () => {
    // Fără preferința de graniță, harta s-ar umple în pete rupte, iar faza de
    // luptă ar începe cu jucători care n-au vecini de atacat.
    const ownership = initialOwnership(map);
    const picked = pickContestedTerritory(map, ownership, seeded(2));
    expect(picked).not.toBeNull();

    const territory = map.territories.find((t) => t.id === picked);
    const touchesOwner = territory?.neighbourIds.some(
      (neighbour) => ownership[neighbour] !== null,
    );
    expect(touchesOwner).toBe(true);
    expect(ownership[picked as string]).toBeNull();
  });

  it('întoarce null când harta e plină', () => {
    let ownership = initialOwnership(map);
    for (const id of freeTerritoryIds(ownership)) {
      ownership = claimTerritory(ownership, id, 'a');
    }
    expect(pickContestedTerritory(map, ownership, seeded(1))).toBeNull();
    expect(phaseFor(ownership)).toBe('battle');
  });

  it('aceeași sămânță alege același teritoriu', () => {
    const ownership = initialOwnership(map);
    expect(pickContestedTerritory(map, ownership, seeded(9))).toBe(
      pickContestedTerritory(map, ownership, seeded(9)),
    );
  });
});

describe('claimTerritory', () => {
  it('nu modifică starea primită', () => {
    // Starea partidei se serializează în Redis; o mutație ascunsă peste un
    // obiect partajat produce stări imposibil de explicat.
    const ownership = initialOwnership(map);
    const free = freeTerritoryIds(ownership)[0];
    const next = claimTerritory(ownership, free, 'a');

    expect(ownership[free]).toBeNull();
    expect(next[free]).toBe('a');
  });

  it('refuză un teritoriu inexistent', () => {
    expect(() => claimTerritory(initialOwnership(map), 'inexistent', 'a')).toThrow();
  });
});

describe('attackableBy', () => {
  it('nu propune niciodată teritorii proprii', () => {
    const ownership = initialOwnership(map);
    for (const userId of players) {
      const targets = attackableBy(map, ownership, userId);
      for (const target of targets) {
        expect(ownership[target]).not.toBe(userId);
      }
    }
  });

  it('propune doar teritorii adiacente celor deținute', () => {
    // Regula din §12.3: se atacă doar la graniță, nu oriunde pe hartă.
    let ownership = initialOwnership(map);
    for (const id of freeTerritoryIds(ownership)) {
      ownership = claimTerritory(ownership, id, 'b');
    }

    const mine = new Set(territoriesOf(ownership, 'a'));
    const byId = new Map(map.territories.map((t) => [t.id, t]));

    for (const target of attackableBy(map, ownership, 'a')) {
      const touchesMine = byId
        .get(target)!
        .neighbourIds.some((neighbour) => mine.has(neighbour));
      expect(touchesMine).toBe(true);
    }
  });

  it('la început fiecare jucător are pe cine ataca abia după capturare', () => {
    // Bazele sunt separate prin construcție, deci la start nu există granițe.
    const ownership = initialOwnership(map);
    for (const userId of players) {
      expect(attackableBy(map, ownership, userId)).toEqual([]);
    }
  });
});

describe('eliminare și clasament', () => {
  it('un jucător fără teritorii e eliminat', () => {
    let ownership = initialOwnership(map);
    for (const id of map.bases.c) {
      ownership = claimTerritory(ownership, id, 'a');
    }

    expect(eliminatedPlayers(ownership, players)).toEqual(['c']);
  });

  it('numără teritoriile fiecăruia, inclusiv zero', () => {
    let ownership = initialOwnership(map);
    for (const id of map.bases.d) {
      ownership = claimTerritory(ownership, id, 'b');
    }

    const counts = territoryCounts(ownership, players);
    expect(counts.a).toBe(2);
    expect(counts.b).toBe(4);
    expect(counts.d).toBe(0);
    // Suma trebuie să dea exact teritoriile ocupate, altfel clasamentul minte.
    const occupied = map.territories.length - freeTerritoryIds(ownership).length;
    expect(Object.values(counts).reduce((sum, n) => sum + n, 0)).toBe(occupied);
  });
});
