import { AccountCapabilities } from './account-policy';

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
