import { ConflictException } from '@nestjs/common';
import { ProfileService } from './profile.service';

describe('ProfileService region identity', () => {
  const profile = { id: 'user-1', region: {} };

  function setup(lockedUser: {
    countryCode: string | null;
    languageId: string | null;
    languageIsGlobalPool?: boolean | null;
    regionChangedAt: Date | null;
  }) {
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([lockedUser]),
      country: {
        findUnique: jest.fn().mockResolvedValue({
          isoAlpha2: 'RO',
          nameKey: 'country.ro.name',
          active: true,
        }),
      },
      language: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'language-ro',
          isoCode: 'ro',
          nameKey: 'language.ro.name',
          isGlobalPool: false,
          active: true,
        }),
      },
      user: { update: jest.fn().mockResolvedValue(undefined) },
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
      country: { findMany: jest.fn() },
      language: { findMany: jest.fn() },
    };
    const service = new ProfileService(
      prisma as never,
      {} as never,
      {} as never,
    );
    jest.spyOn(service, 'getMyProfile').mockResolvedValue(profile as never);
    return { prisma, service, tx };
  }

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns database-backed suggestions without assigning them', async () => {
    const { prisma, service } = setup({
      countryCode: null,
      languageId: null,
      regionChangedAt: null,
    });
    prisma.country.findMany.mockResolvedValue([
      {
        isoAlpha2: 'RO',
        nameKey: 'country.ro.name',
        defaultLanguage: { isoCode: 'ro' },
      },
      {
        isoAlpha2: 'GB',
        nameKey: 'country.gb.name',
        defaultLanguage: { isoCode: 'en' },
      },
    ]);
    prisma.language.findMany.mockResolvedValue([
      { isoCode: 'en', nameKey: 'language.en.name', isGlobalPool: true },
      { isoCode: 'ro', nameKey: 'language.ro.name', isGlobalPool: false },
    ]);

    await expect(service.getRegionOptions('ro')).resolves.toEqual({
      countries: [
        {
          isoAlpha2: 'RO',
          nameKey: 'country.ro.name',
          defaultLanguageIsoCode: 'ro',
        },
        {
          isoAlpha2: 'GB',
          nameKey: 'country.gb.name',
          defaultLanguageIsoCode: 'en',
        },
      ],
      languages: [
        { isoCode: 'en', nameKey: 'language.en.name', isGlobalPool: true },
        { isoCode: 'ro', nameKey: 'language.ro.name', isGlobalPool: false },
      ],
      suggestion: {
        countryCode: 'RO',
        languageIsoCode: 'ro',
        confirmationRequired: true,
      },
      cooldownDays: 90,
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('stores the first country and language choice atomically', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-21T20:00:00Z'));
    const { service, tx } = setup({
      countryCode: null,
      languageId: null,
      regionChangedAt: null,
    });

    await expect(
      service.updateRegion('user-1', {
        countryCode: 'ro',
        languageIsoCode: 'RO',
      }),
    ).resolves.toBe(profile);
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        countryCode: 'RO',
        languageId: 'language-ro',
        regionChangedAt: new Date('2026-08-21T20:00:00Z'),
      },
    });
  });

  it('marks an existing regional rank for recalibration after a pool change', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-12-01T12:00:00Z'));
    const { service, tx } = setup({
      countryCode: 'RO',
      languageId: 'language-en',
      regionChangedAt: new Date('2026-08-01T12:00:00Z'),
    });

    await service.updateRegion('user-1', {
      countryCode: 'RO',
      languageIsoCode: 'ro',
    });

    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        countryCode: 'RO',
        languageId: 'language-ro',
        regionChangedAt: new Date('2026-12-01T12:00:00Z'),
        rankRecalibrationRequestedAt: new Date('2026-12-01T12:00:00Z'),
      },
    });
  });

  it('does not recalibrate when only the country changes inside the global pool', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-12-01T12:00:00Z'));
    const { service, tx } = setup({
      countryCode: 'RO',
      languageId: 'language-en',
      languageIsGlobalPool: true,
      regionChangedAt: new Date('2026-08-01T12:00:00Z'),
    });
    tx.country.findUnique.mockResolvedValue({
      isoAlpha2: 'GB',
      nameKey: 'country.gb.name',
      active: true,
    });
    tx.language.findUnique.mockResolvedValue({
      id: 'language-en',
      isoCode: 'en',
      nameKey: 'language.en.name',
      isGlobalPool: true,
      active: true,
    });

    await service.updateRegion('user-1', {
      countryCode: 'GB',
      languageIsoCode: 'en',
    });

    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        countryCode: 'GB',
        languageId: 'language-en',
        regionChangedAt: new Date('2026-12-01T12:00:00Z'),
      },
    });
  });

  it('enforces the shared cooldown when either selection changes', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-21T20:00:00Z'));
    const { service, tx } = setup({
      countryCode: 'RO',
      languageId: 'language-en',
      regionChangedAt: new Date('2026-08-01T12:00:00Z'),
    });

    const call = service.updateRegion('user-1', {
      countryCode: 'RO',
      languageIsoCode: 'ro',
    });
    await expect(call).rejects.toBeInstanceOf(ConflictException);
    await expect(call).rejects.toMatchObject({
      response: {
        code: 'REGION_CHANGE_COOLDOWN_ACTIVE',
        messageKey: 'error.region.cooldown_active',
        params: {
          availableAt: '2026-10-30T12:00:00.000Z',
          cooldownDays: 90,
        },
      },
    });
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it('keeps an identical confirmed choice idempotent during cooldown', async () => {
    const { service, tx } = setup({
      countryCode: 'RO',
      languageId: 'language-ro',
      regionChangedAt: new Date(),
    });

    await expect(
      service.updateRegion('user-1', {
        countryCode: 'RO',
        languageIsoCode: 'ro',
      }),
    ).resolves.toBe(profile);
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it('rejects inactive reference data with localized error contracts', async () => {
    const { service, tx } = setup({
      countryCode: null,
      languageId: null,
      regionChangedAt: null,
    });
    tx.language.findUnique.mockResolvedValue({
      id: 'language-ro',
      isoCode: 'ro',
      nameKey: 'language.ro.name',
      isGlobalPool: false,
      active: false,
    });

    await expect(
      service.updateRegion('user-1', {
        countryCode: 'RO',
        languageIsoCode: 'ro',
      }),
    ).rejects.toMatchObject({
      response: {
        code: 'LANGUAGE_NOT_SUPPORTED',
        messageKey: 'error.language.not_supported',
        params: { language: 'ro' },
      },
    });
  });
});
