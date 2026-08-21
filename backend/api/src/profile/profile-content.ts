/**
 * Regulile de conținut ale profilului: bio, status custom, linkuri externe și
 * schimbarea identității regionale. Funcții pure — se testează fără bază de date și sunt
 * singurul loc unde trăiesc pragurile.
 *
 * `owner-plan.md` §4.3 (bio), §4.4 (status), §4.6 (linkuri), §10.2 (țară).
 */

import { containsProfanity, countLinks } from '../chat/content-filter';

export const BIO_MAX_LENGTH = 200;
export const STATUS_TEXT_MAX_LENGTH = 80;
export const STATUS_EMOJI_MAX_LENGTH = 16;

/** §4.6: câte linkuri încap pe un profil înainte să devină un panou de reclame. */
export const MAX_PROFILE_LINKS = 4;

export const LINK_LABEL_MAX_LENGTH = 32;
export const LINK_URL_MAX_LENGTH = 200;

/** §10.2 cere „o dată la 60-90 zile"; luăm capătul de sus. */
export const REGION_CHANGE_COOLDOWN_DAYS = 90;

export type ContentRejection =
  | 'too_long'
  | 'profanity'
  | 'contains_link'
  | 'invalid_emoji';

export interface ContentCheck {
  readonly ok: boolean;
  readonly reason?: ContentRejection;
}

const ACCEPTED: ContentCheck = Object.freeze({ ok: true });

function rejected(reason: ContentRejection): ContentCheck {
  return { ok: false, reason };
}

/**
 * „Despre mine" (§4.3).
 *
 * Profanitatea se **respinge**, nu se maschează ca la chat: un mesaj mascat
 * păstrează contextul conversației, dar o biografie plină de asteriscuri n-are
 * niciun destinatar care s-o citească — autorul e singurul care o poate
 * repara, deci merită să afle imediat.
 *
 * Linkurile n-au voie în bio nici la conturile cu drept de linkuri: §4.6 le
 * cere într-un câmp propriu, unde domeniul trece prin verificare. Un link scris
 * în text ar ocoli exact acea verificare.
 */
export function checkBio(bio: string): ContentCheck {
  if (bio.length > BIO_MAX_LENGTH) return rejected('too_long');
  if (containsProfanity(bio)) return rejected('profanity');
  if (countLinks(bio) > 0) return rejected('contains_link');
  return ACCEPTED;
}

export function checkStatusText(text: string): ContentCheck {
  if (text.length > STATUS_TEXT_MAX_LENGTH) return rejected('too_long');
  if (containsProfanity(text)) return rejected('profanity');
  if (countLinks(text) > 0) return rejected('contains_link');
  return ACCEPTED;
}

/**
 * Emoji-ul de status (§4.4).
 *
 * Nu încercăm să validăm că e „un emoji real" — lista lor crește cu fiecare
 * versiune Unicode, iar o listă închisă ar respinge mâine simboluri legitime.
 * Verificăm ce contează: să fie scurt și să nu conțină litere, cifre sau spații,
 * adică să nu fie un al doilea câmp de text strecurat lângă status.
 */
export function checkStatusEmoji(emoji: string): ContentCheck {
  if (emoji.length > STATUS_EMOJI_MAX_LENGTH) return rejected('too_long');
  if (/[\p{L}\p{N}\s]/u.test(emoji)) return rejected('invalid_emoji');
  return ACCEPTED;
}

/**
 * Domeniile acceptate pe profil (§4.6).
 *
 * **Listă albă, nu neagră.** §4.6 spune „verificare/blacklist de domenii", dar
 * o listă neagră presupune că știm dinainte fiecare domeniu de phishing, ceea
 * ce nu e adevărat: atacatorul își cumpără un domeniu nou în cinci minute.
 * Până există coada de moderare din §13.3 care să poată judeca un domeniu
 * necunoscut, lista albă e singura formă în care linkurile nu devin un canal de
 * phishing gratuit. Domeniile libere se deblochează odată cu moderarea.
 */
