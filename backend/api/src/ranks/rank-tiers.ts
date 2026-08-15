/**
 * Treptele de rang din `owner-plan.md` secțiunea 5.1.
 *
 * Rangurile sunt configurație statică, nu date de utilizator: se calculează din
 * `users.elo_rating`, care este deja sursa de adevăr. De aceea nu există (încă)
 * tabelele `rank_tiers` / `user_rank` din secțiunea 5.4 — sezoanele, meciurile
 * de plasare și decay-ul aparțin Fazei 4 și vor cere migrare proprie.
 *
 * Notă asupra numărătorii: tabelul din `owner-plan.md` dă diviziuni I–III doar
 * rangurilor 1–7, iar „Mare Maestru” fără diviziuni. Rezultă 7×3 + 1 = 22 de
 * trepte fixe, plus „Legendă” (dinamică, Top 100) = 23. Documentul afirmă „23
 * fixe + 1 = 24”; am urmat tabelul, care este specificația detaliată. Cerința
 * de minimum 20 de trepte este respectată în ambele citiri.
 */

export interface RankTier {
  /** Ordine globală, 1 = cea mai joasă treaptă. */
  readonly order: number;
  readonly majorRank: number;
  readonly majorName: string;
  /** 1 = cea mai bună diviziune (I). `null` pentru rangurile fără diviziuni. */
  readonly division: number | null;
  readonly eloMin: number;
  /** `null` = fără plafon (treapta de vârf). */
  readonly eloMax: number | null;
  /** Cheie stabilă pentru assets/iconițe și pentru clientul mobil. */
  readonly key: string;
}

interface MajorRankDefinition {
  readonly majorRank: number;
  readonly name: string;
  readonly key: string;
  readonly eloMin: number;
  readonly eloMax: number | null;
  readonly divisions: number;
}

const MAJOR_RANKS: readonly MajorRankDefinition[] = [
  {
    majorRank: 1,
    name: 'Novice',
    key: 'novice',
    eloMin: 0,
    eloMax: 599,
    divisions: 3,
  },
  {
    majorRank: 2,
    name: 'Ucenic',
    key: 'ucenic',
    eloMin: 600,
    eloMax: 999,
    divisions: 3,
  },
  {
    majorRank: 3,
    name: 'Cercetător',
    key: 'cercetator',
    eloMin: 1000,
    eloMax: 1399,
    divisions: 3,
  },
  {
    majorRank: 4,
    name: 'Erudit',
    key: 'erudit',
    eloMin: 1400,
    eloMax: 1799,
    divisions: 3,
  },
  {
    majorRank: 5,
    name: 'Sofist',
    key: 'sofist',
    eloMin: 1800,
    eloMax: 2199,
    divisions: 3,
  },
  {
    majorRank: 6,
    name: 'Filosof',
    key: 'filosof',
    eloMin: 2200,
    eloMax: 2599,
    divisions: 3,
  },
  {
    majorRank: 7,
    name: 'Oracol',
    key: 'oracol',
    eloMin: 2600,
    eloMax: 2999,
    divisions: 3,
  },
  {
    majorRank: 8,
    name: 'Mare Maestru',
    key: 'mare-maestru',
    eloMin: 3000,
    eloMax: null,
    divisions: 0,
  },
];

/**
 * Titlul dinamic de vârf: nu este o treaptă de ELO, ci o poziție în clasament
 * (Top 100 global), deci se acordă separat de [[RANK_TIERS]].
 */
export const LEGEND_TITLE = {
  key: 'legenda',
  name: 'Legendă',
  topPositions: 100,
} as const;

function buildTiers(): RankTier[] {
  const tiers: RankTier[] = [];
  let order = 0;

  for (const major of MAJOR_RANKS) {
    if (major.divisions === 0) {
      tiers.push({
        order: ++order,
        majorRank: major.majorRank,
        majorName: major.name,
        division: null,
        eloMin: major.eloMin,
        eloMax: major.eloMax,
        key: major.key,
      });
      continue;
    }

    const span = (major.eloMax as number) - major.eloMin + 1;
    const step = Math.floor(span / major.divisions);
    // Diviziunea III este cea mai joasă, I cea mai înaltă (ca în MOBA-uri).
    for (let index = 0; index < major.divisions; index += 1) {
      const division = major.divisions - index;
      const eloMin = major.eloMin + index * step;
      const isLast = index === major.divisions - 1;
      const eloMax = isLast
        ? (major.eloMax as number)
        : major.eloMin + (index + 1) * step - 1;
      tiers.push({
        order: ++order,
        majorRank: major.majorRank,
        majorName: major.name,
        division,
        eloMin,
        eloMax,
        key: `${major.key}-${division}`,
      });
    }
  }

  return tiers;
}

export const RANK_TIERS: readonly RankTier[] = Object.freeze(buildTiers());

export const ROMAN_DIVISIONS: Readonly<Record<number, string>> = Object.freeze({
  1: 'I',
  2: 'II',
  3: 'III',
});

export function tierForElo(elo: number): RankTier {
  const rating = Number.isFinite(elo) ? Math.trunc(elo) : 0;
  if (rating <= RANK_TIERS[0].eloMin) return RANK_TIERS[0];

  for (const tier of RANK_TIERS) {
    if (tier.eloMax === null) return tier;
    if (rating >= tier.eloMin && rating <= tier.eloMax) return tier;
  }
  return RANK_TIERS[RANK_TIERS.length - 1];
}

export function tierLabel(tier: RankTier): string {
  return tier.division === null
    ? tier.majorName
    : `${tier.majorName} ${ROMAN_DIVISIONS[tier.division]}`;
}

/** Câți puncte de ELO mai sunt până la următoarea treaptă. `null` la vârf. */
export function eloToNextTier(elo: number): number | null {
  const tier = tierForElo(elo);
  if (tier.eloMax === null) return null;
  return tier.eloMax + 1 - Math.trunc(elo);
}

/** Progresul (0-1) în interiorul treptei curente. Vârful este mereu plin. */
export function tierProgress(elo: number): number {
  const tier = tierForElo(elo);
  if (tier.eloMax === null) return 1;
  const span = tier.eloMax - tier.eloMin + 1;
  const into = Math.trunc(elo) - tier.eloMin;
  const ratio = into / span;
  if (ratio < 0) return 0;
  return ratio > 1 ? 1 : ratio;
}

export interface ResolvedRank {
  readonly key: string;
  readonly label: string;
  readonly majorRank: number;
  readonly majorName: string;
  readonly division: number | null;
  readonly order: number;
  readonly totalTiers: number;
  readonly elo: number;
  readonly eloToNextTier: number | null;
  readonly progress: number;
  readonly isLegend: boolean;
}

export function resolveRank(
  elo: number,
  position?: number | null,
): ResolvedRank {
  const tier = tierForElo(elo);
  const isLegend =
    typeof position === 'number' &&
    position > 0 &&
    position <= LEGEND_TITLE.topPositions &&
    tier.eloMax === null;

  return {
    key: isLegend ? LEGEND_TITLE.key : tier.key,
    label: isLegend ? LEGEND_TITLE.name : tierLabel(tier),
    majorRank: tier.majorRank,
    majorName: tier.majorName,
    division: tier.division,
    order: tier.order,
    totalTiers: RANK_TIERS.length,
    elo: Math.trunc(elo),
    eloToNextTier: eloToNextTier(elo),
    progress: tierProgress(elo),
    isLegend,
  };
}
