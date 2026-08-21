import { BadGatewayException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import {
  ApiClientService,
  QuestionBankApiError,
} from './api-client.service';

const selection = {
  question: {
    id: '11111111-1111-4111-8111-111111111111',
    type: 'MULTIPLE_CHOICE',
    categoryId: '22222222-2222-4222-8222-222222222222',
    difficulty: 2,
    text: 'Question?',
    options: ['1', '2', '3', '4'],
    correctAnswer: '4',
    languageIsoCode: 'ro',
  },
  bank: {
    requestedLanguageIsoCode: 'ro',
    resolvedLanguageIsoCode: 'ro',
    requestedCountryCode: 'RO',
    resolvedCountryCode: 'RO',
    fallbackApplied: false,
    messageKey: null,
    params: {},
    minimumApprovedPerCategory: 20,
    requestedCategoryCodes: ['history', 'geography'],
    resolvedCategoryCodes: ['history', 'geography'],
  },
};

function makeService(): ApiClientService {
  return new ApiClientService({
    getOrThrow: <T>(key: string) =>
      (key === 'API_BASE_URL'
        ? 'http://api.internal/'
        : 'internal-key') as T,
  } as ConfigService);
}

describe('ApiClientService question bank contract', () => {
  afterEach(() => jest.restoreAllMocks());

  it('sends the account locale and filters without a hardcoded language', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify(selection), { status: 200 }),
      );

    await expect(
      makeService().getRandomQuestion({
        requestedLanguageIsoCode: 'ro',
        countryCode: 'RO',
        categoryCodes: ['history', 'geography'],
        difficulty: 2,
      }),
    ).resolves.toEqual(selection);

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(
      'http://api.internal/questions/internal/random?' +
        'requestedLanguageIsoCode=ro&countryCode=RO&' +
        'categoryCodes=history%2Cgeography&difficulty=2',
    );
    expect(String(url)).not.toContain('language=ro');
  });

  it('accepts explicit global fallback metadata', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          ...selection,
          bank: {
            ...selection.bank,
            resolvedLanguageIsoCode: 'en',
            resolvedCountryCode: null,
            fallbackApplied: true,
            messageKey: 'question_bank.fallback.global',
            params: { requestedLanguageIsoCode: 'ro' },
          },
        }),
        { status: 200 },
      ),
    );

    await expect(
      makeService().getRandomQuestion({
        requestedLanguageIsoCode: 'ro',
        countryCode: 'RO',
      }),
    ).resolves.toMatchObject({
      bank: {
        fallbackApplied: true,
        resolvedCountryCode: null,
        messageKey: 'question_bank.fallback.global',
      },
    });
  });

  it('fails closed when bank metadata is incomplete', async () => {
    const invalid = {
      ...selection,
      bank: { ...selection.bank, resolvedLanguageIsoCode: undefined },
    };
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify(invalid), { status: 200 }),
      );

    await expect(
      makeService().getRandomQuestion({
        requestedLanguageIsoCode: 'ro',
        countryCode: 'RO',
      }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('preserves a localized question-bank refusal from the API', async () => {
    const payload = {
      code: 'QUESTION_BANK_UNAVAILABLE',
      messageKey: 'error.question_bank.unavailable',
      params: {
        requestedLanguage: 'ro',
        categoryCodes: ['history'],
      },
    };
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify(payload), { status: 503 }),
      );

    const error = await makeService()
      .getRandomQuestion({
        requestedLanguageIsoCode: 'ro',
        countryCode: 'RO',
      })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(QuestionBankApiError);
    expect(error).toMatchObject({ status: 503, payload });
  });
});
