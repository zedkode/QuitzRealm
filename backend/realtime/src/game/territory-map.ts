/**
 * Harta de teritorii a unei partide Clasic (`owner-plan.md` §12.2).
 *
 * Modulul e **pur**: primește numărul de jucători și o sursă de aleator, întoarce
 * o hartă. Nu atinge starea partidei, nu citește ceasul, nu vorbește cu Redis —
 * ca să poată fi testat exhaustiv și ca aceeași hartă să fie reproductibilă
 * dintr-o sămânță, lucru fără de care un bug de poziționare n-ar putea fi
 * reprodus niciodată.
 *
 * Harta e generată **pe server** și trimisă clientului. Clientul n-o calculează
 * niciodată singur: două calcule independente ar putea diverge, iar atunci doi
 * jucători ar vedea hărți diferite ale aceleiași partide.
 */

/** Coordonate axiale pe grilă hexagonală. */
export interface HexCoordinates {
  q: number;
  r: number;
}

export interface Territory {
  id: string;
  coordinates: HexCoordinates;
  /** Identificatorii teritoriilor vecine. Adiacența e explicită (§12.2). */
  neighbourIds: string[];
}

export interface TerritoryMap {
  /** Câți jucători a fost dimensionată harta să susțină. */
  playerCount: number;
  territories: Territory[];
  /** Teritoriile de bază atribuite fiecărui jucător la start. */
  bases: Record<string, string[]>;
}

/** Câte teritorii de bază primește fiecare jucător la start (§12.3). */
export const BASE_TERRITORIES_PER_PLAYER = 2;

/**
 * Numărul de teritorii pentru un lobby.
 *
 * §12.2 dă intervale marcate explicit „orientativ"; valorile de aici le depășesc
 * ușor la lobby-urile mari, dintr-un motiv geometric măsurabil. Pe o grilă
 * hexagonală, celulele care nu se ating două câte două formează o subrețea de
 * exact **o treime** din hartă. La 8 jucători sunt 16 baze, deci harta are nevoie
 * de cel puțin 48 de celule doar ca bazele să nu fie lipite — fără nicio celulă
 * de rezervă. Cu 54 rămâne marjă, iar poziționarea nu mai depinde de noroc.
 *
 * Valoarea e fixă per lobby, nu aleasă aleator din interval: o hartă care își
 * schimbă mărimea de la un meci la altul face echilibrarea imposibil de comparat.
 */
export function territoryCountFor(playerCount: number): number {
  if (!Number.isInteger(playerCount) || playerCount < 2 || playerCount > 8) {
    throw new Error('Numărul de jucători trebuie să fie între 2 și 8.');
  }
  const byPlayers: Record<number, number> = {
    2: 18,
    3: 24,
    4: 30,
    5: 36,
    6: 42,
    7: 48,
    8: 54,
  };
  return byPlayers[playerCount];
}

