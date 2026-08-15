import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { z } from "zod";
import { QuestionBatchValidationError } from "./question-batch.validator";
import { GeneratedQuestion } from "./question-generation.types";

interface VerificationRequest {
  questions: GeneratedQuestion[];
  categoryPath: string;
  difficulty: number;
  language: string;
}

export interface QuestionVerificationResult {
  verified: GeneratedQuestion[];
  rejected: number;
}

const verifierResponseSchema = z
  .object({
    choices: z
      .array(
        z
          .object({
            message: z.object({ content: z.string() }).passthrough(),
            finish_reason: z.string(),
          })
          .passthrough(),
      )
      .min(1),
  })
  .passthrough();

const verdictBatchSchema = z
  .object({
    verdicts: z.array(
      z
        .object({
          index: z.number().int().positive(),
          valid: z.boolean(),
          issues: z.array(z.string()),
        })
        .strict(),
    ),
  })
  .strict();

@Injectable()
export class AiQuestionVerifierService {
  private readonly logger = new Logger(AiQuestionVerifierService.name);

  constructor(private readonly config: ConfigService) {}

  async verify(
    request: VerificationRequest,
  ): Promise<QuestionVerificationResult> {
    if (this.config.getOrThrow<string>("AI_PROVIDER") === "fixture") {
      return { verified: request.questions, rejected: 0 };
    }

    const baseUrl = this.config.getOrThrow<string>("AI_BASE_URL");
    const model = this.config.getOrThrow<string>("AI_VERIFIER_MODEL");
    const apiKey = this.config.get<string>("AI_API_KEY");
    const maxTokens = Number(
      this.config.get<string>("AI_VERIFIER_MAX_TOKENS", "4096"),
    );
    if (!Number.isSafeInteger(maxTokens) || maxTokens < 1) {
      throw new Error(
        "AI_VERIFIER_MAX_TOKENS trebuie să fie un număr întreg pozitiv.",
      );
    }
    const response = await fetch(
      `${baseUrl.replace(/\/$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          max_tokens: maxTokens,
          reasoning_effort: "none",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                'Ești un verificator factual strict pentru trivia. Marchează valid=true numai dacă enunțul, răspunsul, explicația, sursa și toate variantele sunt coerente, neambigue și factual corecte. Un distractor corect sau echivalent cu răspunsul face întrebarea invalidă. Nu rescrie întrebările. Returnează obligatoriu câte un verdict pentru fiecare întrebare, inclusiv cele valide, în ordinea indicilor 1..N. Răspunde numai JSON cu forma exactă {"verdicts":[{"index":1,"valid":false,"issues":["motiv concret"]}]}.',
            },
            {
              role: "user",
              content: JSON.stringify({
                category: request.categoryPath,
                difficulty: request.difficulty,
                language: request.language,
                expectedVerdictCount: request.questions.length,
                questions: request.questions.map((question, index) => ({
                  index: index + 1,
                  ...question,
                })),
              }),
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Verificatorul AI a răspuns cu HTTP ${response.status}.`);
    }
    const decoded: unknown = await response.json();
    const envelope = verifierResponseSchema.safeParse(decoded);
    if (!envelope.success) {
      throw new Error(
        "Răspunsul verificatorului AI nu are conținutul așteptat.",
      );
    }
    if (envelope.data.choices[0].finish_reason !== "stop") {
      throw new QuestionBatchValidationError(
        `Răspunsul verificatorului AI a fost încheiat cu motivul ${envelope.data.choices[0].finish_reason}.`,
      );
    }

    let content: unknown;
    try {
      content = JSON.parse(envelope.data.choices[0].message.content);
    } catch {
      throw new QuestionBatchValidationError(
        "Verificatorul AI nu a returnat JSON valid.",
      );
    }
    const verdictBatch = verdictBatchSchema.safeParse(content);
    if (!verdictBatch.success) {
      throw new QuestionBatchValidationError(
        "Verdictul verificatorului AI nu respectă schema.",
      );
    }

    const verdicts = new Map(
      verdictBatch.data.verdicts.map((verdict) => [verdict.index, verdict]),
    );
    if (
      verdicts.size !== request.questions.length ||
      request.questions.some((_, index) => !verdicts.has(index + 1))
    ) {
      throw new QuestionBatchValidationError(
        "Verificatorul AI nu a evaluat exact toate întrebările din lot.",
      );
    }

    const verified = request.questions.filter((_, index) => {
      const verdict = verdicts.get(index + 1)!;
      if (!verdict.valid) {
        this.logger.warn(
          `Întrebarea ${index + 1} respinsă semantic: ${verdict.issues.join("; ") || "fără motiv"}`,
        );
      }
      return verdict.valid;
    });
    return {
      verified,
      rejected: request.questions.length - verified.length,
    };
  }
}
