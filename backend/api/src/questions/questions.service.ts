import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

const publicQuestionSelect = {
  id: true,
  type: true,
  categoryId: true,
  category: {
    select: {
      name: true,
      icon: true,
    },
  },
  difficulty: true,
  text: true,
  options: true,
  language: true,
} satisfies Prisma.QuestionSelect;

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  listApproved(query: ListQuestionsDto) {
    return this.prisma.question.findMany({
      where: {
        status: QuestionStatus.APPROVED,
        categoryId: query.categoryId,
        difficulty: query.difficulty,
        language: query.language ?? 'ro',
      },
      select: publicQuestionSelect,
      take: query.limit,
      orderBy: [{ timesAsked: 'asc' }, { createdAt: 'desc' }],
    });
  }

  getApproved(id: string) {
    return this.prisma.question.findFirstOrThrow({
      where: { id, status: QuestionStatus.APPROVED },
      select: publicQuestionSelect,
    });
  }

  async getInternalRandom(query: ListQuestionsDto) {
    const where: Prisma.QuestionWhereInput = {
      status: QuestionStatus.APPROVED,
      categoryId: query.categoryId,
      difficulty: query.difficulty,
      language: query.language ?? 'ro',
    };
    const count = await this.prisma.question.count({ where });
    if (count === 0) {
      throw new NotFoundException(
        'Nu există întrebări aprobate pentru filtrele cerute.',
      );
    }
    return this.prisma.question.findFirst({
      where,
      skip: Math.floor(Math.random() * count),
      select: {
        ...publicQuestionSelect,
        correctAnswer: true,
      },
    });
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
      throw new NotFoundException('Întrebarea aprobată nu a fost găsită.');
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
    await this.rejectNearDuplicate(dto.categoryId, dto.text);
    return this.prisma.question.create({
      data: {
        ...dto,
        options: dto.options,
        source: QuestionSource.COMMUNITY,
        status: QuestionStatus.PENDING,
        createdById: userId,
      },
    });
  }

  moderate(id: string, dto: ModerateQuestionDto) {
    if (dto.status === QuestionStatus.PENDING) {
      throw new BadRequestException(
        'Moderarea trebuie să producă o stare finală.',
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
        throw new BadRequestException(
          'Răspunsul corect trebuie să existe între cele patru variante.',
        );
      }
    } else if (dto.options) {
      throw new BadRequestException(
        'Întrebările numerice nu acceptă variante.',
      );
    } else if (!Number.isFinite(Number(dto.correctAnswer))) {
      throw new BadRequestException(
        'Răspunsul numeric trebuie să fie un număr finit.',
      );
    }
  }

  private answersMatch(
    type: QuestionType,
    submitted: string,
    expected: string,
  ): boolean {
    if (submitted.trim().length === 0) {
      return false;
    }

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
    text: string,
  ): Promise<void> {
    const candidates = await this.prisma.question.findMany({
      where: { categoryId },
      select: { text: true },
    });
    const incoming = this.tokens(text);
    const duplicate = candidates.some(
      (candidate) =>
        this.jaccard(incoming, this.tokens(candidate.text)) >= 0.85,
    );
    if (duplicate) {
      throw new ConflictException(
        'Întrebarea este prea similară cu una existentă.',
      );
    }
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
