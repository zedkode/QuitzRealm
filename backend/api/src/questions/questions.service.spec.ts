import { NotFoundException } from '@nestjs/common';
import { QuestionStatus, QuestionType } from '@prisma/client';
import { QuestionsService } from './questions.service';

describe('QuestionsService', () => {
  const prisma = {
    question: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };
  const service = new QuestionsService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.question.update.mockResolvedValue({});
  });

  it('validates a multiple-choice answer on the server', async () => {
    prisma.question.findFirst.mockResolvedValue({
      type: QuestionType.MULTIPLE_CHOICE,
      correctAnswer: 'București',
      explanation: 'București este capitala României.',
    });

    await expect(
      service.submitAnswer('question-id', 'București'),
    ).resolves.toEqual({
      isCorrect: true,
      correctAnswer: 'București',
      explanation: 'București este capitala României.',
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
    ).resolves.toMatchObject({
      isCorrect: true,
    });
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
      correctAnswer: 'Corect',
      explanation: null,
    });

    await expect(
      service.submitAnswer('question-id', 'Greșit'),
    ).resolves.toMatchObject({
      isCorrect: false,
      correctAnswer: 'Corect',
    });
    expect(prisma.question.update).toHaveBeenCalledWith({
      where: { id: 'question-id' },
      data: { timesAsked: { increment: 1 } },
    });
  });

  it('rejects answers for questions outside the approved rotation', async () => {
    prisma.question.findFirst.mockResolvedValue(null);

    await expect(
      service.submitAnswer('missing', 'answer'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.question.update).not.toHaveBeenCalled();
  });
});
