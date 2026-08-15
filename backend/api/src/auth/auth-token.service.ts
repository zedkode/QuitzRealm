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
};

export interface IssuedToken {
  /// Valoarea brută, singura dată când există în clar. Pleacă spre email și
  /// nu se mai poate recupera din baza de date.
  token: string;
  expiresAt: Date;
}

/// Tokenurile trimise pe email: se păstrează hash-ate, expiră și se consumă o
/// singură dată.
@Injectable()
export class AuthTokenService {
  constructor(private readonly prisma: PrismaService) {}

  /// Emite un token nou și invalidează cererile anterioare de același tip —
  /// altfel un utilizator care cere de trei ori resetarea ar rămâne cu trei
  /// linkuri valide simultan.
  async issue(userId: string, purpose: AuthTokenPurpose): Promise<IssuedToken> {
    // `selector.verifier`: selectorul găsește rândul (index unic), verifier-ul
    // dovedește că deținem token-ul (comparat pe hash).
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

  /// Consumă un token. Întoarce `userId` la succes, `null` altfel.
  ///
  /// Token-ul nu conține identitatea utilizatorului: cine interceptează linkul
  /// nu află cui îi aparține.
  async consume(
    token: string,
    purpose: AuthTokenPurpose,
  ): Promise<string | null> {
    const separator = token.indexOf('.');
    if (separator <= 0) return null;
    const selector = token.slice(0, separator);
    const verifier = token.slice(separator + 1);
    if (!verifier) return null;

    const record = await this.prisma.authToken.findUnique({
      where: { selector },
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
    if (!(await argon2.verify(record.tokenHash, verifier))) return null;

    // Filtrul pe `usedAt: null` face consumul atomic: din două cereri
    // simultane cu același token trece una singură.
    const claimed = await this.prisma.authToken.updateMany({
      where: { id: record.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    return claimed.count === 1 ? record.userId : null;
  }
}