/** Cei șase vecini ai unei celule, în coordonate axiale. */
const HEX_DIRECTIONS: HexCoordinates[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

const keyOf = (coordinates: HexCoordinates): string =>
  `${coordinates.q},${coordinates.r}`;

/**
 * Generează celulele unei spirale hexagonale, de la centru spre exterior.
 *
 * Spirala garantează o hartă **conexă și compactă** pentru orice număr de
 * teritorii: o generare pe rânduri ar lăsa margini lungi și subțiri, unde
 * jucătorii de la capete n-ar avea aproape niciun vecin de atacat.
 */
function spiralCells(count: number): HexCoordinates[] {
  const cells: HexCoordinates[] = [{ q: 0, r: 0 }];
  let ring = 1;

  while (cells.length < count) {
    let current: HexCoordinates = { q: -ring, r: ring };
    for (const direction of HEX_DIRECTIONS) {
      for (let step = 0; step < ring && cells.length < count; step += 1) {
        cells.push(current);
        current = {
          q: current.q + direction.q,
          r: current.r + direction.r,
        };
      }
      if (cells.length >= count) break;
    }
    ring += 1;
  }

  return cells;
}

/**
 * Construiește harta unei partide.
 *
 * `random` primește implicit `Math.random`, dar testele îi dau o sursă
 * deterministă — altfel „poziționare corectă" ar fi o afirmație pe care n-o
 * putem verifica de două ori la fel.
 */
export function buildTerritoryMap(
  playerIds: readonly string[],
  random: () => number = Math.random,
): TerritoryMap {
  const playerCount = playerIds.length;
  if (new Set(playerIds).size !== playerCount) {
    throw new Error('Lista de jucători conține identificatori duplicați.');
  }

  const total = territoryCountFor(playerCount);
  const cells = spiralCells(total);
  const byKey = new Map<string, string>();

  cells.forEach((coordinates, index) => {
    byKey.set(keyOf(coordinates), `t${index}`);
  });

  const territories: Territory[] = cells.map((coordinates, index) => ({
    id: `t${index}`,
    coordinates,
    neighbourIds: HEX_DIRECTIONS.map((direction) =>
      byKey.get(keyOf({ q: coordinates.q + direction.q, r: coordinates.r + direction.r })),
    ).filter((id): id is string => id !== undefined),
  }));

  return {
    playerCount,
    territories,
    bases: assignBases(playerIds, territories, random),
  };
}

/**
 * Atribuie fiecărui jucător teritoriile de bază, cât mai depărtate între ele.
 *
 * Alegerea nu e aleatoare: la fiecare pas se ia teritoriul liber **cel mai
 * departe** de tot ce e deja ocupat (distanță în număr de pași pe hartă). Doi
 * jucători porniți lipiți unul de altul ar intra în conflict din prima rundă,
 * iar restul hărții ar rămâne nedisputată — exact dezechilibrul pe care §12.3 îl
 * cere evitat.
 */
function assignBases(
  playerIds: readonly string[],
  territories: readonly Territory[],
  random: () => number,
): Record<string, string[]> {
  const distances = buildDistanceIndex(territories);
  const bases: Record<string, string[]> = {};
  for (const playerId of playerIds) bases[playerId] = [];

  // Restul e ales aleator, ca două partide cu același număr de jucători să nu
  // aibă poziționări identice; oricare dintre cele trei subrețele e la fel de bună.
  const residue = Math.floor(random() * 3) % 3;
  const pool = independentCells(territories, residue);
  const needed = playerIds.length * BASE_TERRITORIES_PER_PLAYER;
  if (pool.length < needed) {
    throw new Error(
      `Harta are ${pool.length} poziții de bază disponibile, dar sunt necesare ${needed}.`,
    );
  }

  const taken: string[] = [];
  const first = pool[Math.floor(random() * pool.length) % pool.length].id;
  bases[playerIds[0]].push(first);
  taken.push(first);

  // Se alternează jucătorii, ca nimeni să nu-și primească ambele baze înainte ca
  // ceilalți să aibă una.
  for (let round = 0; round < BASE_TERRITORIES_PER_PLAYER; round += 1) {
    for (const playerId of playerIds) {
      if (bases[playerId].length > round) continue;
      const pick = farthestFrom(pool, taken, distances);
      bases[playerId].push(pick);
      taken.push(pick);
    }
  }

  return bases;
}

/** Distanțele minime între toate perechile de teritorii, prin parcurgere în lățime. */
function buildDistanceIndex(
  territories: readonly Territory[],
): Map<string, Map<string, number>> {
  const neighbours = new Map<string, string[]>();
  for (const territory of territories) {
    neighbours.set(territory.id, territory.neighbourIds);
  }

  const index = new Map<string, Map<string, number>>();
  for (const territory of territories) {
    const distances = new Map<string, number>([[territory.id, 0]]);
    const queue: string[] = [territory.id];

    while (queue.length > 0) {
      const current = queue.shift() as string;
      const currentDistance = distances.get(current) as number;
      for (const neighbour of neighbours.get(current) ?? []) {
        if (distances.has(neighbour)) continue;
        distances.set(neighbour, currentDistance + 1);
        queue.push(neighbour);
      }
    }

    index.set(territory.id, distances);
  }

  return index;
}

/**
 * Subrețeaua de celule care nu pot fi vecine între ele.
 *
 * Pe coordonate axiale, orice pas către un vecin schimbă `(q + 2r) mod 3` cu ±1.
 * Prin urmare două celule cu **același rest** nu sunt niciodată adiacente. Asta
 * transformă „bazele să nu se atingă" dintr-o speranță a unui algoritm lacom
 * într-o proprietate garantată de construcție.
 */
function independentCells(
  territories: readonly Territory[],
  residue: number,
): Territory[] {
  return territories.filter(
    (territory) =>
      (((territory.coordinates.q + 2 * territory.coordinates.r) % 3) + 3) % 3 ===
      residue,
  );
}

/** Teritoriul din `pool` cel mai depărtat de cele deja ocupate. */
function farthestFrom(
  pool: readonly Territory[],
  taken: readonly string[],
  distances: Map<string, Map<string, number>>,
): string {
  const takenSet = new Set(taken);
  const scored: Array<{ id: string; nearest: number }> = [];

  for (const territory of pool) {
    if (takenSet.has(territory.id)) continue;
    let nearest = Number.POSITIVE_INFINITY;
    for (const occupied of taken) {
      const distance = distances.get(territory.id)?.get(occupied);
      if (distance !== undefined && distance < nearest) nearest = distance;
    }
    scored.push({ id: territory.id, nearest });
  }

  if (scored.length === 0) {
    throw new Error('Subrețeaua nu mai are teritorii libere pentru baze.');
  }

  // Departajare stabilă pe indicele numeric al id-ului, ca aceeași sămânță să
  // dea mereu aceeași hartă. Comparația de șiruri ar pune „t10" înaintea lui „t9".
  scored.sort((a, b) => {
    if (b.nearest !== a.nearest) return b.nearest - a.nearest;
    return indexOfId(a.id) - indexOfId(b.id);
  });

  return scored[0].id;
}

const indexOfId = (id: string): number => Number(id.slice(1));