const ALLOWED_LINK_HOSTS: readonly string[] = Object.freeze([
  'discord.gg',
  'discord.com',
  'facebook.com',
  'github.com',
  'instagram.com',
  'kick.com',
  'linkedin.com',
  'reddit.com',
  'steamcommunity.com',
  'threads.net',
  'tiktok.com',
  'twitch.tv',
  'x.com',
  'twitter.com',
  'youtube.com',
]);

export type LinkRejection =
  | 'label_too_long'
  | 'url_too_long'
  | 'malformed'
  | 'insecure_scheme'
  | 'has_credentials'
  | 'host_not_allowed'
  | 'too_many';

export interface LinkCheck {
  readonly ok: boolean;
  readonly reason?: LinkRejection;
  /** URL-ul normalizat care se salvează, când verificarea a trecut. */
  readonly url?: string;
  readonly host?: string;
}

/** Elimină `www.` și un punct final, ca `x.com` și `www.x.com.` să fie același. */
function normaliseHost(hostname: string): string {
  return hostname.toLowerCase().replace(/\.$/, '').replace(/^www\./, '');
}

export function isAllowedLinkHost(hostname: string): boolean {
  const host = normaliseHost(hostname);
  return ALLOWED_LINK_HOSTS.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`),
  );
}

/**
 * Verifică un link înainte de salvare.
 *
 * Se respinge `user:parola@gazdă` chiar dacă gazda e permisă: forma asta e
 * folosită tocmai ca să ascundă destinația reală într-un text care pare o
 * adresă cunoscută.
 */
export function checkLink(label: string, rawUrl: string): LinkCheck {
  if (label.trim().length === 0 || label.length > LINK_LABEL_MAX_LENGTH) {
    return { ok: false, reason: 'label_too_long' };
  }
  if (rawUrl.length > LINK_URL_MAX_LENGTH) {
    return { ok: false, reason: 'url_too_long' };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { ok: false, reason: 'malformed' };
  }

  // Doar `https`. Pe `http` linkul e interceptabil, iar restul schemelor
  // (`javascript:`, `data:`) n-au ce căuta într-un profil public.
  if (parsed.protocol !== 'https:') {
    return { ok: false, reason: 'insecure_scheme' };
  }
  if (parsed.username !== '' || parsed.password !== '') {
    return { ok: false, reason: 'has_credentials' };
  }
  if (!isAllowedLinkHost(parsed.hostname)) {
    return { ok: false, reason: 'host_not_allowed' };
  }

  return {
    ok: true,
    url: parsed.toString(),
    host: normaliseHost(parsed.hostname),
  };
}

/**
 * Cine poate pune linkuri pe profil (§4.6 + §2.5).
 *
 * Trei condiții, nu una: emailul confirmat și vârsta vin din capabilitățile
 * contului (§1.3), iar treapta T3 de încredere cere joc real. Un cont creat
 * acum cinci minute nu are cum să treacă toate trei, ceea ce e exact scopul.
 */
export function canPublishLinks({
  canPostExternalLinks,
  trustTier,
}: {
  canPostExternalLinks: boolean;
  trustTier: number;
}): boolean {
  return canPostExternalLinks && trustTier >= 3;
}

/**
 * Când devine disponibilă următoarea schimbare de țară sau limbă (§10.2).
 * `null` înseamnă că perechea poate fi schimbată acum. Ambele alegeri pot
 * schimba pool-ul competitiv, deci folosesc aceeași fereastră de cooldown.
 */
export function regionChangeAvailableAt(
  lastChangedAt: Date | null,
  now: Date,
): Date | null {
  if (lastChangedAt === null) return null;
  const available = new Date(lastChangedAt.getTime());
  available.setUTCDate(available.getUTCDate() + REGION_CHANGE_COOLDOWN_DAYS);
  return available.getTime() <= now.getTime() ? null : available;
}

export function canChangeRegion(
  lastChangedAt: Date | null,
  now: Date,
): boolean {
  return regionChangeAvailableAt(lastChangedAt, now) === null;
}
