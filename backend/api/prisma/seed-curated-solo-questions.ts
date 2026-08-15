import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  Prisma,
  PrismaClient,
  QuestionSource,
  QuestionStatus,
} from '@prisma/client';
import {
  CURATED_SOLO_QUESTION_PACK,
  CuratedSoloQuestion,
  questionTextSimilarity,
  validateCuratedSoloQuestionPack,
} from '../src/questions/curated-solo-question-pack';

type StoredQuestion = Awaited<
  ReturnType<PrismaClient['question']['findUnique']>
>;

interface PackPlan {
  created: number;
  updated: number;
  unchanged: number;
}

const confirmReviewed = process.argv.includes('--confirm-reviewed');
const unknownArguments = process.argv
  .slice(2)
  .filter((argument) => argument !== '--confirm-reviewed');

function optionsValue(
  question: CuratedSoloQuestion,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return question.options === null ? Prisma.JsonNull : [...question.options];
}

function matchesDefinition(
  stored: NonNullable<StoredQuestion>,
  definition: CuratedSoloQuestion,
): boolean {
  return (
    stored.type === definition.type &&
    stored.categoryId === definition.categoryId &&
    stored.difficulty === definition.difficulty &&
    stored.text === definition.text &&
    JSON.stringify(stored.options) === JSON.stringify(definition.options) &&
    stored.correctAnswer === definition.correctAnswer &&
    stored.explanation === definition.explanation &&
    stored.verificationSource === definition.verificationSource &&
    stored.source === definition.source &&
    stored.status === definition.status &&
    stored.language === definition.language
  );
}

async function assertDatabasePreconditions(
  prisma: PrismaClient,
): Promise<void> {
  const categoryIds = [
    ...new Set(
      CURATED_SOLO_QUESTION_PACK.map((question) => question.categoryId),
    ),
  ];
  const storedCategoryIds = new Set(
    (
      await prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true },
      })
    ).map((category) => category.id),
  );
  const missingCategories = categoryIds.filter(
    (categoryId) => !storedCategoryIds.has(categoryId),
  );
  if (missingCategories.length > 0) {
    throw new Error(
      `Lipsesc categorii necesare pachetului curated: ${missingCategories.join(', ')}.`,
    );
  }

  const ids = CURATED_SOLO_QUESTION_PACK.map((question) => question.id);
  const existingTargets = await prisma.question.findMany({
    where: { id: { in: ids } },
    select: { id: true, source: true, status: true },
  });
  for (const existing of existingTargets) {
    if (existing.source !== QuestionSource.CURATED) {
      throw new Error(
        `ID-ul stabil ${existing.id} aparține unei întrebări care nu este CURATED.`,
      );
    }
    if (
      existing.status === QuestionStatus.FLAGGED ||
      existing.status === QuestionStatus.REJECTED
    ) {
      throw new Error(
        `Întrebarea ${existing.id} este ${existing.status} și nu poate fi reaprobată automat.`,
      );
    }
  }

  const candidates = await prisma.question.findMany({
    where: {
      id: { notIn: ids },
      categoryId: { in: categoryIds },
    },
    select: { id: true, categoryId: true, text: true },
  });
  for (const definition of CURATED_SOLO_QUESTION_PACK) {
    const duplicate = candidates.find(
      (candidate) =>
        candidate.categoryId === definition.categoryId &&
        questionTextSimilarity(candidate.text, definition.text) >= 0.85,
    );
    if (duplicate) {
      throw new Error(
        `Întrebarea curated ${definition.id} este prea similară cu ${duplicate.id}.`,
      );
    }
  }
}

async function buildPlan(prisma: PrismaClient): Promise<PackPlan> {
  const stored = await prisma.question.findMany({
    where: {
      id: { in: CURATED_SOLO_QUESTION_PACK.map((question) => question.id) },
    },
  });
  const byId = new Map(stored.map((question) => [question.id, question]));
  const plan: PackPlan = { created: 0, updated: 0, unchanged: 0 };
  for (const definition of CURATED_SOLO_QUESTION_PACK) {
    const existing = byId.get(definition.id);
    if (!existing) plan.created += 1;
    else if (matchesDefinition(existing, definition)) plan.unchanged += 1;
    else plan.updated += 1;
  }
  return plan;
}

async function applyPack(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    for (const definition of CURATED_SOLO_QUESTION_PACK) {
      const data = {
        type: definition.type,
        categoryId: definition.categoryId,
        difficulty: definition.difficulty,
        text: definition.text,
        options: optionsValue(definition),
        correctAnswer: definition.correctAnswer,
        explanation: definition.explanation,
        verificationSource: definition.verificationSource,
        source: definition.source,
        status: definition.status,
        language: definition.language,
      };
      await transaction.question.upsert({
        where: { id: definition.id },
        create: { id: definition.id, ...data },
        update: data,
      });
    }
  });
}

async function verifyStoredPack(prisma: PrismaClient): Promise<void> {
  const stored = await prisma.question.findMany({
    where: {
      id: { in: CURATED_SOLO_QUESTION_PACK.map((question) => question.id) },
    },
  });
  if (stored.length !== CURATED_SOLO_QUESTION_PACK.length) {
    throw new Error(
      `Verificarea DB a găsit ${stored.length} din ${CURATED_SOLO_QUESTION_PACK.length} întrebări.`,
    );
  }
  const byId = new Map(stored.map((question) => [question.id, question]));
  const mismatch = CURATED_SOLO_QUESTION_PACK.find((definition) => {
    const question = byId.get(definition.id);
    return !question || !matchesDefinition(question, definition);
  });
  if (mismatch) {
    throw new Error(`Verificarea DB a eșuat pentru întrebarea ${mismatch.id}.`);
  }
}

async function main(): Promise<void> {
  if (unknownArguments.length > 0) {
    throw new Error(`Argumente necunoscute: ${unknownArguments.join(', ')}.`);
  }
  validateCuratedSoloQuestionPack(CURATED_SOLO_QUESTION_PACK);
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL nu este configurat.');
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  try {
    await assertDatabasePreconditions(prisma);
    const plan = await buildPlan(prisma);
    if (!confirmReviewed) {
      process.stdout.write(
        `${JSON.stringify({
          mode: 'dry-run',
          reviewed: false,
          total: CURATED_SOLO_QUESTION_PACK.length,
          ...plan,
          next: 'Reverifică sursele oficiale, apoi rulează cu --confirm-reviewed.',
        })}\n`,
      );
      return;
    }

    await applyPack(prisma);
    await verifyStoredPack(prisma);
    process.stdout.write(
      `${JSON.stringify({
        mode: 'applied',
        reviewed: true,
        total: CURATED_SOLO_QUESTION_PACK.length,
        ...plan,
        verifiedInDatabase: CURATED_SOLO_QUESTION_PACK.length,
      })}\n`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main();
