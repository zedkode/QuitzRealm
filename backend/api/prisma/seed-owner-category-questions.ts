import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  Prisma,
  PrismaClient,
  QuestionSource,
  QuestionStatus,
  QuestionType,
} from '@prisma/client';
import {
  OWNER_CATEGORY_QUESTION_PACK,
  validateOwnerCategoryQuestionPack,
} from '../src/questions/owner-category-question-pack';

const applyPending = process.argv.includes('--apply-pending');
const unknownArguments = process.argv
  .slice(2)
  .filter((argument) => argument !== '--apply-pending');

async function main(): Promise<void> {
  if (unknownArguments.length > 0) {
    throw new Error(`Argumente necunoscute: ${unknownArguments.join(', ')}.`);
  }
  validateOwnerCategoryQuestionPack();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL nu este configurat.');

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  try {
    const codes = [
      ...new Set(
        OWNER_CATEGORY_QUESTION_PACK.map((question) => question.categoryCode),
      ),
    ];
    const categories = await prisma.category.findMany({
      where: { code: { in: codes } },
      select: { id: true, code: true },
    });
    const categoryIdByCode = new Map(
      categories.map((category) => [category.code, category.id]),
    );
    const missing = codes.filter((code) => !categoryIdByCode.has(code));
    if (missing.length > 0) {
      throw new Error(
        `Lipsesc categoriile: ${missing.join(', ')}. Rulează mai întâi migrarea și prisma:seed.`,
      );
    }

    const stored = await prisma.question.findMany({
      where: {
        id: { in: OWNER_CATEGORY_QUESTION_PACK.map((question) => question.id) },
      },
      select: {
        id: true,
        type: true,
        categoryId: true,
        difficulty: true,
        text: true,
        options: true,
        correctAnswer: true,
        explanation: true,
        verificationSource: true,
        source: true,
        status: true,
        language: true,
      },
    });
    const storedById = new Map(
      stored.map((question) => [question.id, question]),
    );
    const plan = { created: 0, updated: 0, unchanged: 0, protected: 0 };
    for (const question of OWNER_CATEGORY_QUESTION_PACK) {
      const existing = storedById.get(question.id);
      if (!existing) plan.created += 1;
      else if (
        existing.source !== QuestionSource.AI ||
        existing.status !== QuestionStatus.PENDING
      ) {
        plan.protected += 1;
      } else if (
        existing.type === QuestionType.MULTIPLE_CHOICE &&
        existing.categoryId === categoryIdByCode.get(question.categoryCode) &&
        existing.difficulty === question.difficulty &&
        existing.text === question.text &&
        JSON.stringify(existing.options) === JSON.stringify(question.options) &&
        existing.correctAnswer === question.correctAnswer &&
        existing.explanation === question.explanation &&
        existing.verificationSource === null &&
        existing.language === 'ro'
      ) {
        plan.unchanged += 1;
      } else {
        plan.updated += 1;
      }
    }

    if (!applyPending) {
      process.stdout.write(
        `${JSON.stringify({ mode: 'dry-run', total: OWNER_CATEGORY_QUESTION_PACK.length, ...plan, status: 'PENDING' })}\n`,
      );
      return;
    }

    await prisma.$transaction(async (transaction) => {
      for (const question of OWNER_CATEGORY_QUESTION_PACK) {
        const existing = storedById.get(question.id);
        if (
          existing &&
          (existing.source !== QuestionSource.AI ||
            existing.status !== QuestionStatus.PENDING)
        ) {
          continue;
        }
        const data = {
          type: QuestionType.MULTIPLE_CHOICE,
          categoryId: categoryIdByCode.get(question.categoryCode)!,
          difficulty: question.difficulty,
          text: question.text,
          options: [...question.options] as Prisma.InputJsonValue,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          verificationSource: null,
          source: QuestionSource.AI,
          status: QuestionStatus.PENDING,
          language: 'ro',
        };
        await transaction.question.upsert({
          where: { id: question.id },
          create: { id: question.id, ...data },
          update: data,
        });
      }
    });

    const verifiedCount = await prisma.question.count({
      where: {
        id: { in: OWNER_CATEGORY_QUESTION_PACK.map((question) => question.id) },
        source: QuestionSource.AI,
        status: QuestionStatus.PENDING,
      },
    });
    if (
      verifiedCount !==
      OWNER_CATEGORY_QUESTION_PACK.length - plan.protected
    ) {
      throw new Error(
        `Verificarea DB a găsit ${verifiedCount} întrebări AI/PENDING, dar erau așteptate ${OWNER_CATEGORY_QUESTION_PACK.length - plan.protected}.`,
      );
    }
    process.stdout.write(
      `${JSON.stringify({ mode: 'applied', total: OWNER_CATEGORY_QUESTION_PACK.length, ...plan, verifiedPending: verifiedCount })}\n`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main();
