import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from 'node:crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const TOTP_PERIOD_SECONDS = 30;
const TOTP_DIGITS = 6;
const RECOVERY_CODE_COUNT = 10;

export interface TotpEnrollment {
  secret: string;
  otpauthUri: string;
}

export interface RecoveryCodeSet {
  plaintext: string[];
  hashes: string[];
}

/**
 * Implementare TOTP RFC-6238, ținută în API ca să nu depindă de un SDK mobil
 * sau de un provider extern. Secretul nu se salvează niciodată în clar, iar
 * codurile de recuperare se păstrează exclusiv ca hash-uri Argon2.
 */
@Injectable()
export class TotpService {
  private readonly encryptionKey: Buffer;

  constructor(config: ConfigService) {
    const material = config.get<string>(
      'TWO_FACTOR_ENCRYPTION_SECRET',
      config.getOrThrow<string>('JWT_REFRESH_SECRET'),
    );
    this.encryptionKey = createHash('sha256').update(material).digest();
  }

  createEnrollment({ accountName, issuer = 'QuizRealm' }: {
    accountName: string;
    issuer?: string;
  }): TotpEnrollment {
    const secret = this.toBase32(randomBytes(20));
    const label = `${issuer}:${accountName}`;
    const params = new URLSearchParams({
      secret,
      issuer,
      algorithm: 'SHA1',
      digits: String(TOTP_DIGITS),
      period: String(TOTP_PERIOD_SECONDS),
    });
    return {
      secret,
      otpauthUri: `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`,
    };
  }

  encryptSecret(secret: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv, tag, encrypted].map((part) => part.toString('base64url')).join('.');
  }

  decryptSecret(payload: string): string | null {
    const [ivRaw, tagRaw, encryptedRaw, ...extra] = payload.split('.');
    if (!ivRaw || !tagRaw || !encryptedRaw || extra.length > 0) return null;
    try {
      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.encryptionKey,
        Buffer.from(ivRaw, 'base64url'),
      );
      decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));
      return Buffer.concat([
        decipher.update(Buffer.from(encryptedRaw, 'base64url')),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      return null;
    }
  }

  verifyCode(secret: string, candidate: string, now = new Date()): boolean {
    const normalized = candidate.replace(/[\s-]/g, '');
    if (!/^\d{6}$/.test(normalized)) return false;
    const counter = Math.floor(now.getTime() / 1_000 / TOTP_PERIOD_SECONDS);
    // O fereastră de ±30 secunde acoperă deriva normală a ceasului, nu minute.
    return [-1, 0, 1].some(
      (offset) => this.totp(secret, counter + offset) === normalized,
    );
  }

  async createRecoveryCodes(): Promise<RecoveryCodeSet> {
    const plaintext = Array.from({ length: RECOVERY_CODE_COUNT }, () => {
      const raw = randomBytes(5).toString('hex').toUpperCase();
      return `${raw.slice(0, 5)}-${raw.slice(5)}`;
    });
    return {
      plaintext,
      hashes: await Promise.all(plaintext.map((code) => argon2.hash(code))),
    };
  }

  async consumeRecoveryCode(
    rawHashes: unknown,
    candidate: string,
  ): Promise<string[] | null> {
    if (!Array.isArray(rawHashes)) return null;
    const hashes = rawHashes.filter(
      (value): value is string => typeof value === 'string',
    );
    const normalized = candidate.trim().toUpperCase();
    for (let index = 0; index < hashes.length; index += 1) {
      if (await argon2.verify(hashes[index], normalized)) {
        return hashes.filter((_, current) => current !== index);
      }
    }
    return null;
  }

  private totp(secret: string, counter: number): string {
    const bytes = this.fromBase32(secret);
    const counterBytes = Buffer.alloc(8);
    counterBytes.writeBigUInt64BE(BigInt(counter));
    const digest = createHmac('sha1', bytes).update(counterBytes).digest();
    const offset = digest[digest.length - 1] & 0x0f;
    const value =
      ((digest[offset] & 0x7f) << 24) |
      (digest[offset + 1] << 16) |
      (digest[offset + 2] << 8) |
      digest[offset + 3];
    return String(value % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0');
  }

  private toBase32(buffer: Buffer): string {
    let bits = '';
    for (const byte of buffer) bits += byte.toString(2).padStart(8, '0');
    let output = '';
    for (let index = 0; index + 5 <= bits.length; index += 5) {
      output += BASE32_ALPHABET[Number.parseInt(bits.slice(index, index + 5), 2)];
    }
    if (bits.length % 5 > 0) {
      output += BASE32_ALPHABET[
        Number.parseInt(bits.slice(bits.length - (bits.length % 5)).padEnd(5, '0'), 2)
      ];
    }
    return output;
  }

  private fromBase32(value: string): Buffer {
    const normalized = value.replace(/[\s=]/g, '').toUpperCase();
    let bits = '';
    for (const character of normalized) {
      const index = BASE32_ALPHABET.indexOf(character);
      if (index < 0) throw new Error('Secret TOTP invalid.');
      bits += index.toString(2).padStart(5, '0');
    }
    const bytes: number[] = [];
    for (let index = 0; index + 8 <= bits.length; index += 8) {
      bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
    }
    return Buffer.from(bytes);
  }
}
