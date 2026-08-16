import type { TerritoryMap } from './territory-map';

/**
 * Cine deține fiecare teritoriu. `null` = liber, încă necucerit.
 *
 * Ținut separat de harta în sine: harta e imuabilă pe toată partida, proprietatea
 * se schimbă la fiecare rundă. Amestecate, orice salvare a stării ar rescrie
 * inutil geometria hărții la fiecare răspuns.
 */
export type TerritoryOwnership = Record<string, string | null>;

export type MatchPhase = 'capture' | 'battle';

/** Proprietatea de start: fiecare jucător pe bazele lui, restul liber (§12.3). */
export function initialOwnership(map: TerritoryMap): TerritoryOwnership {
  const ownership: TerritoryOwnership = {};
  for (const territory of map.territories) ownership[territory.id] = null;

  for (const [userId, baseIds] of Object.entries(map.bases)) {
    for (const baseId of baseIds) {
      if (!(baseId in ownership)) {
        throw new Error(`Baza ${baseId} nu există pe hartă.`);
      }
      ownership[baseId] = userId;
    }
  }

  return ownership;
}

export function freeTerritoryIds(ownership: TerritoryOwnership): string[] {
  return Object.entries(ownership)
    .filter(([, owner]) => owner === null)
    .map(([id]) => id);
}

export function territoriesOf(
  ownership: TerritoryOwnership,
  userId: string,
): string[] {
  return Object.entries(ownership)
    .filter(([, owner]) => owner === userId)
    .map(([id]) => id);
}

/**
 * Faza partidei. Capturarea ține până nu mai există teritorii libere (§12.3).
 */
export function phaseFor(ownership: TerritoryOwnership): MatchPhase {
  return freeTerritoryIds(ownership).length > 0 ? 'capture' : 'battle';
}

/**
 * Alege teritoriul liber pus în joc în runda următoare.
 *
 * Preferă un teritoriu **vecin cu un teritoriu deja deținut**. Fără preferința
 * asta, harta s-ar umple în pete rupte între ele, iar faza de luptă ar începe cu
 * jucători care n-au granițe comune și deci n-au pe cine ataca. Când niciun
 * teritoriu liber nu e la graniță, se ia oricare — harta poate avea insule de
 * celule libere înconjurate doar de alte celule libere.
 *
 * Întoarce `null` când nu mai e nimic de cucerit.
 */
export function pickContestedTerritory(
  map: TerritoryMap,
  ownership: TerritoryOwnership,
  random: () => number = Math.random,
): string | null {
  const free = freeTerritoryIds(ownership);
  if (free.length === 0) return null;

  const freeSet = new Set(free);
  const byId = new Map(map.territories.map((t) => [t.id, t]));

  const onBorder = free.filter((id) =>
    (byId.get(id)?.neighbourIds ?? []).some(
      (neighbour) => !freeSet.has(neighbour) && ownership[neighbour] !== null,
    ),
  );

  const pool = onBorder.length > 0 ? onBorder : free;
  // Sortarea înainte de alegere face rezultatul reproductibil dintr-o sămânță:
  // ordinea cheilor unui obiect n-ar trebui să decidă ce teritoriu se joacă.
  const sorted = [...pool].sort(
    (a, b) => Number(a.slice(1)) - Number(b.slice(1)),
  );
  return sorted[Math.floor(random() * sorted.length) % sorted.length];
}

/**
 * Teritoriile pe care [userId] le poate ataca: vecine cu ale lui, deținute de
 * altcineva (§12.3, faza 2).
 */
export function attackableBy(
  map: TerritoryMap,
  ownership: TerritoryOwnership,
  userId: string,
): string[] {
  const mine = new Set(territoriesOf(ownership, userId));
  const byId = new Map(map.territories.map((t) => [t.id, t]));
  const targets = new Set<string>();

  for (const territoryId of mine) {
    for (const neighbour of byId.get(territoryId)?.neighbourIds ?? []) {
      const owner = ownership[neighbour];
      if (owner !== null && owner !== undefined && owner !== userId) {
        targets.add(neighbour);
      }
    }
  }

  return [...targets].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
}

/**
 * Trece teritoriul la noul proprietar.
 *
 * Întoarce o **copie**: starea partidei e serializată în Redis, iar mutațiile
 * ascunse peste un obiect partajat sunt cea mai ușoară cale de a scrie o stare
 * pe care n-o mai poți explica.
 */
export function claimTerritory(
  ownership: TerritoryOwnership,
  territoryId: string,
  userId: string,
): TerritoryOwnership {
  if (!(territoryId in ownership)) {
    throw new Error(`Teritoriul ${territoryId} nu există pe hartă.`);
  }
  return { ...ownership, [territoryId]: userId };
}

/** Jucătorii care nu mai dețin niciun teritoriu — eliminați din faza activă (§12.6). */
export function eliminatedPlayers(
  ownership: TerritoryOwnership,
  playerIds: readonly string[],
): string[] {
  return playerIds.filter(
    (userId) => territoriesOf(ownership, userId).length === 0,
  );
}

/** Numărul de teritorii per jucător, pentru clasament. */
export function territoryCounts(
  ownership: TerritoryOwnership,
  playerIds: readonly string[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const userId of playerIds) counts[userId] = 0;
  for (const owner of Object.values(ownership)) {
    if (owner !== null && owner in counts) counts[owner] += 1;
  }
  return counts;
}
