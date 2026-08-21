/// Tipurile pe care le folosesc **și** web-ul, **și** panoul de administrare.
///
/// Orice tip care e al unuia singur nu are ce căuta aici: pachetul comun e
/// contractul cu serverul, nu o ladă de vechituri.

export type AuthTokens = { accessToken: string; refreshToken: string };

/// Rolurile vin din enum-ul Prisma `AdminRole`, deci cu majuscule. Un tip cu
/// minuscule nu s-ar potrivi niciodată cu ce trimite API-ul.
export type AccountRole = "USER" | "ADMIN" | "MODERATOR" | "CONTENT_EDITOR" | "SUPPORT";

/// Rolurile care deschid panoul de administrare.
export const STAFF_ROLES: readonly AccountRole[] = [
  "ADMIN", "MODERATOR", "CONTENT_EDITOR", "SUPPORT",
];

export function isStaff(role: string | undefined | null): boolean {
  return STAFF_ROLES.includes(role as AccountRole);
}

export interface UserIdentity {
  id: string;
  username: string;
  displayName?: string | null;
  email: string;
  role?: AccountRole;
}

export type LoginResult = AuthTokens | { twoFactorRequired: true; challengeToken: string };
