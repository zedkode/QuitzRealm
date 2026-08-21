import type { Prisma } from '@prisma/client';
import { ACTIVE_LANGUAGES, COUNTRIES } from '../reference-data/reference-data';
import {
  buildInitialTranslationCatalog,
  QUESTION_BANK_TRANSLATION_KEYS,
  SYSTEM_TRANSLATION_KEY_COUNT,
  syncInitialTranslations,
} from './translation-catalog.seed';

describe('translation catalog seed', () => {
  it('builds a complete, unique catalog for every active language', () => {
    const catalog = buildInitialTranslationCatalog();
    const expectedPerLanguage =
      COUNTRIES.length + ACTIVE_LANGUAGES.length + SYSTEM_TRANSLATION_KEY_COUNT;

    expect(catalog).toHaveLength(ACTIVE_LANGUAGES.length * expectedPerLanguage);
    expect(
      new Set(
        catalog.map(({ key, languageIsoCode }) => `${key}:${languageIsoCode}`),
      ).size,
    ).toBe(catalog.length);

    for (const language of ACTIVE_LANGUAGES) {
      const localized = catalog.filter(
        (item) => item.languageIsoCode === language.isoCode,
      );
      expect(localized).toHaveLength(expectedPerLanguage);
      expect(localized.every((item) => item.value.trim().length > 0)).toBe(
        true,
      );
      expect(
        localized.some((item) => item.key === 'system.translation.missing'),
      ).toBe(true);
      for (const key of QUESTION_BANK_TRANSLATION_KEYS) {
        expect(localized.some((item) => item.key === key)).toBe(true);
      }
    }
  });

  it('inserts only missing rows so repeated seeds preserve edited values', async () => {
    const stored = new Map<string, string>();
    const findMany = jest.fn().mockResolvedValue([
      { id: 'language-ro', isoCode: 'ro' },
      { id: 'language-en', isoCode: 'en' },
    ]);
    const createMany = jest.fn(
      ({
        data,
      }: {
        data: { key: string; languageId: string; value: string }[];
      }) => {
        let count = 0;
        for (const item of data) {
          const identity = `${item.key}:${item.languageId}`;
          if (!stored.has(identity)) {
            stored.set(identity, item.value);
            count += 1;
          }
        }
        return Promise.resolve({ count });
      },
    );
    const transaction = {
      language: { findMany },
      translation: { createMany },
    } as unknown as Prisma.TransactionClient;

    const first = await syncInitialTranslations(transaction);
    stored.set('system.translation.missing:language-ro', 'Editat în admin');
    const second = await syncInitialTranslations(transaction);

    expect(first.inserted).toBe(first.total);
    expect(second).toEqual({ inserted: 0, total: first.total });
    expect(stored.get('system.translation.missing:language-ro')).toBe(
      'Editat în admin',
    );
    expect(createMany).toHaveBeenCalledWith(
      expect.objectContaining({ skipDuplicates: true }),
    );
  });
});
