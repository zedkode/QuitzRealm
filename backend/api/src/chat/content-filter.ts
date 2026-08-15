/// Filtrul de conținut din `docs/features-social-progression.md` §2.6.
///
/// Funcții pure, ca să poată fi testate fără bază de date și folosite identic
/// din API și din `backend/realtime`. Nu pretinde să prindă tot: un filtru de
/// cuvinte e o barieră împotriva abuzului ocazional, nu împotriva cuiva
/// hotărât. Ce scapă rămâne treaba raportării și a moderării umane.

/// Rădăcini de cuvinte, nu cuvinte întregi: româna flexionează mult, iar o
/// listă de forme complete ar rata majoritatea variantelor.
const PROFANITY_ROOTS: readonly string[] = [
  // română
  'pul',
  'pizd',
  'muie',
  'curv',
  'futu',
  'fute',
  'jeg',
  'cacat',
  'nesimtit',
  'tampit',
  'idiot',
  'cretin',
  'retard',
  // engleză
  'fuck',
  'shit',
  'bitch',
  'cunt',
  'asshole',
  'whore',
  'faggot',
  'nigger',
];

/// Litere cu diacritice și substituiri „leet”, normalizate înainte de căutare.
const LOOKALIKES: ReadonlyMap<string, string> = new Map(
  Object.entries({
    ă: 'a',
    â: 'a',
    î: 'i',
    ș: 's',
    ş: 's',
    ț: 't',
    ţ: 't',
    '0': 'o',
    '1': 'i',
    '3': 'e',
    '4': 'a',
    '5': 's',
    '@': 'a',
    $: 's',
  }),
);

const URL_PATTERN =
  /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:com|net|org|ro|io|gg|xyz|link|me|tk|top|shop)\b/gi;

export interface FilterResult {
  /// Textul care ajunge la ceilalți: profanitatea e mascată, nu ștearsă —
  /// destinatarul vede că s-a spus ceva, dar nu ce.
  sanitized: string;
  hasProfanity: boolean;
  linkCount: number;
}

/// Reduce textul la o formă comparabilă: fără diacritice, fără substituiri
/// „leet”, fără litere repetate. Fără asta, „p u l a” și „pu1a” ar trece.
export function normalizeForMatching(text: string): string {
  const lowered = text.toLowerCase();
  let normalized = '';
  for (const char of lowered) {
    normalized += LOOKALIKES.get(char) ?? char;
  }
  return (
    normalized
      .replace(/[^a-z0-9]/g, '')
      // Literele repetate se reduc la una singură, ca „creeeetin” să nu treacă.
      // Rădăcinile trec prin aceeași normalizare, altfel „asshole” n-ar mai
      // corespunde propriului tipar după colapsare.
      .replace(/(.)\1+/g, '$1')
  );
}

const NORMALIZED_ROOTS: readonly string[] =
  PROFANITY_ROOTS.map(normalizeForMatching);

export function containsProfanity(text: string): boolean {
  const normalized = normalizeForMatching(text);
  return NORMALIZED_ROOTS.some((root) => normalized.includes(root));
}

export function countLinks(text: string): number {
  return text.match(URL_PATTERN)?.length ?? 0;
}

export function filterMessage(text: string): FilterResult {
  const hasProfanity = containsProfanity(text);
  return {
    sanitized: hasProfanity ? maskProfanity(text) : text,
    hasProfanity,
    linkCount: countLinks(text),
  };
}

/// Maschează cuvintele care conțin o rădăcină interzisă, păstrând restul
/// propoziției. Un mesaj șters complet ascunde contextul de care are nevoie
/// destinatarul ca să decidă dacă raportează.
function maskProfanity(text: string): string {
  return text.replace(/\S+/g, (word) =>
    containsProfanity(word) ? '*'.repeat(Math.min(word.length, 8)) : word,
  );
}

export interface SpamVerdict {
  isSpam: boolean;
  reason?: 'repetition' | 'link_flood' | 'flood';
}

/// Detecția de spam din §2.6, pe fereastra de mesaje recente ale aceluiași
/// expeditor. Ia decizia din istoric, nu doar din mesajul curent: un singur
/// mesaj cu un link nu e spam, zece la rând sunt.
export function detectSpam({
  message,
  recentMessages,
  windowLimit = 8,
}: {
  message: string;
  /// Mesajele recente ale aceluiași expeditor, cel mai nou primul.
  recentMessages: readonly string[];
  /// Câte mesaje sunt prea multe în fereastra observată.
  windowLimit?: number;
}): SpamVerdict {
  if (recentMessages.length >= windowLimit) {
    return { isSpam: true, reason: 'flood' };
  }

  const normalized = normalizeForMatching(message);
  if (normalized.length > 0) {
    const repeats = recentMessages.filter(
      (previous) => normalizeForMatching(previous) === normalized,
    ).length;
    if (repeats >= 2) {
      return { isSpam: true, reason: 'repetition' };
    }
  }

  const linksInWindow =
    countLinks(message) +
    recentMessages.reduce((total, previous) => total + countLinks(previous), 0);
  if (linksInWindow >= 4) {
    return { isSpam: true, reason: 'link_flood' };
  }

  return { isSpam: false };
}
