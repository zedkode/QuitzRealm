import type { PrismaService } from '../prisma/prisma.service';
import { LocalizedContentService } from './localized-content.service';

describe('LocalizedContentService', () => {
  it('uses localized values, then English, then the safe missing value', async () => {
    const prisma = {
      translation: {
        findMany: jest.fn().mockResolvedValue([
          {
            key: 'auth.page.title',
            value: 'Titlu',
            language: { isoCode: 'ro' },
          },
          {
            key: 'auth.page.message',
            value: 'English message',
            language: { isoCode: 'en' },
          },
          {
            key: 'system.translation.missing',
            value: 'Conținut indisponibil',
            language: { isoCode: 'ro' },
          },
        ]),
      },
    };
    const service = new LocalizedContentService(
      prisma as unknown as PrismaService,
    );

    await expect(
      service.values('ro', [
        'auth.page.title',
        'auth.page.message',
        'auth.page.unknown',
      ]),
    ).resolves.toEqual({
      'auth.page.title': 'Titlu',
      'auth.page.message': 'English message',
      'auth.page.unknown': 'Conținut indisponibil',
    });
  });

  it('never returns a raw key when the safe missing value is unavailable', async () => {
    const prisma = {
      translation: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const service = new LocalizedContentService(
      prisma as unknown as PrismaService,
    );

    await expect(
      service.values('ro', ['auth.page.title']),
    ).rejects.toMatchObject({
      response: {
        code: 'TRANSLATION_FALLBACK_UNAVAILABLE',
        messageKey: 'error.translation.fallback_unavailable',
        params: {},
      },
    });
  });
});
