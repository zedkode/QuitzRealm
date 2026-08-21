import { Prisma, PrismaClient } from '@prisma/client';
import {
  buildInitialCategoryTranslations,
  categoryNameKey,
  INITIAL_CATEGORY_TAXONOMY,
  INITIAL_TAXONOMY_CHILD_COUNT,
  INITIAL_TAXONOMY_ROOT_COUNT,
  INITIAL_TAXONOMY_TOTAL_COUNT,
  TaxonomyNode,
  validateCategoryTranslationDefinitions,
  validateTaxonomyDefinition,
} from './initial-taxonomy';

export interface TaxonomySeedResult {
  created: number;
  updated: number;
  unchanged: number;
  total: number;
}

export interface TaxonomyVerificationResult {
  valid: boolean;
  expectedRoots: number;
  expectedChildren: number;
  expectedTotal: number;
  matchedRoots: number;
  matchedChildren: number;
  errors: string[];
}

export interface CategoryTranslationSeedResult {
  inserted: number;
  total: number;
}

export interface CategoryTranslationVerificationResult {
  valid: boolean;
  expected: number;
  matched: number;
  errors: string[];
}

interface SyncResult {
  id: string;
  state: 'created' | 'updated' | 'unchanged';
}

const taxonomyCode = (node: TaxonomyNode): string | null => node.code ?? null;

async function syncNode(
  transaction: Prisma.TransactionClient,
  node: TaxonomyNode,
  parentId: string | null,
): Promise<SyncResult> {
  const canonical = await transaction.category.findUnique({
    where: { id: node.id },
  });
  const existing =
    canonical ??
    (await transaction.category.findFirst({
      where: node.code
        ? {
            OR: [
              { code: node.code },
              { name: node.name, parentId, code: null },
            ],
          }
        : { name: node.name, parentId },
      orderBy: { id: 'asc' },
    }));
  const expectedNameKey = categoryNameKey(node);
  const expectedCountryCode = node.countryCode ?? null;
  if (!existing) {
    const created = await transaction.category.create({
      data: {
        id: node.id,
        code: node.code,
        nameKey: expectedNameKey,
        name: node.name,
        countryCode: expectedCountryCode,
        icon: node.icon,
        parentId,
      },
    });
    return { id: created.id, state: 'created' };
  }
  if (
    existing.icon === node.icon &&
    existing.code === (node.code ?? null) &&
    existing.nameKey === expectedNameKey &&
    existing.name === node.name &&
    existing.countryCode === expectedCountryCode &&
    existing.parentId === parentId
  ) {
    return { id: existing.id, state: 'unchanged' };
  }
  const updated = await transaction.category.update({
    where: { id: existing.id },
    data: {
      code: node.code,
      nameKey: expectedNameKey,
      name: node.name,
      countryCode: expectedCountryCode,
      icon: node.icon,
      parentId,
    },
  });
  return { id: updated.id, state: 'updated' };
}

export async function syncInitialCategoryTaxonomy(
  transaction: Prisma.TransactionClient,
): Promise<TaxonomySeedResult> {
  validateTaxonomyDefinition(INITIAL_CATEGORY_TAXONOMY);
  const result: TaxonomySeedResult = {
    created: 0,
    updated: 0,
    unchanged: 0,
    total: INITIAL_TAXONOMY_TOTAL_COUNT,
  };
  for (const root of INITIAL_CATEGORY_TAXONOMY) {
    const syncedRoot = await syncNode(transaction, root, null);
    result[syncedRoot.state] += 1;
    for (const child of root.children) {
      const syncedChild = await syncNode(transaction, child, syncedRoot.id);
      result[syncedChild.state] += 1;
    }
  }
  return result;
}

export async function seedInitialCategoryTaxonomy(
  prisma: PrismaClient,
): Promise<TaxonomySeedResult> {
  return prisma.$transaction(async (transaction) => {
    const result = await syncInitialCategoryTaxonomy(transaction);
    await transaction.$executeRaw(
      Prisma.sql`ALTER TABLE "categories" VALIDATE CONSTRAINT "categories_country_code_fkey"`,
    );
    return result;
  });
}

