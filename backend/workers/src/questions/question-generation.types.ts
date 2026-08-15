import { z } from "zod";

export const generateQuestionsJobSchema = z
  .object({
    categoryId: z.string().uuid(),
    difficulty: z.number().int().min(1).max(5),
    quantity: z.number().int().min(1).max(100),
    language: z.string().trim().min(2).max(10).default("ro"),
  })
  .strict();

export type GenerateQuestionsJob = z.input<typeof generateQuestionsJobSchema>;
export type ValidatedGenerateQuestionsJob = z.output<
  typeof generateQuestionsJobSchema
>;

export interface GeneratedMultipleChoiceQuestion {
  type: "multiple_choice";
  text: string;
  options: [string, string, string, string];
  correctAnswer: string;
  explanation: string;
  verificationSource: string;
}

export interface GeneratedNumericQuestion {
  type: "numeric";
  text: string;
  options: null;
  correctAnswer: string;
  explanation: string;
  verificationSource: string;
}

export type GeneratedQuestion =
  GeneratedMultipleChoiceQuestion | GeneratedNumericQuestion;

export interface GenerationResult {
  requested: number;
  inserted: number;
  duplicates: number;
  rejected: number;
}
