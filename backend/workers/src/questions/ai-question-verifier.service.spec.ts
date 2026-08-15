import { ConfigService } from "@nestjs/config";
import { AiQuestionVerifierService } from "./ai-question-verifier.service";
import { QuestionBatchValidationError } from "./question-batch.validator";
import { GeneratedQuestion } from "./question-generation.types";

const questions: GeneratedQuestion[] = [
  {
    type: "multiple_choice",
    text: "Care este unitatea structurală de bază a organismelor vii?",
    options: ["Celula", "Țesutul", "Organul", "Molecula"],
    correctAnswer: "Celula",
    explanation: "Celula este unitatea structurală de bază.",
    verificationSource: "OpenStax Biology 2e",
  },
  {
    type: "numeric",
    text: "Câte grade are suma unghiurilor unui triunghi?",
    options: null,
    correctAnswer: "180",
    explanation: "Suma unghiurilor interioare este 180 de grade.",
    verificationSource: "Teorema sumei unghiurilor unui triunghi",
  },
];

function responseFor(content: unknown, finishReason = "stop"): Response {
  return new Response(
    JSON.stringify({
      choices: [
        {
          message: { content: JSON.stringify(content) },
          finish_reason: finishReason,
        },
      ],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

describe("AiQuestionVerifierService", () => {
  afterEach(() => jest.restoreAllMocks());

  it("păstrează numai întrebările acceptate de verificator", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      responseFor({
        verdicts: [
          { index: 1, valid: true, issues: [] },
          { index: 2, valid: false, issues: ["Răspuns greșit"] },
        ],
      }),
    );
    const service = new AiQuestionVerifierService(
      new ConfigService({
        AI_PROVIDER: "openai-compatible",
        AI_BASE_URL: "http://localhost:11434/v1",
        AI_VERIFIER_MODEL: "verifier-test",
      }),
    );

    await expect(
      service.verify({
        questions,
        categoryPath: "Știință / Biologie",
        difficulty: 2,
        language: "ro",
      }),
    ).resolves.toEqual({ verified: [questions[0]], rejected: 1 });
  });

  it("respinge un set incomplet de verdicte", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      responseFor({
        verdicts: [{ index: 1, valid: true, issues: [] }],
      }),
    );
    const service = new AiQuestionVerifierService(
      new ConfigService({
        AI_PROVIDER: "openai-compatible",
        AI_BASE_URL: "http://localhost:11434/v1",
        AI_VERIFIER_MODEL: "verifier-test",
      }),
    );

    await expect(
      service.verify({
        questions,
        categoryPath: "Știință / Biologie",
        difficulty: 2,
        language: "ro",
      }),
    ).rejects.toThrow(QuestionBatchValidationError);
  });

  it("respinge un verdict trunchiat de provider", async () => {
    jest
      .spyOn(global, "fetch")
      .mockResolvedValue(responseFor({ verdicts: [] }, "length"));
    const service = new AiQuestionVerifierService(
      new ConfigService({
        AI_PROVIDER: "openai-compatible",
        AI_BASE_URL: "http://localhost:11434/v1",
        AI_VERIFIER_MODEL: "verifier-test",
      }),
    );

    await expect(
      service.verify({
        questions,
        categoryPath: "Știință / Biologie",
        difficulty: 2,
        language: "ro",
      }),
    ).rejects.toThrow("încheiat cu motivul length");
  });
});
