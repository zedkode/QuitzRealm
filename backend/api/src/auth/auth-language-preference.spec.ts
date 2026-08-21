import { AdminRole } from '@prisma/client';
import { AuthService } from './auth.service';

describe('AuthService saved language preference', () => {
  function serviceWithLanguage(
    language: {
      isoCode: string;
      active: boolean;
    } | null,
  ) {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'player@example.com',
          username: 'player',
          displayName: null,
          role: AdminRole.USER,
          bannedAt: null,
          language,
          emailVerifiedAt: null,
          birthDate: null,
        }),
      },
    };
    return new AuthService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
  }

  it('exposes an active account preference to the locale resolver', async () => {
    const service = serviceWithLanguage({ isoCode: 'ro', active: true });

    await expect(
      service.validateAccessUser({
        sub: 'user-1',
        email: 'player@example.com',
      }),
    ).resolves.toMatchObject({ languageIsoCode: 'ro' });
  });

  it('ignores a retired language so localization can fall back safely', async () => {
    const service = serviceWithLanguage({ isoCode: 'ro', active: false });

    const user = await service.validateAccessUser({
      sub: 'user-1',
      email: 'player@example.com',
    });
    expect(user.languageIsoCode).toBeUndefined();
  });
});
