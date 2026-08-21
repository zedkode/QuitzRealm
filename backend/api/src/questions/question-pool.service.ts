import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, QuestionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FALLBACK_LANGUAGE_ISO_CODE } from '../translations/translation-catalog.seed';
import { normalizeLanguageCode } from '../translations/translations.service';
import { ListQuestionsDto } from './dto/list-questions.dto';
import {
  questionBadRequest,
  questionBankUnavailable,
  questionConflict,
  questionNotFound,
} from './questions.errors';

const DEFAULT_MINIMUM_APPROVED_PER_CATEGORY = 1;
const GLOBAL_CATEGORY_CODE = 'international-culture';

interface PoolLanguage {
  readonly id: string;
  readonly isoCode: string;
  readonly isGlobalPool: boolean;
  readonly active: boolean;
}

interface PoolCategory {
  readonly id: string;
  readonly code: string | null;
  readonly countryCode: string | null;
}

export interface QuestionBankMetadata {
  readonly requestedLanguageIsoCode: string;
  readonly resolvedLanguageIsoCode: string;
  readonly requestedCountryCode: string | null;
  readonly resolvedCountryCode: string | null;
  readonly fallbackApplied: boolean;
  readonly messageKey: string | null;
  readonly params: Readonly<
    Record<string, string | number | null | readonly string[]>
  >;
  readonly minimumApprovedPerCategory: number;
  readonly requestedCategoryCodes: readonly string[];
  readonly resolvedCategoryCodes: readonly string[];
}

export interface ResolvedQuestionPool {
  readonly where: Prisma.QuestionWhereInput;
  readonly bank: QuestionBankMetadata;
}

interface EligiblePool {
  readonly where: Prisma.QuestionWhereInput;
  readonly categoryCodes: readonly string[];
}

