/// Regulile de cont din `docs/features-social-progression.md` §1.2 și §1.3,
/// scrise ca funcții pure: se pot testa fără bază de date și sunt singurul loc
/// unde trăiesc pragurile, ca să nu se rescrie diferit în două servicii.

/// Sub această vârstă contul nu se poate crea deloc.
export const MINIMUM_AGE_YEARS = 13;

/// Între [MINIMUM_AGE_YEARS] și această vârstă, contul e de minor: chat global
/// restricționat, DM doar de la prieteni, fără linkuri externe pe profil.
/// 16 ani este pragul implicit de consimțământ digital din GDPR (art. 8).
export const MINOR_AGE_YEARS = 16;

/// „Schimbabil rar” din §1.2, cu aceeași fereastră ca la Discord.
export const USERNAME_CHANGE_COOLDOWN_DAYS = 30;

/// Vârsta împlinită la momentul [now]. Calculul merge pe calendar, nu pe
/// milisecunde: un an nu are o durată fixă.
export function ageInYears(birthDate: Date, now: Date): number {
  let age = now.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - birthDate.getUTCMonth();
  const dayDelta = now.getUTCDate() - birthDate.getUTCDate();
  if (monthDelta < 0 || (monthDelta === 0 && dayDelta < 0)) {
    age -= 1;
  }
  return age;
}

export function isBelowMinimumAge(birthDate: Date, now: Date): boolean {
  return ageInYears(birthDate, now) < MINIMUM_AGE_YEARS;
}

/// Contul de minor. Fără dată de naștere tratăm contul ca minor: e alegerea
/// prudentă, pentru că restricțiile protejează, iar absența datei nu e o
/// dovadă că utilizatorul e major.
export function isMinorAccount(birthDate: Date | null, now: Date): boolean {
  if (birthDate === null) return true;
  return ageInYears(birthDate, now) < MINOR_AGE_YEARS;
}

/// O dată de naștere în viitor sau absurd de veche nu e o dată reală.
export function isPlausibleBirthDate(birthDate: Date, now: Date): boolean {
  if (Number.isNaN(birthDate.getTime())) return false;
  if (birthDate.getTime() > now.getTime()) return false;
  return ageInYears(birthDate, now) <= 120;
}

/// Când devine disponibilă următoarea schimbare de username. `null` înseamnă
/// că se poate schimba acum (niciodată schimbat sau cooldown expirat).
export function usernameChangeAvailableAt(
  lastChangedAt: Date | null,
  now: Date,
): Date | null {
  if (lastChangedAt === null) return null;
  const available = new Date(lastChangedAt.getTime());
  available.setUTCDate(available.getUTCDate() + USERNAME_CHANGE_COOLDOWN_DAYS);
  return available.getTime() <= now.getTime() ? null : available;
}

export function canChangeUsername(
  lastChangedAt: Date | null,
  now: Date,
): boolean {
  return usernameChangeAvailableAt(lastChangedAt, now) === null;
}

/// Ce poate face contul, derivat din verificarea emailului și din vârstă.
/// §1.3: multiplayer ranked și chat global cer email verificat.
export interface AccountCapabilities {
  emailVerified: boolean;
  isMinor: boolean;
  canPlayRanked: boolean;
  canUseGlobalChat: boolean;
  canPostExternalLinks: boolean;
  /// Implicit `friends_only` pentru minori și obligatoriu, nu doar implicit.
  dmPermissionLocked: boolean;
}

export function capabilitiesFor({
  emailVerifiedAt,
  birthDate,
  now,
}: {
  emailVerifiedAt: Date | null;
  birthDate: Date | null;
  now: Date;
}): AccountCapabilities {
  const emailVerified = emailVerifiedAt !== null;
  const minor = isMinorAccount(birthDate, now);
  return {
    emailVerified,
    isMinor: minor,
    canPlayRanked: emailVerified,
    // Minorii nu primesc chat global liber nici după verificarea emailului.
    canUseGlobalChat: emailVerified && !minor,
    canPostExternalLinks: emailVerified && !minor,
    dmPermissionLocked: minor,
  };
}
