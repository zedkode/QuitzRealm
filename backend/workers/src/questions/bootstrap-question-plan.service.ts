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

const BOOTSTRAP_ROOT_NAME_KEYS = [
  "category.history.name",
  "category.geography.name",
  "category.science.name",
  "category.sports.name",
  "category.node_10000000000040008000000000000005.name",
  "category.literature.name",
  "category.node_10000000000040008000000000000007.name",
  "category.country-specific-ro.name",
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
      where: {
        parentId: null,
        nameKey: { in: [...BOOTSTRAP_ROOT_NAME_KEYS] },
      },
      select: {
        nameKey: true,
        name: true,
        children: { select: { id: true, name: true } },
      },
    });
    const categories: BootstrapLeafCategory[] = [];
    for (const expectedNameKey of BOOTSTRAP_ROOT_NAME_KEYS) {
      const matches = roots.filter(
        (root) => root.nameKey === expectedNameKey,
      );
      if (matches.length !== 1) {
        throw new Error(
          `Taxonomy invalid: categoria-rădăcină ${expectedNameKey} apare de ${matches.length} ori.`,
        );
      }
      if (matches[0].children.length === 0) {
        throw new Error(
          `Taxonomy invalid: categoria ${expectedNameKey} nu are subcategorii.`,
        );
      }
      categories.push(
        ...matches[0].children.map((child) => ({
          ...child,
          parentName: matches[0].name,
        })),
      );
    }
    return categories;
  }

  private async loadExistingCounts(
    categories: readonly BootstrapLeafCategory[],
    language: string,
  ): Promise<Map<string, number>> {
    const storedLanguage = await this.prisma.language.findUnique({
      where: { isoCode: language.toLowerCase() },
      select: { id: true, active: true },
    });
    if (!storedLanguage?.active) {
      throw new Error(`Limba ${language} nu este activă.`);
    }
    const grouped = await this.prisma.question.groupBy({
      by: ["categoryId", "difficulty"],
      where: {
        categoryId: { in: categories.map((category) => category.id) },
        languageId: storedLanguage.id,
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
