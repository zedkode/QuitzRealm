import { eliminatedPlayers, type TerritoryOwnership } from './territory-state';

/** Un jucător scos din faza activă, cu runda în care s-a întâmplat (§12.6). */
export interface EliminationRecord {
  userId: string;
  roundNumber: number;
}

/**
 * Jucătorii care tocmai au rămas fără teritorii.
 *
 * Se compară cu cei deja eliminați, ca un jucător să nu fie „eliminat" de două
 * ori — altfel ordinea de eliminare, pe care se calculează locul final, ar fi
 * falsificată de rundele următoare.
 */
export function newlyEliminated(
  ownership: TerritoryOwnership,
  playerIds: readonly string[],
  alreadyEliminated: readonly EliminationRecord[],
): string[] {
  const known = new Set(alreadyEliminated.map((record) => record.userId));
  return eliminatedPlayers(ownership, playerIds).filter(
    (userId) => !known.has(userId),
  );
}

/**
 * Clasamentul final, de la locul 1 în jos (§12.6).
 *
 * Supraviețuitorii se ordonează după teritorii, apoi scor. Eliminații vin după
 * ei, în **ordine inversă a eliminării**: cine a rezistat mai mult primește un
 * loc mai bun, exact ca într-un battle royale. Fără regula asta, toți eliminații
 * ar fi egali, iar rezistența n-ar fi răsplătită cu nimic.
 */
export function finalPlacement(
  playerIds: readonly string[],
  territoryCounts: Readonly<Record<string, number>>,
  scores: Readonly<Record<string, number>>,
  eliminated: readonly EliminationRecord[],
): string[] {
  const eliminatedIds = new Set(eliminated.map((record) => record.userId));
  const survivors = playerIds.filter((userId) => !eliminatedIds.has(userId));

  survivors.sort((a, b) => {
    const byTerritory = (territoryCounts[b] ?? 0) - (territoryCounts[a] ?? 0);
    if (byTerritory !== 0) return byTerritory;
    const byScore = (scores[b] ?? 0) - (scores[a] ?? 0);
    if (byScore !== 0) return byScore;
    // Departajare stabilă: fără ea, doi jucători egali ar primi locuri diferite
    // de la o rulare la alta, iar recompensele ar deveni imprevizibile.
    return a.localeCompare(b);
  });

  const byEliminationOrder = [...eliminated]
    .sort((a, b) => {
      if (b.roundNumber !== a.roundNumber) return b.roundNumber - a.roundNumber;
      return a.userId.localeCompare(b.userId);
    })
    .map((record) => record.userId);

  return [...survivors, ...byEliminationOrder];
}

/**
 * Un jucător eliminat rămâne conectat, dar nu mai poate răspunde (§12.6):
 * intră în mod spectator, nu părăsește partida.
 */
export function isSpectator(
  userId: string,
  eliminated: readonly EliminationRecord[],
): boolean {
  return eliminated.some((record) => record.userId === userId);
}
