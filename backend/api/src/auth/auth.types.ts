import { AccountCapabilities } from './account-policy';
import type { AdminRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  /// Sesiunea (dispozitivul) pentru care a fost emis token-ul. Prezentă și pe
  /// access token, ca logout-ul să știe ce sesiune să închidă.
  sid?: string;
}

export interface RefreshPayload extends JwtPayload {
  /// Identificator unic per token emis: două rotații în aceeași secundă ar
  /// produce altfel exact același token.
  jti?: string;
  sid?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  sessionId?: string;
  role: AdminRole;
  capabilities: AccountCapabilities;
}

export interface GoogleUser {
  googleId: string;
  email: string;
  displayName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/// După parola corectă, un cont cu 2FA activ nu primește tokenuri până nu
/// confirmă codul TOTP sau un cod de recuperare. Tokenul de provocare e scurt
/// și se consumă o singură dată.
export interface TwoFactorChallenge {
  twoFactorRequired: true;
  challengeToken: string;
  expiresAt: string;
}

export type LoginResult = AuthTokens | TwoFactorChallenge;

export function isTwoFactorChallenge(value: LoginResult): value is TwoFactorChallenge {
  return 'twoFactorRequired' in value && value.twoFactorRequired === true;
}
