import { Injectable } from '@nestjs/common';
import { AuthTokenPurpose } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

/// Cât trăiește fiecare tip de token. Resetarea de parolă e cea mai sensibilă,
/// deci are fereastra cea mai scurtă (§1.4 cere 15-30 min).
const TTL_MINUTES: Record<AuthTokenPurpose, number> = {
  EMAIL_VERIFICATION: 60 * 24,
  PASSWORD_RESET: 30,
  // Parola tocmai a fost verificată; provocarea trebuie rezolvată imediat,
  // nu poate deveni o a doua sesiune de autentificare reutilizabilă.
  TWO_FACTOR_LOGIN: 5,
  MOBILE_OAUTH_EXCHANGE: 2,
};

export interface IssuedToken {
  /// Valoarea brută, singura dată când există în clar. Pleacă spre email și
  /// nu se mai poate recupera din baza de date.
  token: string;
  expiresAt: Date;
}

export interface VerifiedAuthToken {
  id: string;
  userId: string;
}

/// Tokenurile de autentificare se păstrează hash-ate, expiră și se consumă o
/// singură dată. Același mecanism protejează linkurile din email și provocarea
/// temporară dintre parolă și verificarea TOTP.
@Injectable()
export class AuthTokenService {
  constructor(private readonly prisma: PrismaService) {}

  /// Emite un token nou și invalidează cererile anterioare de același tip —
  /// altfel un utilizator care cere de trei ori resetarea ar rămâne cu trei
  /// linkuri valide simultan.
  async issue(userId: string, purpose: AuthTokenPurpose): Promise<IssuedToken> {
    const selector = randomBytes(12).toString('base64url');
    const verifier = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + TTL_MINUTES[purpose] * 60 * 1_000);

    await this.prisma.$transaction([
      this.prisma.authToken.updateMany({
        where: { userId, purpose, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.authToken.create({
        data: {
          userId,
          purpose,
          selector,
          tokenHash: await argon2.hash(verifier),
          expiresAt,
        },
      }),
    ]);

    return { token: `${selector}.${verifier}`, expiresAt };
  }

  /// Verifică tokenul fără să-l consume. Este folosit doar pentru provocarea
  /// TOTP: codul poate fi introdus greșit fără ca jucătorul să-și piardă
  /// fereastra de login. Apelantul trebuie să cheme apoi [claim] la succes.
  async inspect(
    token: string,
    purpose: AuthTokenPurpose,
  ): Promise<VerifiedAuthToken | null> {
    const parsed = this.parse(token);
    if (!parsed) return null;

    const record = await this.prisma.authToken.findUnique({
      where: { selector: parsed.selector },
      select: {
        id: true,
        userId: true,
        purpose: true,
        tokenHash: true,
        usedAt: true,
        expiresAt: true,
      },
    });
    if (
      !record ||
      record.purpose !== purpose ||
      record.usedAt !== null ||
      record.expiresAt.getTime() <= Date.now()
    ) {
      return null;
    }
    if (!(await argon2.verify(record.tokenHash, parsed.verifier))) return null;
    return { id: record.id, userId: record.userId };
  }

  /// Marchează atomic tokenul verificat ca utilizat. Filtrul pe `usedAt` și pe
  /// expirare face ca două cereri simultane să nu poată finaliza aceeași login.
  async claim(tokenId: string): Promise<boolean> {
    const claimed = await this.prisma.authToken.updateMany({
      where: { id: tokenId, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    return claimed.count === 1;
  }

  /// Consumă un token într-un singur pas. Este potrivit pentru linkurile
  /// email, unde nu există o verificare suplimentară între validare și consum.
  async consume(
    token: string,
    purpose: AuthTokenPurpose,
  ): Promise<string | null> {
    const record = await this.inspect(token, purpose);
    if (!record) return null;
    return (await this.claim(record.id)) ? record.userId : null;
  }

  private parse(token: string): { selector: string; verifier: string } | null {
    const separator = token.indexOf('.');
    if (separator <= 0) return null;
    const selector = token.slice(0, separator);
    const verifier = token.slice(separator + 1);
    return verifier ? { selector, verifier } : null;
  }
}
