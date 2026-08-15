import { Injectable } from "@nestjs/common";
import { z } from "zod";
import { GeneratedQuestion } from "./question-generation.types";
import { canonicalText } from "./text-similarity";

const commonFields = {
  text: z.string().trim().min(10).max(1000),
  correctAnswer: z.string().trim().min(1).max(500),
  explanation: z.string().trim().min(10).max(1000),
  verificationSource: z.string().trim().min(3).max(1000),
};

const multipleChoiceSchema = z
  .object({
    type: z.literal("multiple_choice"),
    ...commonFields,
    options: z.tuple([
      z.string().trim().min(1).max(500),
      z.string().trim().min(1).max(500),
      z.string().trim().min(1).max(500),
      z.string().trim().min(1).max(500),
    ]),
  })
  .strict()
  .superRefine((question, context) => {
    const normalizedOptions = question.options.map(canonicalText);
    if (new Set(normalizedOptions).size !== 4) {
      context.addIssue({
        code: "custom",
        path: ["options"],
        message: "Cele patru variante trebuie să fie distincte.",
      });
    }
    if (!question.options.includes(question.correctAnswer)) {
      context.addIssue({
        code: "custom",
        path: ["correctAnswer"],
        message: "Răspunsul corect trebuie să fie una dintre variante.",
      });
    }
  });

const numericSchema = z
  .object({
    type: z.literal("numeric"),
    ...commonFields,
    options: z.null(),
  })
  .strict()
  .superRefine((question, context) => {
    if (!Number.isFinite(Number(question.correctAnswer))) {
      context.addIssue({
        code: "custom",
        path: ["correctAnswer"],
        message: "Răspunsul numeric trebuie să fie un număr finit.",
      });
    }
  });

const batchSchema = z
  .object({
    questions: z
      .array(z.union([multipleChoiceSchema, numericSchema]))
      .min(1)
      .max(100),
  })
  .strict();

export class QuestionBatchValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = QuestionBatchValidationError.name;
  }
}

@Injectable()
export class QuestionBatchValidator {
  validate(raw: string, expectedQuantity: number): GeneratedQuestion[] {
    let decoded: unknown;
    try {
      decoded = JSON.parse(raw);
    } catch {
      throw new QuestionBatchValidationError(
        "Provider-ul AI nu a returnat JSON valid.",
      );
    }

    const result = batchSchema.safeParse(decoded);
    if (!result.success) {
      const details = result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      throw new QuestionBatchValidationError(
        `Lotul generat nu respectă schema: ${details}`,
      );
    }
    if (result.data.questions.length !== expectedQuantity) {
      throw new QuestionBatchValidationError(
        `Lotul conține ${result.data.questions.length} întrebări, dar au fost cerute ${expectedQuantity}.`,
      );
    }
    return result.data.questions;
  }
}
