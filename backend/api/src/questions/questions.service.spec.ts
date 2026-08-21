import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { QuestionSource, QuestionStatus, QuestionType } from '@prisma/client';
import { QuestionsService } from './questions.service';

describe('QuestionsService', () => {
  const prisma = {
    question: {
      count: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };
  const questionPool = {
    minimumApprovedPerCategory: 1,
    requestedLanguageIsoCode: jest.fn().mockReturnValue('ro'),
    requireActiveLanguage: jest.fn(),
    resolve: jest.fn(),
  };
  const service = new QuestionsService(prisma as never, questionPool as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.question.update.mockResolvedValue({});
    questionPool.requestedLanguageIsoCode.mockReturnValue('ro');
    questionPool.requireActiveLanguage.mockResolvedValue({
      id: 'language-ro',
      isoCode: 'ro',
      isGlobalPool: false,
      active: true,
    });
  });

  it('validates a multiple-choice answer on the server', async () => {
    prisma.question.findFirst.mockResolvedValue({
      type: QuestionType.MULTIPLE_CHOICE,
      correctAnswer: 'Bucuresti',
      explanation: 'Bucuresti is the capital of Romania.',
    });

    await expect(
      service.submitAnswer('question-id', 'Bucuresti'),
    ).resolves.toEqual({
      isCorrect: true,
      correctAnswer: 'Bucuresti',
      explanation: 'Bucuresti is the capital of Romania.',
    });
    expect(prisma.question.findFirst).toHaveBeenCalledWith({
      where: { id: 'question-id', status: QuestionStatus.APPROVED },
      select: { type: true, correctAnswer: true, explanation: true },
    });
    expect(prisma.question.update).toHaveBeenCalledWith({
      where: { id: 'question-id' },
      data: {
        timesAsked: { increment: 1 },
        timesCorrect: { increment: 1 },
      },
    });
  });

  it('normalizes decimal separators for numeric answers', async () => {
    prisma.question.findFirst.mockResolvedValue({
      type: QuestionType.NUMERIC,
      correctAnswer: '3.14',
      explanation: null,
    });

    await expect(
      service.submitAnswer('question-id', '3,14'),
    ).resolves.toMatchObject({ isCorrect: true });
  });

  it('never treats an empty timeout answer as numeric zero', async () => {
    prisma.question.findFirst.mockResolvedValue({
      type: QuestionType.NUMERIC,
      correctAnswer: '0',
      explanation: null,
    });

    await expect(
      service.submitAnswer('question-id', ''),
    ).resolves.toMatchObject({
      isCorrect: false,
      correctAnswer: '0',
    });
    expect(prisma.question.update).toHaveBeenCalledWith({
      where: { id: 'question-id' },
      data: { timesAsked: { increment: 1 } },
    });
  });

  it('records an incorrect answer without incrementing timesCorrect', async () => {
    prisma.question.findFirst.mockResolvedValue({
      type: QuestionType.MULTIPLE_CHOICE,
      correctAnswer: 'Correct',
      explanation: null,
    });

    await expect(
      service.submitAnswer('question-id', 'Wrong'),
    ).resolves.toMatchObject({
      isCorrect: false,
      correctAnswer: 'Correct',
    });
    expect(prisma.question.update).toHaveBeenCalledWith({
      where: { id: 'question-id' },
      data: { timesAsked: { increment: 1 } },
    });
  });

  it('returns a localized not-found error outside approved rotation', async () => {
    prisma.question.findFirst.mockResolvedValue(null);

    await expect(
      service.submitAnswer('missing', 'answer'),
    ).rejects.toMatchObject({
      response: {
        code: 'QUESTION_NOT_FOUND',
        messageKey: 'error.question.not_found',
        params: { questionId: 'missing' },
      },
    });
    expect(prisma.question.update).not.toHaveBeenCalled();
  });

  it('keeps GET /questions list-compatible and never selects the answer', async () => {
    prisma.question.findMany.mockResolvedValue([
      {
        id: 'question-1',
        type: QuestionType.MULTIPLE_CHOICE,
        categoryId: 'category-1',
        category: {
          nameKey: 'category.science.name',
          code: 'science',
          countryCode: null,
          icon: 'science',
        },
        difficulty: 2,
        text: 'A sufficiently long question?',
        options: ['A', 'B', 'C', 'D'],
        language: { isoCode: 'ro' },
      },
    ]);

    const result = await service.listApproved({ language: 'ro', limit: 20 });

    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toMatchObject({
      id: 'question-1',
      languageIsoCode: 'ro',
      category: {
        nameKey: 'category.science.name',
        code: 'science',
        countryCode: null,
      },
    });
    expect(result[0]).not.toHaveProperty('correctAnswer');
    expect(result[0].category).not.toHaveProperty('name');
    expect(prisma.question.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: QuestionStatus.APPROVED,
          languageId: 'language-ro',
          category: { countryCode: null },
        }),
        select: expect.not.objectContaining({ correctAnswer: true }),
      }),
    );
  });

  it('returns explicit bank metadata from the public pool endpoint', async () => {
    questionPool.resolve.mockResolvedValue({
      where: { languageId: 'language-en' },
      bank: {
        requestedLanguageIsoCode: 'ro',
        resolvedLanguageIsoCode: 'en',
        requestedCountryCode: 'RO',
        resolvedCountryCode: null,
        fallbackApplied: true,
      },
    });
    prisma.question.findMany.mockResolvedValue([]);

    await expect(
      service.getPool({
        requestedLanguageIsoCode: 'ro',
        countryCode: 'RO',
        limit: 20,
      }),
    ).resolves.toEqual({
      questions: [],
      bank: expect.objectContaining({
        fallbackApplied: true,
        resolvedLanguageIsoCode: 'en',
      }),
    });
  });

  it('requires the canonical requestedLanguageIsoCode on the internal route', async () => {
    await expect(
      service.getInternalRandom({ language: 'ro', limit: 20 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(questionPool.resolve).not.toHaveBeenCalled();
  });

  it('returns correctAnswer only in the guarded internal envelope', async () => {
    questionPool.resolve.mockResolvedValue({
      where: {
        status: QuestionStatus.APPROVED,
        languageId: 'language-en',
      },
      bank: {
        requestedLanguageIsoCode: 'ro',
        resolvedLanguageIsoCode: 'en',
        fallbackApplied: true,
      },
    });
    prisma.question.count.mockResolvedValue(1);
    prisma.question.findFirst.mockResolvedValue({
      id: 'question-1',
      type: QuestionType.MULTIPLE_CHOICE,
      categoryId: 'category-1',
      category: {
        nameKey: 'category.science.name',
        code: 'science',
        countryCode: null,
        icon: 'science',
      },
      difficulty: 2,
      text: 'A sufficiently long question?',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'A',
      language: { isoCode: 'en' },
    });

    const result = await service.getInternalRandom({
      requestedLanguageIsoCode: 'ro',
      countryCode: 'RO',
      limit: 20,
    });

    expect(result.question).toMatchObject({
      correctAnswer: 'A',
      languageIsoCode: 'en',
    });
    expect(result.bank.fallbackApplied).toBe(true);
  });

  it('deduplicates community submissions within the resolved language only', async () => {
    questionPool.requireActiveLanguage.mockResolvedValue({
      id: 'language-en',
      isoCode: 'en',
      isGlobalPool: true,
      active: true,
    });
    prisma.question.findMany.mockResolvedValue([]);
    prisma.question.create.mockResolvedValue({ id: 'created-question' });
    const dto = {
      type: QuestionType.MULTIPLE_CHOICE,
      categoryId: '1386b89f-51ba-4e08-9175-0f9cc617272f',
      difficulty: 2,
      text: 'Which answer is correct here?',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'A',
      languageIsoCode: 'en',
    };

    await service.createCommunity(dto, 'user-1');

    expect(prisma.question.findMany).toHaveBeenCalledWith({
      where: { categoryId: dto.categoryId, languageId: 'language-en' },
      select: { text: true },
    });
    expect(prisma.question.create).toHaveBeenCalledWith({
      data: {
        type: dto.type,
        categoryId: dto.categoryId,
        difficulty: dto.difficulty,
        text: dto.text,
        options: dto.options,
        correctAnswer: dto.correctAnswer,
        languageId: 'language-en',
        source: QuestionSource.COMMUNITY,
        status: QuestionStatus.PENDING,
        createdById: 'user-1',
      },
    });
  });

  it('rejects a near duplicate in the same category and language', async () => {
    prisma.question.findMany.mockResolvedValue([
      { text: 'Which answer is correct here?' },
    ]);

    await expect(
      service.createCommunity(
        {
          type: QuestionType.MULTIPLE_CHOICE,
          categoryId: '1386b89f-51ba-4e08-9175-0f9cc617272f',
          difficulty: 2,
          text: 'Which answer is correct here?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 'A',
          languageIsoCode: 'ro',
        },
        'user-1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.question.create).not.toHaveBeenCalled();
  });

  it('rejects an invalid answer shape before writing', async () => {
    await expect(
      service.createCommunity(
        {
          type: QuestionType.MULTIPLE_CHOICE,
          categoryId: '1386b89f-51ba-4e08-9175-0f9cc617272f',
          difficulty: 2,
          text: 'Which answer is correct here?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 'missing',
          languageIsoCode: 'ro',
        },
        'user-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(questionPool.requireActiveLanguage).not.toHaveBeenCalled();
  });

  it('uses a NotFoundException contract for approved GET misses', async () => {
    prisma.question.findFirst.mockResolvedValue(null);
    await expect(service.getApproved('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
