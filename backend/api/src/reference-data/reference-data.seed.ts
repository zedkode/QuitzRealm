import { Prisma, PrismaClient } from '@prisma/client';
import {
  ACTIVE_LANGUAGES,
  COUNTRIES,
  validateReferenceDataDefinition,
} from './reference-data';

export interface ReferenceDataSeedResult {
  readonly languages: number;
  readonly countries: number;
}

export async function syncReferenceData(
  transaction: Prisma.TransactionClient,
): Promise<ReferenceDataSeedResult> {
  validateReferenceDataDefinition();

  const languageIds = new Map<string, string>();
  for (const language of ACTIVE_LANGUAGES) {
    const stored = await transaction.language.upsert({
      where: { isoCode: language.isoCode },
      update: {
        nameKey: language.nameKey,
        isGlobalPool: language.isGlobalPool,
        active: language.active,
      },
      create: language,
      select: { id: true },
    });
    languageIds.set(language.isoCode, stored.id);
  }

  for (const country of COUNTRIES) {
    const defaultLanguageId = languageIds.get(country.defaultLanguageIsoCode);
    if (!defaultLanguageId) {
      throw new Error(
        `Lipsește limba implicită ${country.defaultLanguageIsoCode} pentru ${country.isoAlpha2}.`,
      );
    }
    await transaction.country.upsert({
      where: { isoAlpha2: country.isoAlpha2 },
      update: {
        nameKey: country.nameKey,
        defaultLanguageId,
        active: country.active,
      },
      create: {
        isoAlpha2: country.isoAlpha2,
        nameKey: country.nameKey,
        defaultLanguageId,
        active: country.active,
      },
    });
  }

  return { languages: ACTIVE_LANGUAGES.length, countries: COUNTRIES.length };
}

export async function seedReferenceData(
  prisma: PrismaClient,
): Promise<ReferenceDataSeedResult> {
  return prisma.$transaction(syncReferenceData);
}