@Injectable()
export class QuestionPoolService {
  readonly minimumApprovedPerCategory: number;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.minimumApprovedPerCategory = this.parseMinimumApproved(
      config.get<string>('QUESTION_BANK_MIN_APPROVED_PER_CATEGORY'),
    );
  }

  requestedLanguageIsoCode(query: ListQuestionsDto): string {
    const supplied = [
      query.requestedLanguageIsoCode,
      query.languageIsoCode,
      query.language,
    ].filter((value): value is string => value !== undefined);
    const distinct = Array.from(
      new Set(supplied.map((value) => value.trim().toLowerCase())),
    );
    if (distinct.length > 1) {
      throw questionBadRequest(
        'QUESTION_LANGUAGE_FILTER_CONFLICT',
        'error.question_bank.language_filter_conflict',
        { languages: distinct },
      );
    }
    return normalizeLanguageCode(distinct[0] ?? 'ro');
  }

  async requireActiveLanguage(languageIsoCode: string): Promise<PoolLanguage> {
    const normalized = normalizeLanguageCode(languageIsoCode);
    const language = await this.prisma.language.findUnique({
      where: { isoCode: normalized },
      select: {
        id: true,
        isoCode: true,
        isGlobalPool: true,
        active: true,
      },
    });
    if (!language?.active) {
      throw questionNotFound(
        'LANGUAGE_NOT_SUPPORTED',
        'error.language.not_supported',
        { language: normalized },
      );
    }
    return language;
  }

  async resolve(query: ListQuestionsDto): Promise<ResolvedQuestionPool> {
    const requestedLanguageIsoCode = this.requestedLanguageIsoCode(query);
    const requestedLanguage = await this.requireActiveLanguage(
      requestedLanguageIsoCode,
    );
    const requestedCountryCode = query.countryCode ?? null;
    const supportedCountryCode =
      await this.requireSupportedCountry(requestedCountryCode);
    const resolvedNativeCountryCode = requestedLanguage.isGlobalPool
      ? null
      : supportedCountryCode;
    const explicitCategories = await this.loadExplicitCategories(query);
    this.assertCategoryScope(
      explicitCategories,
      requestedLanguage,
      resolvedNativeCountryCode,
    );

    const native = await this.findEligiblePool(
      requestedLanguage,
      resolvedNativeCountryCode,
      explicitCategories,
      query.difficulty,
    );
    const requestedCategoryCodes = this.categoryLabels(explicitCategories);
    if (native) {
      return {
        where: native.where,
        bank: {
          requestedLanguageIsoCode,
          resolvedLanguageIsoCode: requestedLanguage.isoCode,
          requestedCountryCode,
          resolvedCountryCode: resolvedNativeCountryCode,
          fallbackApplied: false,
          messageKey: null,
          params: {},
          minimumApprovedPerCategory: this.minimumApprovedPerCategory,
          requestedCategoryCodes,
          resolvedCategoryCodes: native.categoryCodes,
        },
      };
    }

    const fallbackLanguage = await this.loadFallbackLanguage();
    const fallbackCategories =
      await this.mapCategoriesToGlobal(explicitCategories);
    const fallback = fallbackLanguage
      ? await this.findEligiblePool(
          fallbackLanguage,
          null,
          fallbackCategories,
          query.difficulty,
        )
      : null;
    if (fallback) {
      return {
        where: fallback.where,
        bank: {
          requestedLanguageIsoCode,
          resolvedLanguageIsoCode: fallbackLanguage!.isoCode,
          requestedCountryCode,
          resolvedCountryCode: null,
          fallbackApplied: true,
          messageKey: 'question_bank.fallback.global',
          params: {
            requestedLanguage: requestedLanguageIsoCode,
            resolvedLanguage: fallbackLanguage!.isoCode,
            requestedCountry: requestedCountryCode,
            minimumApprovedPerCategory: this.minimumApprovedPerCategory,
          },
          minimumApprovedPerCategory: this.minimumApprovedPerCategory,
          requestedCategoryCodes,
          resolvedCategoryCodes: fallback.categoryCodes,
        },
      };
    }

    throw questionBankUnavailable({
      requestedLanguage: requestedLanguageIsoCode,
      requestedCountry: requestedCountryCode,
      fallbackLanguage: FALLBACK_LANGUAGE_ISO_CODE,
      minimumApprovedPerCategory: this.minimumApprovedPerCategory,
      categoryCodes: requestedCategoryCodes,
      difficulty: query.difficulty ?? null,
    });
  }

  private parseMinimumApproved(value: string | undefined): number {
    if (value === undefined || value.length === 0) {
      return DEFAULT_MINIMUM_APPROVED_PER_CATEGORY;
    }
    if (!/^[1-9]\d*$/.test(value)) {
      throw new Error(
        'QUESTION_BANK_MIN_APPROVED_PER_CATEGORY must be a positive integer',
      );
    }
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed)) {
      throw new Error(
        'QUESTION_BANK_MIN_APPROVED_PER_CATEGORY must be a safe integer',
      );
    }
    return parsed;
  }

  private async requireSupportedCountry(
    countryCode: string | null,
  ): Promise<string | null> {
    if (!countryCode) return null;
    const country = await this.prisma.country.findUnique({
      where: { isoAlpha2: countryCode },
      select: { active: true },
    });
    if (!country?.active) {
      throw questionNotFound(
        'COUNTRY_NOT_SUPPORTED',
        'error.country.not_supported',
        { countryCode },
      );
    }
    return countryCode;
  }

  private async loadExplicitCategories(
    query: ListQuestionsDto,
  ): Promise<readonly PoolCategory[] | null> {
    const codes = Array.from(new Set(query.categoryCodes ?? []));
    if (query.categoryId && codes.length > 0) {
      throw questionBadRequest(
        'QUESTION_CATEGORY_FILTER_CONFLICT',
        'error.question_bank.category_filter_conflict',
      );
    }
    if (!query.categoryId && codes.length === 0) return null;

    const categories = await this.prisma.category.findMany({
      where: query.categoryId
        ? { id: query.categoryId }
        : { code: { in: codes } },
      select: { id: true, code: true, countryCode: true },
    });
    if (query.categoryId && categories.length !== 1) {
      throw questionNotFound(
        'QUESTION_CATEGORY_NOT_FOUND',
        'error.question_bank.category_not_found',
        { categoryId: query.categoryId },
      );
    }
    if (codes.length > 0) {
      const found = new Set(categories.map((category) => category.code));
      const missing = codes.filter((code) => !found.has(code));
      if (missing.length > 0) {
        throw questionNotFound(
          'QUESTION_CATEGORY_NOT_FOUND',
          'error.question_bank.category_not_found',
          { categoryCodes: missing },
        );
      }
    }
    return categories;
  }

  private assertCategoryScope(
    categories: readonly PoolCategory[] | null,
    language: PoolLanguage,
    countryCode: string | null,
  ): void {
    if (!categories) return;
    const incompatible = categories.find(
      (category) =>
        category.countryCode !== null &&
        (language.isGlobalPool || category.countryCode !== countryCode),
    );
    if (incompatible) {
      throw questionConflict(
        'QUESTION_CATEGORY_REGION_MISMATCH',
        'error.question_bank.category_region_mismatch',
        {
          categoryCode: incompatible.code ?? incompatible.id,
          categoryCountryCode: incompatible.countryCode,
          requestedCountryCode: countryCode,
        },
      );
    }
  }

  private async loadFallbackLanguage(): Promise<PoolLanguage | null> {
    const language = await this.prisma.language.findUnique({
      where: { isoCode: FALLBACK_LANGUAGE_ISO_CODE },
      select: {
        id: true,
        isoCode: true,
        isGlobalPool: true,
        active: true,
      },
    });
    return language?.active && language.isGlobalPool ? language : null;
  }

  private async mapCategoriesToGlobal(
    categories: readonly PoolCategory[] | null,
  ): Promise<readonly PoolCategory[] | null> {
    if (!categories) return null;
    if (!categories.some((category) => category.countryCode !== null)) {
      return categories;
    }
    const globalRoot = await this.prisma.category.findMany({
      where: { code: GLOBAL_CATEGORY_CODE, countryCode: null },
      select: { id: true, code: true, countryCode: true },
    });
    if (globalRoot.length !== 1) return [];

    const mapped = categories.map((category) =>
      category.countryCode === null ? category : globalRoot[0],
    );
    return Array.from(
      new Map(mapped.map((category) => [category.id, category])).values(),
    );
  }

  private async findEligiblePool(
    language: PoolLanguage,
    countryCode: string | null,
    explicitCategories: readonly PoolCategory[] | null,
    difficulty: number | undefined,
  ): Promise<EligiblePool | null> {
    const categories =
      explicitCategories ??
      (await this.prisma.category.findMany({
        where:
          countryCode === null
            ? { countryCode: null }
            : {
                OR: [{ countryCode: null }, { countryCode }],
              },
        select: { id: true, code: true, countryCode: true },
      }));
    if (categories.length === 0) return null;

    const uniqueCategories = Array.from(
      new Map(categories.map((category) => [category.id, category])).values(),
    );
    const categoryIds = uniqueCategories.map((category) => category.id);
    const grouped = await this.prisma.question.groupBy({
      by: ['categoryId'],
      where: {
        status: QuestionStatus.APPROVED,
        languageId: language.id,
        categoryId: { in: categoryIds },
        difficulty,
      },
      _count: { _all: true },
    });
    const counts = new Map(
      grouped.map((row) => [row.categoryId, row._count._all]),
    );
    const eligible = uniqueCategories.filter(
      (category) =>
        (counts.get(category.id) ?? 0) >= this.minimumApprovedPerCategory,
    );
    if (
      eligible.length === 0 ||
      (explicitCategories !== null &&
        eligible.length !== uniqueCategories.length)
    ) {
      return null;
    }

    const eligibleIds = eligible.map((category) => category.id);
    return {
      where: {
        status: QuestionStatus.APPROVED,
        languageId: language.id,
        categoryId: { in: eligibleIds },
        difficulty,
      },
      categoryCodes: eligible.map((category) => category.code ?? category.id),
    };
  }

  private categoryLabels(
    categories: readonly PoolCategory[] | null,
  ): readonly string[] {
    return categories?.map((category) => category.code ?? category.id) ?? [];
  }
}
