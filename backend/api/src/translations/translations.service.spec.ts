import type { PrismaService } from '../prisma/prisma.service';
import { TranslationsService } from './translations.service';

const updatedAt = new Date('2026-08-21T20:00:00.000Z');

function createPrismaMock() {
  return {
    language: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    translation: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  };
}

describe('TranslationsService', () => {
  it('merges missing localized values from English and reports fallback keys', async () => {
    const prisma = createPrismaMock();
    prisma.language.findMany.mockResolvedValue([
      { id: 'language-ro', isoCode: 'ro' },
      { id: 'language-en', isoCode: 'en' },
    ]);
    prisma.translation.findMany.mockResolvedValue([
      {
        key: 'country.ro.name',
        value: 'Romania',
        updatedAt,
        language: { isoCode: 'en' },
      },
      {
        key: 'country.ro.name',
        value: 'România',
        updatedAt,
        language: { isoCode: 'ro' },
      },
      {
        key: 'rank.oracle.name',
        value: 'Oracle',
        updatedAt,
        language: { isoCode: 'en' },
      },
      {
        key: 'system.translation.missing',
        value: 'Content unavailable',
        updatedAt,
        language: { isoCode: 'en' },
      },
      {
        key: 'system.translation.missing',
        value: 'Conținut indisponibil',
        updatedAt,
        language: { isoCode: 'ro' },
      },
    ]);
    const service = new TranslationsService(prisma as unknown as PrismaService);

    const catalog = await service.catalog('RO');

    expect(catalog).toMatchObject({
      requestedLanguage: 'ro',
      resolvedLanguage: 'ro',
      fallbackLanguage: 'en',
      usedLanguageFallback: false,
      fallbackKeys: ['rank.oracle.name'],
      entries: {
        'country.ro.name': 'România',
        'rank.oracle.name': 'Oracle',
        'system.translation.missing': 'Conținut indisponibil',
      },
      updatedAt: updatedAt.toISOString(),
    });
  });

  it('resolves an unsupported but valid language code entirely to English', async () => {
    const prisma = createPrismaMock();
    prisma.language.findMany.mockResolvedValue([
      { id: 'language-en', isoCode: 'en' },
    ]);
    prisma.translation.findMany.mockResolvedValue([
      {
        key: 'system.translation.missing',
        value: 'Content unavailable',
        updatedAt,
        language: { isoCode: 'en' },
      },
    ]);
    const service = new TranslationsService(prisma as unknown as PrismaService);

    await expect(service.catalog('fr')).resolves.toMatchObject({
      requestedLanguage: 'fr',
      resolvedLanguage: 'en',
      usedLanguageFallback: true,
      fallbackKeys: [],
      entries: { 'system.translation.missing': 'Content unavailable' },
    });
  });

  it('builds the admin matrix and highlights missing languages', async () => {
    const prisma = createPrismaMock();
    prisma.language.findMany.mockResolvedValue([
      { isoCode: 'en' },
      { isoCode: 'ro' },
    ]);
    prisma.translation.findMany.mockResolvedValue([
      {
        key: 'rank.oracle.name',
        value: 'Oracle',
        updatedAt,
        language: { isoCode: 'en' },
      },
    ]);
    const service = new TranslationsService(prisma as unknown as PrismaService);

    await expect(service.matrix()).resolves.toEqual({
      languages: ['en', 'ro'],
      entries: [
        {
          key: 'rank.oracle.name',
          values: { en: 'Oracle', ro: null },
          missingLanguages: ['ro'],
        },
      ],
    });
  });

  it('validates input and upserts with the actor id', async () => {
    const prisma = createPrismaMock();
    prisma.language.findUnique.mockResolvedValue({ id: 'language-ro' });
    prisma.translation.upsert.mockResolvedValue({
      key: 'rank.oracle.name',
      value: 'Oracol',
    });
    const service = new TranslationsService(prisma as unknown as PrismaService);

    await service.upsert('ro', 'rank.oracle.name', 'Oracol', 'editor-id');

    expect(prisma.translation.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          key_languageId: {
            key: 'rank.oracle.name',
            languageId: 'language-ro',
          },
        },
        update: { value: 'Oracol', updatedById: 'editor-id' },
      }),
    );
  });

  it('returns localized structured errors for invalid data', async () => {
    const prisma = createPrismaMock();
    const service = new TranslationsService(prisma as unknown as PrismaService);

    await expect(
      service.upsert('ro', 'invalid', '', 'editor-id'),
    ).rejects.toMatchObject({
      response: {
        code: 'INVALID_TRANSLATION_KEY',
        messageKey: 'error.translation.invalid_key',
        params: { key: 'invalid' },
      },
    });

    prisma.language.findUnique.mockResolvedValue(null);
    await expect(
      service.upsert('fr', 'rank.oracle.name', 'Oracle', 'editor-id'),
    ).rejects.toMatchObject({
      response: {
        code: 'LANGUAGE_NOT_SUPPORTED',
        messageKey: 'error.language.not_supported',
        params: { language: 'fr' },
      },
    });
  });
});
