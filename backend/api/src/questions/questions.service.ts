import { Injectable } from '@nestjs/common';
import {
  Prisma,
  QuestionSource,
  QuestionStatus,
  QuestionType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { ListQuestionsDto } from './dto/list-questions.dto';
import { ModerateQuestionDto } from './dto/moderate-question.dto';
import { QuestionPoolService } from './question-pool.service';
import {
  questionBadRequest,
  questionBankUnavailable,
  questionConflict,
  questionNotFound,
} from './questions.errors';

const publicQuestionSelect = {
  id: true,
  type: true,
  categoryId: true,
  category: {
    select: {
      nameKey: true,
      code: true,
      countryCode: true,
      icon: true,
    },
  },
  difficulty: true,
  text: true,
  options: true,
  language: { select: { isoCode: true } },
} satisfies Prisma.QuestionSelect;

const internalQuestionSelect = {
  ...publicQuestionSelect,
  correctAnswer: true,
} satisfies Prisma.QuestionSelect;

type SelectedQuestion = Prisma.QuestionGetPayload<{
  select: typeof publicQuestionSelect;
}>;

type SelectedInternalQuestion = Prisma.QuestionGetPayload<{
  select: typeof internalQuestionSelect;
}>;

@Injectable()
export class QuestionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly questionPool: QuestionPoolService,
  ) {}

  async listApproved(query: ListQuestionsDto) {
    const requestedLanguageIsoCode =
      this.questionPool.requestedLanguageIsoCode(query);
    const language = await this.questionPool.requireActiveLanguage(
      requestedLanguageIsoCode,
    );
    const categoryCodes = query.categoryCodes ?? [];
    const categoryFilter: Prisma.CategoryWhereInput = {
      ...(categoryCodes.length > 0 ? { code: { in: categoryCodes } } : {}),
      ...(language.isGlobalPool
        ? { countryCode: null }
        : query.countryCode
          ? {
              OR: [{ countryCode: null }, { countryCode: query.countryCode }],
            }
          : { countryCode: null }),
    };
    const questions = await this.prisma.question.findMany({
      where: {
        status: QuestionStatus.APPROVED,
        categoryId: query.categoryId,
        difficulty: query.difficulty,
        languageId: language.id,
        ...(Object.keys(categoryFilter).length > 0
          ? { category: categoryFilter }
          : {}),
      },
      select: publicQuestionSelect,
      take: query.limit,
      orderBy: [{ timesAsked: 'asc' }, { createdAt: 'desc' }],
    });
    return questions.map((question) => this.serializeQuestion(question));
  }

  async getPool(query: ListQuestionsDto) {
    const resolved = await this.questionPool.resolve(query);
    const questions = await this.prisma.question.findMany({
      where: resolved.where,
      select: publicQuestionSelect,
      take: query.limit,
      orderBy: [{ timesAsked: 'asc' }, { createdAt: 'desc' }],
    });
    return {
      questions: questions.map((question) => this.serializeQuestion(question)),
      bank: resolved.bank,
    };
  }

  async getApproved(id: string) {
    const question = await this.prisma.question.findFirst({
      where: { id, status: QuestionStatus.APPROVED },
      select: publicQuestionSelect,
    });
    if (!question) {
      throw questionNotFound('QUESTION_NOT_FOUND', 'error.question.not_found', {
        questionId: id,
      });
    }
    return this.serializeQuestion(question);
  }

  async getInternalRandom(query: ListQuestionsDto) {
    if (!query.requestedLanguageIsoCode) {
      throw questionBadRequest(
        'QUESTION_LANGUAGE_REQUIRED',
        'error.question_bank.language_required',
      );
    }
    const resolved = await this.questionPool.resolve(query);
    const count = await this.prisma.question.count({ where: resolved.where });
    if (count === 0) {
      throw this.emptyResolvedPool(
        query,
        resolved.bank.resolvedLanguageIsoCode,
      );
    }
    const question = await this.prisma.question.findFirst({
      where: resolved.where,
      skip: Math.floor(Math.random() * count),
      select: internalQuestionSelect,
    });
    if (!question) {
      throw this.emptyResolvedPool(
        query,
        resolved.bank.resolvedLanguageIsoCode,
      );
    }
    return {
      question: this.serializeInternalQuestion(question),
      bank: resolved.bank,
    };
  }

  async submitAnswer(id: string, answer: string) {
    const question = await this.prisma.question.findFirst({
      where: { id, status: QuestionStatus.APPROVED },
      select: {
        type: true,
        correctAnswer: true,
        explanation: true,
      },
    });
    if (!question) {
      throw questionNotFound('QUESTION_NOT_FOUND', 'error.question.not_found', {
        questionId: id,
      });
    }

    const isCorrect = this.answersMatch(
      question.type,
      answer,
      question.correctAnswer,
    );
    await this.prisma.question.update({
      where: { id },
      data: {
        timesAsked: { increment: 1 },
        ...(isCorrect ? { timesCorrect: { increment: 1 } } : {}),
      },
    });

    return {
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    };
  }

  async createCommunity(dto: CreateQuestionDto, userId: string) {
    this.validateAnswerShape(dto);
    const language = await this.questionPool.requireActiveLanguage(
      dto.languageIsoCode,
    );
    await this.rejectNearDuplicate(dto.categoryId, language.id, dto.text);
    return this.prisma.question.create({
      data: {
        type: dto.type,
        categoryId: dto.categoryId,
        difficulty: dto.difficulty,
        text: dto.text,
        options: dto.options,
        correctAnswer: dto.correctAnswer,
        languageId: language.id,
        source: QuestionSource.COMMUNITY,
        status: QuestionStatus.PENDING,
        createdById: userId,
      },
    });
  }

  moderate(id: string, dto: ModerateQuestionDto) {
    if (dto.status === QuestionStatus.PENDING) {
      throw questionBadRequest(
        'QUESTION_MODERATION_FINAL_STATUS_REQUIRED',
        'error.question.moderation_final_status_required',
      );
    }
    return this.prisma.question.update({
      where: { id },
      data: { status: dto.status, reviewedById: dto.reviewedById },
    });
  }

  remove(id: string) {
    return this.prisma.question.delete({ where: { id } });
  }

  private validateAnswerShape(dto: CreateQuestionDto): void {
    if (dto.type === QuestionType.MULTIPLE_CHOICE) {
      if (!dto.options || !dto.options.includes(dto.correctAnswer)) {
        throw questionBadRequest(
          'QUESTION_CORRECT_OPTION_REQUIRED',
          'error.question.correct_option_required',
        );
      }
    } else if (dto.options) {
      throw questionBadRequest(
        'QUESTION_NUMERIC_OPTIONS_NOT_ALLOWED',
        'error.question.numeric_options_not_allowed',
      );
    } else if (!Number.isFinite(Number(dto.correctAnswer))) {
      throw questionBadRequest(
        'QUESTION_NUMERIC_ANSWER_INVALID',
        'error.question.numeric_answer_invalid',
      );
    }
  }

  private answersMatch(
    type: QuestionType,
    submitted: string,
    expected: string,
  ): boolean {
    if (submitted.trim().length === 0) return false;

    if (type === QuestionType.NUMERIC) {
      const submittedNumber = Number(submitted.trim().replace(',', '.'));
      const expectedNumber = Number(expected.trim().replace(',', '.'));
      return (
        Number.isFinite(submittedNumber) &&
        Number.isFinite(expectedNumber) &&
        submittedNumber === expectedNumber
      );
    }

    return submitted.trim() === expected.trim();
  }

  private async rejectNearDuplicate(
    categoryId: string,
    languageId: string,
    text: string,
  ): Promise<void> {
    const candidates = await this.prisma.question.findMany({
      where: { categoryId, languageId },
      select: { text: true },
    });
    const incoming = this.tokens(text);
    const duplicate = candidates.some(
      (candidate) =>
        this.jaccard(incoming, this.tokens(candidate.text)) >= 0.85,
    );
    if (duplicate) {
      throw questionConflict(
        'QUESTION_NEAR_DUPLICATE',
        'error.question.near_duplicate',
        { categoryId },
      );
    }
  }

  private serializeQuestion(question: SelectedQuestion) {
    const { language, ...publicQuestion } = question;
    return { ...publicQuestion, languageIsoCode: language.isoCode };
  }

  private serializeInternalQuestion(question: SelectedInternalQuestion) {
    const { language, ...internalQuestion } = question;
    return { ...internalQuestion, languageIsoCode: language.isoCode };
  }

  private emptyResolvedPool(query: ListQuestionsDto, resolvedLanguage: string) {
    return questionBankUnavailable({
      requestedLanguage: this.questionPool.requestedLanguageIsoCode(query),
      requestedCountry: query.countryCode ?? null,
      fallbackLanguage: resolvedLanguage,
      minimumApprovedPerCategory: this.questionPool.minimumApprovedPerCategory,
      categoryCodes: query.categoryCodes ?? [],
      difficulty: query.difficulty ?? null,
    });
  }

  private tokens(value: string): Set<string> {
    return new Set(
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, ' ')
        .split(/\s+/)
        .filter(Boolean),
    );
  }

  private jaccard(left: Set<string>, right: Set<string>): number {
    const intersection = [...left].filter((token) => right.has(token)).length;
    const union = new Set([...left, ...right]).size;
    return union === 0 ? 1 : intersection / union;
  }
}
