import { ConfigService } from '@nestjs/config';
import { TotpService } from './totp.service';

describe('TotpService', () => {
  const service = new TotpService({
    get: <T>(key: string, fallback?: T) =>
      key === 'TWO_FACTOR_ENCRYPTION_SECRET' ? ('test-secret' as T) : fallback,
    getOrThrow: <T>() => 'refresh-secret' as T,
  } as unknown as ConfigService);

  it('validează vectorul RFC-6238 cu șase cifre', () => {
    // Secretul ASCII "12345678901234567890" codificat Base32. La t=59s,
    // vectorul RFC este 94287082; pentru șase cifre păstrăm 287082.
    expect(
      service.verifyCode(
        'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
        '287082',
        new Date(59_000),
      ),
    ).toBe(true);
    expect(
      service.verifyCode(
        'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
        '000000',
        new Date(59_000),
      ),
    ).toBe(false);
  });

  it('criptează secretul înainte de persistență și îl poate recupera doar cu aceeași cheie', () => {
    const enrollment = service.createEnrollment({ accountName: 'jucator@test.dev' });
    const encrypted = service.encryptSecret(enrollment.secret);

    expect(encrypted).not.toContain(enrollment.secret);
    expect(service.decryptSecret(encrypted)).toBe(enrollment.secret);
    expect(enrollment.otpauthUri).toContain('otpauth://totp/');
  });

  it('elimină un singur cod de recuperare la utilizare', async () => {
    const set = await service.createRecoveryCodes();
    const remaining = await service.consumeRecoveryCode(
      set.hashes,
      set.plaintext[0],
    );
    const safeRemaining = remaining ?? [];

    expect(remaining).not.toBeNull();
    expect(safeRemaining).toHaveLength(set.hashes.length - 1);
    expect(
      await service.consumeRecoveryCode(safeRemaining, set.plaintext[0]),
    ).toBeNull();
  });
});
