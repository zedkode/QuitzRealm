import { Prisma } from '@prisma/client';
import {
  ACTIVE_LANGUAGES,
  COUNTRIES,
  ISO_3166_ALPHA2_CODES,
  LanguageDefinition,
  validateReferenceDataDefinition,
} from './reference-data';
import { syncReferenceData } from './reference-data.seed';

describe('SRV-001 reference data', () => {
  it('conține toate țările ISO-3166 și numai engleza ca pool global', () => {
    expect(ISO_3166_ALPHA2_CODES).toHaveLength(249);
    expect(new Set(ISO_3166_ALPHA2_CODES).size).toBe(249);
    expect(ISO_3166_ALPHA2_CODES).toEqual(
      expect.arrayContaining(['AQ', 'BV', 'HM', 'TF', 'UM']),
    );
    expect(ISO_3166_ALPHA2_CODES).not.toContain('XK');
    expect(ACTIVE_LANGUAGES.filter((item) => item.isGlobalPool)).toEqual([
      expect.objectContaining({ isoCode: 'en' }),
    ]);
    expect(COUNTRIES.find((item) => item.isoAlpha2 === 'RO')).toEqual(
      expect.objectContaining({ defaultLanguageIsoCode: 'ro' }),
    );
    expect(COUNTRIES.find((item) => item.isoAlpha2 === 'GB')).toEqual(
      expect.objectContaining({ defaultLanguageIsoCode: 'en' }),
    );
    expect(() => validateReferenceDataDefinition()).not.toThrow();
  });

  it('respinge codurile duplicate și referințele spre limbi inactive', () => {
    const duplicateLanguages = [
      ...ACTIVE_LANGUAGES,
      { ...ACTIVE_LANGUAGES[0] },
    ] satisfies readonly LanguageDefinition[];
    expect(() =>
      validateReferenceDataDefinition(duplicateLanguages, COUNTRIES),
    ).toThrow('Cod de limbă duplicat');

    const invalidCountries = COUNTRIES.map((country, index) =>
      index === 0 ? { ...country, defaultLanguageIsoCode: 'fr' } : country,
    );
    expect(() =>
      validateReferenceDataDefinition(ACTIVE_LANGUAGES, invalidCountries),
    ).toThrow('indică limba inactivă');
  });

  it('poate fi rulat de două ori fără duplicate', async () => {
    const languages = new Map<string, { id: string }>();
    const countries = new Map<string, true>();
    const languageUpsert = jest.fn(
      ({ where }: { where: { isoCode: string } }) => {
        const stored = languages.get(where.isoCode) ?? {
          id: `language-${where.isoCode}`,
        };
        languages.set(where.isoCode, stored);
        return Promise.resolve(stored);
      },
    );
    const countryUpsert = jest.fn(
      ({ where }: { where: { isoAlpha2: string } }) => {
        countries.set(where.isoAlpha2, true);
        return Promise.resolve({ id: `country-${where.isoAlpha2}` });
      },
    );
    const transaction = {
      language: {
        upsert: languageUpsert,
      },
      country: {
        upsert: countryUpsert,
      },
    } as unknown as Prisma.TransactionClient;

    await syncReferenceData(transaction);
    await syncReferenceData(transaction);

    expect(languages.size).toBe(2);
    expect(countries.size).toBe(249);
    expect(languageUpsert).toHaveBeenCalledTimes(4);
    expect(countryUpsert).toHaveBeenCalledTimes(498);
  });
});
