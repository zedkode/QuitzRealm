import { Injectable } from "@nestjs/common";
import {
  Prisma,
  QuestionSource,
  QuestionStatus,
  QuestionType,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  GeneratedQuestion,
  GenerationResult,
  ValidatedGenerateQuestionsJob,
} from "./question-generation.types";
import { jaccardSimilarity } from "./text-similarity";

const DUPLICATE_THRESHOLD = 0.85;

@Injectable()
export class QuestionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getCategoryPath(categoryId: string): Promise<string> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: {
        name: true,
        parent: { select: { name: true } },
      },
    });
    if (!category) {
      throw new Error(`Categoria ${categoryId} nu există.`);
    }
    return category.parent
      ? `${category.parent.name} / ${category.name}`
      : category.name;
  }

  async insertPendingBatch(
    job: ValidatedGenerateQuestionsJob,
    questions: GeneratedQuestion[],
  ): Promise<GenerationResult> {
    return this.prisma.$transaction(
      async (transaction) => {
        await transaction.$queryRaw`
          SELECT pg_advisory_xact_lock(hashtext(${job.categoryId}))::text AS "lockResult"
        `;
        const language = await transaction.language.findUnique({
          where: { isoCode: job.language.toLowerCase() },
          select: { id: true, active: true },
        });
        if (!language?.active) {
          throw new Error(`Limba ${job.language} nu este activă.`);
        }
        const existing = await transaction.question.findMany({
          where: {
            categoryId: job.categoryId,
            languageId: language.id,
          },
          select: { text: true },
        });
        const accepted: GeneratedQuestion[] = [];
        for (const question of questions) {
          const comparisonTexts = [
            ...existing.map((item) => item.text),
            ...accepted.map((item) => item.text),
          ];
          const isDuplicate = comparisonTexts.some(
            (text) =>
              jaccardSimilarity(text, question.text) >= DUPLICATE_THRESHOLD,
          );
          if (!isDuplicate) {
            accepted.push(question);
          }
        }

        if (accepted.length > 0) {
          await transaction.question.createMany({
            data: accepted.map((question) => ({
              type:
                question.type === "multiple_choice"
                  ? QuestionType.MULTIPLE_CHOICE
                  : QuestionType.NUMERIC,
              categoryId: job.categoryId,
              difficulty: job.difficulty,
              text: question.text,
              options:
                question.options === null ? Prisma.JsonNull : question.options,
              correctAnswer: question.correctAnswer,
              explanation: question.explanation,
              verificationSource: question.verificationSource,
              source: QuestionSource.AI,
              status: QuestionStatus.PENDING,
              languageId: language.id,
            })),
          });
        }

        return {
          requested: questions.length,
          inserted: accepted.length,
          duplicates: questions.length - accepted.length,
          rejected: 0,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
