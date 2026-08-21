import { ConflictException } from '@nestjs/common';
import { QuestionStatus } from '@prisma/client';
import { QuestionPoolService } from './question-pool.service';

describe('QuestionPoolService', () => {
  const languages = {
    ro: {
      id: 'language-ro',
      isoCode: 'ro',
      isGlobalPool: false,
      active: true,
    },
    en: {
      id: 'language-en',
      isoCode: 'en',
      isGlobalPool: true,
      active: true,
    },
  };
  const general = {
    id: 'category-general',
    code: 'science',
    countryCode: null,
  };
  const history = {
    id: 'category-history',
    code: 'history',
    countryCode: null,
  };
  const regional = {
    id: 'category-ro',
    code: 'country-specific-ro',
    countryCode: 'RO',
  };
  const globalCulture = {
    id: 'category-global-culture',
    code: 'international-culture',
    countryCode: null,
  };
  const prisma = {
    language: { findUnique: jest.fn() },
    country: { findUnique: jest.fn() },
    category: { findMany: jest.fn() },
    question: { groupBy: jest.fn() },
  };

  function createService(minimum = '2') {
    const config = { get: jest.fn().mockReturnValue(minimum) };
    return new QuestionPoolService(prisma as never, config as never);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.language.findUnique.mockImplementation(
      ({ where }: { where: { isoCode: 'ro' | 'en' } }) =>
        Promise.resolve(languages[where.isoCode] ?? null),
    );
    prisma.country.findUnique.mockResolvedValue({ active: true });
  });

  it('fails startup for an invalid configured threshold', () => {
    for (const invalid of ['0', '-1', '1.5', 'word']) {
      expect(() => createService(invalid)).toThrow(
        'QUESTION_BANK_MIN_APPROVED_PER_CATEGORY',
      );
    }
  });

  it('accepts the threshold boundary and counts only APPROVED questions', async () => {
    const service = createService('2');
    prisma.category.findMany.mockResolvedValue([general, regional]);
    prisma.question.groupBy.mockResolvedValue([
      { categoryId: general.id, _count: { _all: 2 } },
      { categoryId: regional.id, _count: { _all: 3 } },
    ]);

    const result = await service.resolve({
      requestedLanguageIsoCode: 'ro',
      countryCode: 'RO',
      difficulty: 4,
      limit: 20,
    });

    expect(result.bank).toMatchObject({
      fallbackApplied: false,
      requestedLanguageIsoCode: 'ro',
      resolvedLanguageIsoCode: 'ro',
      requestedCountryCode: 'RO',
      resolvedCountryCode: 'RO',
      minimumApprovedPerCategory: 2,
    });
    expect(prisma.question.groupBy).toHaveBeenCalledWith({
      by: ['categoryId'],
      where: {
        status: QuestionStatus.APPROVED,
        languageId: languages.ro.id,
        categoryId: { in: [general.id, regional.id] },
        difficulty: 4,
      },
      _count: { _all: true },
    });
    expect(result.where).toEqual({
      status: QuestionStatus.APPROVED,
      languageId: languages.ro.id,
      categoryId: { in: [general.id, regional.id] },
      difficulty: 4,
    });
  });

  it('keeps exact explicit filters and falls back explicitly to global English', async () => {
    const service = createService('2');
    prisma.category.findMany.mockResolvedValueOnce([general, history]);
    prisma.question.groupBy
      .mockResolvedValueOnce([{ categoryId: general.id, _count: { _all: 2 } }])
      .mockResolvedValueOnce([
        { categoryId: general.id, _count: { _all: 2 } },
        { categoryId: history.id, _count: { _all: 2 } },
      ]);

    const result = await service.resolve({
      requestedLanguageIsoCode: 'ro',
      countryCode: 'RO',
      categoryCodes: ['science', 'history'],
      difficulty: 3,
      limit: 20,
    });

    expect(result.bank).toEqual({
      requestedLanguageIsoCode: 'ro',
      resolvedLanguageIsoCode: 'en',
      requestedCountryCode: 'RO',
      resolvedCountryCode: null,
      fallbackApplied: true,
      messageKey: 'question_bank.fallback.global',
      params: {
        requestedLanguage: 'ro',
        resolvedLanguage: 'en',
        requestedCountry: 'RO',
        minimumApprovedPerCategory: 2,
      },
      minimumApprovedPerCategory: 2,
      requestedCategoryCodes: ['science', 'history'],
      resolvedCategoryCodes: ['science', 'history'],
    });
    expect(result.where).toMatchObject({
      status: QuestionStatus.APPROVED,
      languageId: languages.en.id,
      categoryId: { in: [general.id, history.id] },
      difficulty: 3,
    });
  });

  it('maps a requested country-specific category to international culture on fallback', async () => {
    const service = createService('1');
    prisma.category.findMany
      .mockResolvedValueOnce([regional])
      .mockResolvedValueOnce([globalCulture]);
    prisma.question.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { categoryId: globalCulture.id, _count: { _all: 1 } },
      ]);

    const result = await service.resolve({
      requestedLanguageIsoCode: 'ro',
      countryCode: 'RO',
      categoryCodes: ['country-specific-ro'],
      limit: 20,
    });

    expect(result.bank.fallbackApplied).toBe(true);
    expect(result.bank.requestedCategoryCodes).toEqual(['country-specific-ro']);
    expect(result.bank.resolvedCategoryCodes).toEqual([
      'international-culture',
    ]);
    expect(result.where).toMatchObject({
      languageId: languages.en.id,
      categoryId: { in: [globalCulture.id] },
    });
  });

  it('returns a structured error when native and fallback pools are below threshold', async () => {
    const service = createService('2');
    prisma.category.findMany.mockResolvedValueOnce([general]);
    prisma.question.groupBy
      .mockResolvedValueOnce([{ categoryId: general.id, _count: { _all: 1 } }])
      .mockResolvedValueOnce([]);

    await expect(
      service.resolve({
        requestedLanguageIsoCode: 'ro',
        countryCode: 'RO',
        categoryCodes: ['science'],
        difficulty: 5,
        limit: 20,
      }),
    ).rejects.toMatchObject({
      response: {
        code: 'QUESTION_BANK_UNAVAILABLE',
        messageKey: 'error.question_bank.unavailable',
        params: {
          requestedLanguage: 'ro',
          requestedCountry: 'RO',
          fallbackLanguage: 'en',
          minimumApprovedPerCategory: 2,
          categoryCodes: ['science'],
          difficulty: 5,
        },
      },
    });
  });

  it('rejects an explicit category belonging to another country', async () => {
    const service = createService('1');
    prisma.category.findMany.mockResolvedValue([
      { id: 'category-de', code: 'country-specific-de', countryCode: 'DE' },
    ]);

    await expect(
      service.resolve({
        requestedLanguageIsoCode: 'ro',
        countryCode: 'RO',
        categoryCodes: ['country-specific-de'],
        limit: 20,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.question.groupBy).not.toHaveBeenCalled();
  });

  it('uses only global categories when a public request omits countryCode', async () => {
    const service = createService('1');
    prisma.category.findMany.mockResolvedValue([general]);
    prisma.question.groupBy.mockResolvedValue([
      { categoryId: general.id, _count: { _all: 1 } },
    ]);

    await service.resolve({ language: 'ro', limit: 20 });

    expect(prisma.category.findMany).toHaveBeenCalledWith({
      where: { countryCode: null },
      select: { id: true, code: true, countryCode: true },
    });
  });
});
