/**
 * Oglinda contractului de hartă din `backend/realtime/src/game/territory-map.ts`
 * și `territory-state.ts`.
 *
 * Harta e generată **pe server** și trimisă clientului; aici doar o desenăm.
 * Regulile duplicate (ce se poate ataca) sunt afordanță vizuală: verdictul îl
 * dă tot serverul, care refuză o țintă invalidă indiferent ce trimite clientul.
 * Aceeași alegere e făcută și în aplicația Flutter.
 */

export interface HexCoordinates {
  q: number;
  r: number;
}

export interface Territory {
  id: string;
  coordinates: HexCoordinates;
  neighbourIds: string[];
}

export interface TerritoryMap {
  playerCount: number;
  territories: Territory[];
  bases: Record<string, string[]>;
}

export type TerritoryOwnership = Record<string, string | null>;

export interface TerritorySnapshot {
  ownership: TerritoryOwnership;
  contestedTerritoryId: string | null;
}

export function territoriesOf(ownership: TerritoryOwnership, userId: string): string[] {
  return Object.entries(ownership)
    .filter(([, owner]) => owner === userId)
    .map(([id]) => id);
}

export function freeTerritoryIds(ownership: TerritoryOwnership): string[] {
  return Object.entries(ownership)
    .filter(([, owner]) => owner === null)
    .map(([id]) => id);
}

/** Teritoriile vecine cu ale mele, deținute de altcineva (§12.3, faza 2). */
export function attackableBy(
  map: TerritoryMap,
  ownership: TerritoryOwnership,
  userId: string,
): string[] {
  const mine = new Set(territoriesOf(ownership, userId));
  if (mine.size === 0) return [];
  const targets = new Set<string>();
  for (const territory of map.territories) {
    if (!mine.has(territory.id)) continue;
    for (const neighbour of territory.neighbourIds) {
      const owner = ownership[neighbour];
      if (owner != null && owner !== userId) targets.add(neighbour);
    }
  }
  return [...targets].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
}

/** Faza partidei: cât timp mai există teritorii libere, se cucerește. */
export function phaseOf(ownership: TerritoryOwnership): "capture" | "battle" {
  return freeTerritoryIds(ownership).length > 0 ? "capture" : "battle";
}

// --- Geometrie -------------------------------------------------------------
// Aceeași așezare ca pe mobil (`territory_board.dart`): hexagoane cu vârful în
// sus, centre pe coordonate axiale. Dacă cele două clienți ar folosi orientări
// diferite, aceeași partidă ar arăta ca două hărți fără legătură.

const HEX_GAP = 0.92;
const SQRT3 = Math.sqrt(3);

export function hexCentre(coordinates: HexCoordinates, radius: number): { x: number; y: number } {
  return {
    x: radius * SQRT3 * (coordinates.q + coordinates.r / 2),
    y: radius * 1.5 * coordinates.r,
  };
}

export function hexPoints(centre: { x: number; y: number }, radius: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    points.push(
      `${(centre.x + radius * HEX_GAP * Math.cos(angle)).toFixed(2)},${(centre.y + radius * HEX_GAP * Math.sin(angle)).toFixed(2)}`,
    );
  }
  return points.join(" ");
}

export interface MapLayout {
  centres: Record<string, { x: number; y: number }>;
  viewBox: string;
  radius: number;
}

/**
 * Așază harta într-un `viewBox` care o încadrează exact. Raza e fixă în unități
 * SVG: scalarea o face browserul, deci harta de 8 jucători și cea de 2 arată la
 * fel de mari pe ecran, fără calcule de pixeli.
 */
export function layoutMap(map: TerritoryMap, radius = 10): MapLayout {
  const centres: Record<string, { x: number; y: number }> = {};
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const territory of map.territories) {
    const centre = hexCentre(territory.coordinates, radius);
    centres[territory.id] = centre;
    minX = Math.min(minX, centre.x);
    maxX = Math.max(maxX, centre.x);
    minY = Math.min(minY, centre.y);
    maxY = Math.max(maxY, centre.y);
  }

  if (map.territories.length === 0) {
    return { centres, viewBox: "0 0 100 100", radius };
  }

  const pad = radius * 1.35;
  return {
    centres,
    viewBox: `${(minX - pad).toFixed(2)} ${(minY - pad).toFixed(2)} ${(maxX - minX + pad * 2).toFixed(2)} ${(maxY - minY + pad * 2).toFixed(2)}`,
    radius,
  };
}

// --- Culorile jucătorilor --------------------------------------------------

/** Culoarea jucătorului propriu: fixă, ca să se recunoască instant pe hartă. */
export const OWN_COLOUR = "#e0ba58";

/** Paleta rivalilor, în ordinea din conceptul vizual. */
const RIVAL_COLOURS = [
  "#8d6bda",
  "#2bc7b4",
  "#e05563",
  "#e8894a",
  "#5b8def",
  "#d46c9b",
  "#9bc94a",
];

export const FREE_COLOUR = "#2a2740";

/**
 * Culoarea unui jucător. `playerOrder` trebuie să fie stabil pe toată partida —
 * altfel un jucător și-ar schimba culoarea între runde și harta ar deveni de
 * necitit exact când contează.
 */
export function playerColour(
  userId: string | null | undefined,
  playerOrder: readonly string[],
  myUserId: string | null,
): string {
  if (userId == null) return FREE_COLOUR;
  if (myUserId != null && userId === myUserId) return OWN_COLOUR;
  const rivals = playerOrder.filter((id) => id !== myUserId);
  const index = rivals.indexOf(userId);
  return RIVAL_COLOURS[(index < 0 ? 0 : index) % RIVAL_COLOURS.length];
}

/**
 * Eticheta unui jucător. Serverul nu trimite nume afișabile în starea partidei,
 * doar `userId`, deci numele real nu are de unde veni; culoarea rămâne
 * identificatorul principal, exact ca facțiunile din concept.
 */
export function playerLabel(
  userId: string,
  playerOrder: readonly string[],
  myUserId: string | null,
): string {
  if (myUserId != null && userId === myUserId) return "Tu";
  const rivals = playerOrder.filter((id) => id !== myUserId);
  const index = rivals.indexOf(userId);
  return `Rival ${index < 0 ? 1 : index + 1}`;
}
