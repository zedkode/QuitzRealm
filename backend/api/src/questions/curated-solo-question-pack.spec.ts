import { QuestionType } from '@prisma/client';
import {
  CURATED_SOLO_QUESTION_PACK,
  CuratedSoloQuestion,
  validateCuratedSoloQuestionPack,
} from './curated-solo-question-pack';

const mutablePack = (): CuratedSoloQuestion[] =>
  CURATED_SOLO_QUESTION_PACK.map((question) => ({
    ...question,
    options: question.options ? [...question.options] : null,
  }));

describe('curated solo question pack', () => {
  it('contains 14 valid Romanian questions with both supported types', () => {
    expect(() =>
      validateCuratedSoloQuestionPack(CURATED_SOLO_QUESTION_PACK),
    ).not.toThrow();
    expect(CURATED_SOLO_QUESTION_PACK).toHaveLength(14);
    expect(
      CURATED_SOLO_QUESTION_PACK.some(
        (question) => question.type === QuestionType.MULTIPLE_CHOICE,
      ),
    ).toBe(true);
    expect(
      CURATED_SOLO_QUESTION_PACK.some(
        (question) => question.type === QuestionType.NUMERIC,
      ),
    ).toBe(true);
  });

  it('rejects a malformed multiple-choice question', () => {
    const questions = mutablePack();
    questions[1] = {
      ...questions[1],
      options: ['Mercur', 'Mercur', 'Pământ', 'Marte'],
    };

    expect(() => validateCuratedSoloQuestionPack(questions)).toThrow(
      /Variante invalide sau duplicate/,
    );
  });

  it('rejects near-duplicate texts inside the same category', () => {
    const questions = mutablePack();
    questions[2] = {
      ...questions[2],
      text: questions[1].text,
    };

    expect(() => validateCuratedSoloQuestionPack(questions)).toThrow(
      /Întrebări prea similare/,
    );
  });

  it('rejects a source outside the official allowlist', () => {
    const questions = mutablePack();
    questions[0] = {
      ...questions[0],
      verificationSource: 'https://example.com/not-an-official-source',
    };

    expect(() => validateCuratedSoloQuestionPack(questions)).toThrow(
      /Sursă neaprobată/,
    );
  });
});