export async function syncInitialCategoryTranslations(
  transaction: Prisma.TransactionClient,
): Promise<CategoryTranslationSeedResult> {
  validateCategoryTranslationDefinitions();
  const definitions = buildInitialCategoryTranslations();
  const isoCodes = ['ro', 'en'] as const;
  const languages = await transaction.language.findMany({
    where: { isoCode: { in: [...isoCodes] } },
    select: { id: true, isoCode: true },
  });
  const languageIds = new Map(
    languages.map((language) => [language.isoCode, language.id]),
  );
  for (const isoCode of isoCodes) {
    if (!languageIds.has(isoCode)) {
      throw new Error(
        `Limba ${isoCode} trebuie populată înaintea traducerilor de categorii.`,
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

export async function seedInitialCategoryTranslations(
  prisma: PrismaClient,
): Promise<CategoryTranslationSeedResult> {
  return prisma.$transaction(syncInitialCategoryTranslations);
}

export async function verifyInitialCategoryTaxonomy(
  prisma: PrismaClient,
): Promise<TaxonomyVerificationResult> {
  validateTaxonomyDefinition(INITIAL_CATEGORY_TAXONOMY);
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      code: true,
      nameKey: true,
      name: true,
      countryCode: true,
      icon: true,
      parentId: true,
    },
  });
  const errors: string[] = [];
  let matchedRoots = 0;
  let matchedChildren = 0;

  for (const root of INITIAL_CATEGORY_TAXONOMY) {
    const rootMatches = categories.filter(
      (category) => category.nameKey === categoryNameKey(root),
    );
    if (rootMatches.length !== 1) {
      errors.push(
        `Categoria-rădăcină ${root.name} apare de ${rootMatches.length} ori.`,
      );
      continue;
    }
    const storedRoot = rootMatches[0];
    matchedRoots += 1;
    if (storedRoot.icon !== root.icon) {
      errors.push(`Icon incorect pentru categoria ${root.name}.`);
    }
    if (storedRoot.code !== taxonomyCode(root)) {
      errors.push(`Cod incorect pentru categoria ${root.name}.`);
    }
    if (storedRoot.nameKey !== categoryNameKey(root)) {
      errors.push(`Cheie de traducere incorectă pentru ${root.name}.`);
    }
    if (storedRoot.countryCode !== (root.countryCode ?? null)) {
      errors.push(`Țară incorectă pentru categoria ${root.name}.`);
    }
    if (storedRoot.name !== root.name || storedRoot.parentId !== null) {
      errors.push(`Identitate incorectă pentru categoria ${root.name}.`);
    }
    for (const child of root.children) {
      const childMatches = categories.filter(
        (category) => category.nameKey === categoryNameKey(child),
      );
      if (childMatches.length !== 1) {
        errors.push(
          `Subcategoria ${root.name} / ${child.name} apare de ${childMatches.length} ori.`,
        );
        continue;
      }
      matchedChildren += 1;
      if (childMatches[0].icon !== child.icon) {
        errors.push(`Icon incorect pentru ${root.name} / ${child.name}.`);
      }
      if (childMatches[0].code !== taxonomyCode(child)) {
        errors.push(`Cod incorect pentru ${root.name} / ${child.name}.`);
      }
      if (childMatches[0].nameKey !== categoryNameKey(child)) {
        errors.push(
          `Cheie de traducere incorectă pentru ${root.name} / ${child.name}.`,
        );
      }
      if (childMatches[0].countryCode !== (child.countryCode ?? null)) {
        errors.push(`Țară incorectă pentru ${root.name} / ${child.name}.`);
      }
      if (
        childMatches[0].name !== child.name ||
        childMatches[0].parentId !== storedRoot.id
      ) {
        errors.push(`Identitate incorectă pentru ${root.name} / ${child.name}.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    expectedRoots: INITIAL_TAXONOMY_ROOT_COUNT,
    expectedChildren: INITIAL_TAXONOMY_CHILD_COUNT,
    expectedTotal: INITIAL_TAXONOMY_TOTAL_COUNT,
    matchedRoots,
    matchedChildren,
    errors,
  };
}

export async function verifyInitialCategoryTranslations(
  prisma: PrismaClient,
): Promise<CategoryTranslationVerificationResult> {
  validateCategoryTranslationDefinitions();
  const definitions = buildInitialCategoryTranslations();
  const expectedPairs = new Set(
    definitions.map(
      (definition) => `${definition.key}\u0000${definition.languageIsoCode}`,
    ),
  );
  const translations = await prisma.translation.findMany({
    where: { key: { in: [...new Set(definitions.map(({ key }) => key))] } },
    select: {
      key: true,
      value: true,
      language: { select: { isoCode: true } },
    },
  });
  const actualPairs = new Set<string>();
  const errors: string[] = [];
  for (const translation of translations) {
    const pair = `${translation.key}\u0000${translation.language.isoCode}`;
    if (!expectedPairs.has(pair)) continue;
    if (translation.value.trim().length === 0) {
      errors.push(
        `Traducere goală pentru ${translation.key}/${translation.language.isoCode}.`,
      );
    }
    actualPairs.add(pair);
  }
  for (const pair of expectedPairs) {
    if (!actualPairs.has(pair)) {
      errors.push(`Traducere lipsă pentru ${pair.replace('\u0000', '/')}.`);
    }
  }
  return {
    valid: errors.length === 0,
    expected: expectedPairs.size,
    matched: actualPairs.size,
    errors,
  };
}
