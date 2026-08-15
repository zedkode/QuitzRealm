/// Treptele de încredere din `docs/features-social-progression.md` §2.5,
/// scrise ca funcții pure: se pot testa fără bază de date și sunt singurul loc
/// unde trăiesc pragurile.
///
/// Pragurile **nu** ajung hardcodate în client: aplicația le citește din
/// `GET /chat/trust`. §2.5 le cere editabile din admin panel — până există
/// (§13), se schimbă aici, într-un singur loc.

export const TRUST_TIER_COUNT = 9;

/// Pragurile cresc aproape logaritmic: cu o bancă de zeci de mii de întrebări,
/// praguri liniare ar epuiza progresul în câteva săptămâni de joc.
export const TRUST_TIER_THRESHOLDS: readonly number[] = [
  0, // T0 — Nou
  10, // T1 — Ucenic
  50, // T2 — Contribuitor
  200, // T3 — Stabilit
  1_000, // T4 — Experimentat
  5_000, // T5 — Expert
  15_000, // T6 — Maestru al comunității
  50_000, // T7 — Elite
  100_000, // T8 — Legendă a comunității
];

/// Cheia de traducere a numelui treptei. Numele afișat stă în ARB-urile din
/// aplicație, nu aici: textul vizibil trece prin i18n (`agents.md`).
export const TRUST_TIER_KEYS: readonly string[] = [
  'newcomer',
  'apprentice',
  'contributor',
  'established',
  'experienced',
  'expert',
  'communityMaster',
  'elite',
  'communityLegend',
];

/// Unde poate scrie un jucător în chatul global.
export type GlobalChatAccess =
  /// Doar reacții presetate — fără text liber.
  | 'reactions'
  /// Text în partidele proprii, nu în lobby-urile publice.
  | 'ownMatches'
  /// Text peste tot, inclusiv lobby-uri publice.
  | 'public';

export interface ChatPermissions {
  tier: number;
  correctAnswers: number;
  /// Câte răspunsuri corecte mai sunt până la treapta următoare; `null` la T8.
  answersToNextTier: number | null;
  nextTierThreshold: number | null;
  globalChat: GlobalChatAccess;
  /// Chatul de prieteni e complet de la T0: relația e deja consimțită
  /// reciproc, deci nu are nevoie de o probă de bună-credință.
  canChatWithFriends: boolean;
  /// De la T2 în sus, cu coadă de „cerere de mesaj” la primul mesaj.
  canInitiateDm: boolean;
  /// Linkurile către prieteni sunt permise mai devreme decât în global:
  /// riscul de phishing e mult mai mic într-o relație acceptată.
  canPostLinksToFriends: boolean;
  canPostLinksInGlobal: boolean;
  /// Greutate suplimentară la moderare pentru rapoartele veteranilor (T4+).
  reportWeight: number;
}

export function tierFor(correctAnswers: number): number {
  const answers = Math.max(0, Math.floor(correctAnswers));
  let tier = 0;
  for (let index = 0; index < TRUST_TIER_THRESHOLDS.length; index += 1) {
    if (answers >= TRUST_TIER_THRESHOLDS[index]) tier = index;
  }
  return tier;
}

/// Ce poate face un jucător în chat.
///
/// `isMinor` nu e un modificator cosmetic: taie chatul global la reacții
/// indiferent de treaptă (§2.6). Un minor cu 100.000 de răspunsuri corecte tot
/// nu primește text liber către necunoscuți.
export function chatPermissionsFor({
  correctAnswers,
  isMinor,
  emailVerified,
}: {
  correctAnswers: number;
  isMinor: boolean;
  emailVerified: boolean;
}): ChatPermissions {
  const tier = tierFor(correctAnswers);
  const nextThreshold =
    tier + 1 < TRUST_TIER_THRESHOLDS.length
      ? TRUST_TIER_THRESHOLDS[tier + 1]
      : null;

  // §1.3: chatul global cere email confirmat, la fel ca ranked-ul.
  let globalChat: GlobalChatAccess = 'reactions';
  if (emailVerified && !isMinor) {
    if (tier >= 2) globalChat = 'public';
    else if (tier >= 1) globalChat = 'ownMatches';
  }

  return {
    tier,
    correctAnswers: Math.max(0, Math.floor(correctAnswers)),
    answersToNextTier:
      nextThreshold === null
        ? null
        : Math.max(0, nextThreshold - Math.max(0, Math.floor(correctAnswers))),
    nextTierThreshold: nextThreshold,
    globalChat,
    canChatWithFriends: true,
    canInitiateDm: tier >= 2 && emailVerified && !isMinor,
    canPostLinksToFriends: tier >= 2,
    canPostLinksInGlobal: tier >= 3 && !isMinor,
    reportWeight: tier >= 7 ? 3 : tier >= 4 ? 2 : 1,
  };
}
