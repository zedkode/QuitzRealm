import { Prisma, PrismaClient } from '@prisma/client';
import {
  INITIAL_CATEGORY_TAXONOMY,
  INITIAL_TAXONOMY_CHILD_COUNT,
  INITIAL_TAXONOMY_ROOT_COUNT,
  INITIAL_TAXONOMY_TOTAL_COUNT,
  TaxonomyNode,
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

interface SyncResult {
  id: string;
  state: 'created' | 'updated' | 'unchanged';
}

async function syncNode(
  transaction: Prisma.TransactionClient,
  node: TaxonomyNode,
  parentId: string | null,
): Promise<SyncResult> {
  const existing = await transaction.category.findFirst({
    where: { name: node.name, parentId },
    orderBy: { id: 'asc' },
  });
  if (!existing) {
    const created = await transaction.category.create({
      data: { id: node.id, name: node.name, icon: node.icon, parentId },
    });
    return { id: created.id, state: 'created' };
  }
  if (existing.icon === node.icon) {
    return { id: existing.id, state: 'unchanged' };
  }
  const updated = await transaction.category.update({
    where: { id: existing.id },
    data: { icon: node.icon },
  });
  return { id: updated.id, state: 'updated' };
}

export async function seedInitialCategoryTaxonomy(
  prisma: PrismaClient,
): Promise<TaxonomySeedResult> {
  validateTaxonomyDefinition(INITIAL_CATEGORY_TAXONOMY);
  return prisma.$transaction(async (transaction) => {
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
  });
}

export async function verifyInitialCategoryTaxonomy(
  prisma: PrismaClient,
): Promise<TaxonomyVerificationResult> {
  validateTaxonomyDefinition(INITIAL_CATEGORY_TAXONOMY);
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, icon: true, parentId: true },
  });
  const errors: string[] = [];
  let matchedRoots = 0;
  let matchedChildren = 0;

  for (const root of INITIAL_CATEGORY_TAXONOMY) {
    const rootMatches = categories.filter(
      (category) => category.parentId === null && category.name === root.name,
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
    for (const child of root.children) {
      const childMatches = categories.filter(
        (category) =>
          category.parentId === storedRoot.id && category.name === child.name,
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
