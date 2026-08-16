import type { TerritoryOwnership } from './territory-state';

/** Ce a declarat un jucător în fereastra de atac: o țintă sau pas. */
export type AttackDeclarations = Record<string, string>;

export interface AttackerAnswer {
  isCorrect: boolean;
  /** `null` dacă n-a răspuns deloc. */
  responseTimeMs: number | null;
}

export interface AttackOutcome {
  territoryId: string;
  /** Cine a cucerit teritoriul. */
  winnerId: string;
  /** De la cine, ca ecranul să poată povesti runda. */
  previousOwnerId: string | null;
}

/**
 * Rezolvă simultan toate atacurile unei runde de luptă (`owner-plan.md` §12.3).
 *
 * Regulile, în ordine:
 *  - contează doar atacatorii care au **răspuns corect**; dacă niciunul n-a
 *    nimerit, teritoriul rămâne la proprietar — apărarea reușită e implicită,
 *    apărătorul n-are nimic de făcut;
 *  - la mai mulți atacatori pe aceeași țintă câștigă **cel mai rapid** dintre
 *    cei corecți;
 *  - la timpi identici departajează identificatorul, ca rezultatul să nu depindă
 *    de ordinea cheilor dintr-un obiect.
 *
 * Funcția e pură: nu modifică proprietatea primită, ci descrie ce trebuie
 * schimbat. Aplicarea rămâne în serviciu, într-un singur loc.
 */
export function resolveAttacks(
  attacks: AttackDeclarations,
  answers: Readonly<Record<string, AttackerAnswer>>,
  ownership: TerritoryOwnership,
): AttackOutcome[] {
  const byTarget = new Map<string, string[]>();

  for (const [attackerId, territoryId] of Object.entries(attacks)) {
    const currentOwner = ownership[territoryId];
    // Un atac asupra propriului teritoriu sau asupra unuia inexistent e o
    // declarație invalidă scăpată de validare; se ignoră, nu se prăbușește runda.
    if (currentOwner === undefined || currentOwner === attackerId) continue;
    const list = byTarget.get(territoryId) ?? [];
    list.push(attackerId);
    byTarget.set(territoryId, list);
  }

  const outcomes: AttackOutcome[] = [];

  for (const [territoryId, attackerIds] of byTarget) {
    const correct = attackerIds.filter(
      (attackerId) => answers[attackerId]?.isCorrect === true,
    );
    if (correct.length === 0) continue;

    correct.sort((a, b) => {
      // Un răspuns corect fără timp măsurat e tratat ca cel mai lent posibil;
      // altfel absența unei valori ar câștiga în fața unui răspuns real.
      const timeA = answers[a]?.responseTimeMs ?? Number.MAX_SAFE_INTEGER;
      const timeB = answers[b]?.responseTimeMs ?? Number.MAX_SAFE_INTEGER;
      if (timeA !== timeB) return timeA - timeB;
      return a.localeCompare(b);
    });

    outcomes.push({
      territoryId,
      winnerId: correct[0],
      previousOwnerId: ownership[territoryId],
    });
  }

  // Ordonare stabilă pe teritoriu, ca aceeași rundă să producă mereu aceeași
  // listă de evenimente pentru client.
  outcomes.sort((a, b) => Number(a.territoryId.slice(1)) - Number(b.territoryId.slice(1)));
  return outcomes;
}

/**
 * Verifică dacă o declarație de atac e permisă.
 *
 * Se apelează pe server la primirea declarației: clientul poate ascunde
 * teritoriile inaccesibile, dar nu poate fi crezut pe cuvânt.
 */
export function canAttack(
  attackerId: string,
  territoryId: string,
  attackable: readonly string[],
): boolean {
  return attackable.includes(territoryId);
}
