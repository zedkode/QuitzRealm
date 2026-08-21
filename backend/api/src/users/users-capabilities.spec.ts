import type { LeaderboardService } from '../leaderboard/leaderboard.service';
import type { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService.getCapabilities', () => {
  function serviceWith(user: {
    emailVerifiedAt: Date | null;
    birthDate: Date | null;
    countryCode: string | null;
    language: { isoCode: string } | null;
  }) {
    const findUniqueOrThrow = jest.fn().mockResolvedValue(user);
    const prisma = { user: { findUniqueOrThrow } };
    const service = new UsersService(
      prisma as unknown as PrismaService,
      {} as LeaderboardService,
    );
    return { service, findUniqueOrThrow };
  }

  it('adds the server-side language and country to the existing capabilities', async () => {
    const { service, findUniqueOrThrow } = serviceWith({
      emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
      birthDate: new Date('2000-01-01T00:00:00.000Z'),
      countryCode: 'RO',
      language: { isoCode: 'ro' },
    });

    await expect(service.getCapabilities('user-id')).resolves.toMatchObject({
      emailVerified: true,
      canPlayRanked: true,
      countryCode: 'RO',
      languageIsoCode: 'ro',
    });
    expect(findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      select: {
        emailVerifiedAt: true,
        birthDate: true,
        countryCode: true,
        language: { select: { isoCode: true } },
      },
    });
  });

  it('keeps missing region preferences explicit instead of inventing defaults', async () => {
    const { service } = serviceWith({
      emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
      birthDate: new Date('2000-01-01T00:00:00.000Z'),
      countryCode: null,
      language: null,
    });

    await expect(service.getCapabilities('user-id')).resolves.toMatchObject({
      countryCode: null,
      languageIsoCode: null,
    });
  });
});
