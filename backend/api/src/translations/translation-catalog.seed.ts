import { Prisma, PrismaClient } from '@prisma/client';
import {
  ACTIVE_LANGUAGES,
  COUNTRIES,
  type CountryDefinition,
  type LanguageDefinition,
} from '../reference-data/reference-data';

export const FALLBACK_LANGUAGE_ISO_CODE = 'en';
export const MISSING_TRANSLATION_KEY = 'system.translation.missing';

export interface TranslationSeedDefinition {
  readonly key: string;
  readonly languageIsoCode: string;
  readonly value: string;
}

export interface TranslationSeedResult {
  readonly inserted: number;
  readonly total: number;
}

const SYSTEM_TRANSLATIONS: Readonly<
  Record<string, Readonly<Record<string, string>>>
> = {
  en: {
    [MISSING_TRANSLATION_KEY]: 'Content unavailable',
    'error.language.not_supported': 'The selected language is not supported.',
    'error.translation.fallback_unavailable':
      'The translation fallback is unavailable.',
    'error.translation.invalid_key': 'The translation key is invalid.',
    'error.translation.value_required': 'The translation value is required.',
  },
  ro: {
    [MISSING_TRANSLATION_KEY]: 'Conținut indisponibil',
    'error.language.not_supported': 'Limba selectată nu este disponibilă.',
    'error.translation.fallback_unavailable':
      'Limba de rezervă pentru traduceri nu este disponibilă.',
    'error.translation.invalid_key': 'Cheia traducerii nu este validă.',
    'error.translation.value_required': 'Valoarea traducerii este obligatorie.',
  },
};

function displayName(
  locale: string,
  type: 'language' | 'region',
  code: string,
): string {
  const names = new Intl.DisplayNames([locale], { type, fallback: 'none' });
  const value = names.of(code)?.trim();
  if (!value) {
    throw new Error(
      `Intl.DisplayNames nu poate rezolva ${type} ${code} în ${locale}.`,
    );
  }
  return value;
}

export function buildInitialTranslationCatalog(
  languages: readonly LanguageDefinition[] = ACTIVE_LANGUAGES,
  countries: readonly CountryDefinition[] = COUNTRIES,
): readonly TranslationSeedDefinition[] {
  const definitions: TranslationSeedDefinition[] = [];

  for (const targetLanguage of languages) {
    const locale = targetLanguage.isoCode;

    for (const language of languages) {
      definitions.push({
        key: language.nameKey,
        languageIsoCode: locale,
        value: displayName(locale, 'language', language.isoCode),
      });
    }

    for (const country of countries) {
      definitions.push({
        key: country.nameKey,
        languageIsoCode: locale,
        value: displayName(locale, 'region', country.isoAlpha2),
      });
    }

    for (const [key, value] of Object.entries(
      SYSTEM_TRANSLATIONS[locale] ?? {},
    )) {
      definitions.push({ key, languageIsoCode: locale, value });
    }
  }

  const identities = definitions.map(
    (item) => `${item.key}\u0000${item.languageIsoCode}`,
  );
  if (new Set(identities).size !== identities.length) {
    throw new Error('Catalogul inițial conține traduceri duplicate.');
  }

  return definitions.sort((left, right) =>
    `${left.key}:${left.languageIsoCode}`.localeCompare(
      `${right.key}:${right.languageIsoCode}`,
    ),
  );
}

export async function syncInitialTranslations(
  transaction: Prisma.TransactionClient,
): Promise<TranslationSeedResult> {
  const definitions = buildInitialTranslationCatalog();
  const isoCodes = ACTIVE_LANGUAGES.map((language) => language.isoCode);
  const storedLanguages = await transaction.language.findMany({
    where: { isoCode: { in: isoCodes } },
    select: { id: true, isoCode: true },
  });
  const languageIds = new Map(
    storedLanguages.map((language) => [language.isoCode, language.id]),
  );

  for (const isoCode of isoCodes) {
    if (!languageIds.has(isoCode)) {
      throw new Error(
        `Limba ${isoCode} trebuie populată înaintea traducerilor.`,
      );
    }
  }

  const result = await transaction.translation.createMany({
    data: definitions.map((definition) => ({
      key: definition.key,
      languageId: languageIds.get(definition.languageIsoCode)!,
      value: definition.value,
    })),
    skipDuplicates: true,
  });

  return { inserted: result.count, total: definitions.length };
}

export async function seedTranslationCatalog(
  prisma: PrismaClient,
): Promise<TranslationSeedResult> {
  return prisma.$transaction(syncInitialTranslations);
}
