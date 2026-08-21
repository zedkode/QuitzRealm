import type { PrismaService } from '../prisma/prisma.service';
import {
  LocaleResolverService,
  parseAcceptLanguage,
} from './locale-resolver.service';

function prismaWithLanguages(...isoCodes: string[]) {
  return {
    language: {
      findMany: jest
        .fn()
        .mockResolvedValue(isoCodes.map((isoCode) => ({ isoCode }))),
    },
  };
}

describe('LocaleResolverService', () => {
  it('orders Accept-Language values by quality and ignores wildcards', () => {
    expect(
      parseAcceptLanguage('de;q=.5, ro-RO;q=0.9, en;q=0.8, *;q=1'),
    ).toEqual(['ro-ro', 'en', 'de']);
  });

  it('prefers the authenticated account language over the header', async () => {
    const prisma = prismaWithLanguages('en', 'ro');
    const resolver = new LocaleResolverService(
      prisma as unknown as PrismaService,
    );

    await expect(
      resolver.resolve({
        user: { languageIsoCode: 'ro' },
        headers: { 'accept-language': 'en' },
      }),
    ).resolves.toBe('ro');
  });

  it('uses a supported header language and reduces regional tags', async () => {
    const prisma = prismaWithLanguages('en', 'ro');
    const resolver = new LocaleResolverService(
      prisma as unknown as PrismaService,
    );

    await expect(
      resolver.resolve({ headers: { 'accept-language': 'fr, en-GB;q=0.8' } }),
    ).resolves.toBe('en');
  });

  it('falls back to English when preferences are absent or unsupported', async () => {
    const prisma = prismaWithLanguages('en', 'ro');
    const resolver = new LocaleResolverService(
      prisma as unknown as PrismaService,
    );

    await expect(
      resolver.resolve({
        user: { languageIsoCode: 'fr' },
        headers: { 'accept-language': 'de' },
      }),
    ).resolves.toBe('en');
  });

  it('fails safely to English when the language registry is unavailable', async () => {
    const prisma = prismaWithLanguages();
    prisma.language.findMany.mockRejectedValue(new Error('database offline'));
    const resolver = new LocaleResolverService(
      prisma as unknown as PrismaService,
    );

    await expect(
      resolver.resolve({ headers: { 'accept-language': 'ro' } }),
    ).resolves.toBe('en');
  });
});
