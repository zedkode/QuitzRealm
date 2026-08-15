export const BOOTSTRAP_QUESTION_TARGET = 5_000;
export const QUESTION_DIFFICULTIES = [1, 2, 3, 4, 5] as const;

export interface BootstrapLeafCategory {
  id: string;
  name: string;
  parentName: string;
}

export interface BootstrapQuestionBucket {
  categoryId: string;
  categoryName: string;
  parentName: string;
  difficulty: number;
  target: number;
  existing: number;
  missing: number;
}

export interface BootstrapQuestionPlan {
  targetTotal: number;
  existingTowardTarget: number;
  missingTotal: number;
  categoryCount: number;
  bucketCount: number;
  buckets: BootstrapQuestionBucket[];
}

export function questionBucketKey(
  categoryId: string,
  difficulty: number,
): string {
  return `${categoryId}:${difficulty}`;
}

export function buildBootstrapQuestionPlan(
  categories: readonly BootstrapLeafCategory[],
  existingCounts: ReadonlyMap<string, number>,
  targetTotal = BOOTSTRAP_QUESTION_TARGET,
): BootstrapQuestionPlan {
  if (categories.length === 0) {
    throw new Error("Taxonomy-ul nu conține subcategorii pentru generare.");
  }
  if (!Number.isSafeInteger(targetTotal) || targetTotal < 1) {
    throw new Error("Ținta de întrebări trebuie să fie un întreg pozitiv.");
  }

  const sortedCategories = [...categories].sort((left, right) =>
    left.id.localeCompare(right.id),
  );
  const bucketCount = sortedCategories.length * QUESTION_DIFFICULTIES.length;
  const baseTarget = Math.floor(targetTotal / bucketCount);
  const remainder = targetTotal % bucketCount;
  let bucketIndex = 0;
  const buckets: BootstrapQuestionBucket[] = [];

  for (const category of sortedCategories) {
    for (const difficulty of QUESTION_DIFFICULTIES) {
      const target = baseTarget + (bucketIndex < remainder ? 1 : 0);
      const existing = Math.max(
        0,
        existingCounts.get(questionBucketKey(category.id, difficulty)) ?? 0,
      );
      buckets.push({
        categoryId: category.id,
        categoryName: category.name,
        parentName: category.parentName,
        difficulty,
        target,
        existing,
        missing: Math.max(0, target - existing),
      });
      bucketIndex += 1;
    }
  }

  return {
    targetTotal,
    existingTowardTarget: buckets.reduce(
      (sum, bucket) => sum + Math.min(bucket.existing, bucket.target),
      0,
    ),
    missingTotal: buckets.reduce((sum, bucket) => sum + bucket.missing, 0),
    categoryCount: sortedCategories.length,
    bucketCount,
    buckets,
  };
}
