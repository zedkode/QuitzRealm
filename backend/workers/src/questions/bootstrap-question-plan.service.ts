import { Injectable } from "@nestjs/common";
import { QuestionSource, QuestionStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  BootstrapLeafCategory,
  BootstrapQuestionPlan,
  BOOTSTRAP_QUESTION_TARGET,
  buildBootstrapQuestionPlan,
  questionBucketKey,
} from "./bootstrap-question-plan";

const BOOTSTRAP_ROOT_NAMES = [
  "Istorie",
  "Geografie",
  "Știință",
  "Sport",
  "Film și muzică",
  "Literatură",
  "Actualitate",
  "România",
] as const;

@Injectable()
export class BootstrapQuestionPlanService {
  constructor(private readonly prisma: PrismaService) {}

  async build(
    targetTotal = BOOTSTRAP_QUESTION_TARGET,
    language = "ro",
  ): Promise<BootstrapQuestionPlan> {
    const categories = await this.loadLeafCategories();
    const counts = await this.loadExistingCounts(categories, language);
    return buildBootstrapQuestionPlan(categories, counts, targetTotal);
  }

  private async loadLeafCategories(): Promise<BootstrapLeafCategory[]> {
    const roots = await this.prisma.category.findMany({
      where: { parentId: null, name: { in: [...BOOTSTRAP_ROOT_NAMES] } },
      select: {
        name: true,
        children: { select: { id: true, name: true } },
      },
    });
    const categories: BootstrapLeafCategory[] = [];
    for (const expectedName of BOOTSTRAP_ROOT_NAMES) {
      const matches = roots.filter((root) => root.name === expectedName);
      if (matches.length !== 1) {
        throw new Error(
          `Taxonomy invalid: categoria-rădăcină ${expectedName} apare de ${matches.length} ori.`,
        );
      }
      if (matches[0].children.length === 0) {
        throw new Error(
          `Taxonomy invalid: categoria ${expectedName} nu are subcategorii.`,
        );
      }
      categories.push(
        ...matches[0].children.map((child) => ({
          ...child,
          parentName: expectedName,
        })),
      );
    }
    return categories;
  }

  private async loadExistingCounts(
    categories: readonly BootstrapLeafCategory[],
    language: string,
  ): Promise<Map<string, number>> {
    const grouped = await this.prisma.question.groupBy({
      by: ["categoryId", "difficulty"],
      where: {
        categoryId: { in: categories.map((category) => category.id) },
        language,
        source: QuestionSource.AI,
        status: { in: [QuestionStatus.PENDING, QuestionStatus.APPROVED] },
      },
      _count: { _all: true },
    });
    return new Map(
      grouped.map((entry) => [
        questionBucketKey(entry.categoryId, entry.difficulty),
        entry._count._all,
      ]),
    );
  }
}
