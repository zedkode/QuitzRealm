import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomInt } from "node:crypto";
import { z } from "zod";
import { QuestionBatchValidationError } from "./question-batch.validator";
import { ValidatedGenerateQuestionsJob } from "./question-generation.types";
import { canonicalText } from "./text-similarity";

interface ProviderRequest extends ValidatedGenerateQuestionsJob {
  categoryPath: string;
}

const reasoningEffortSchema = z.enum(["none", "low", "medium", "high", "max"]);
const responseFormatSchema = z.enum(["json_object", "json_schema"]);
const numericValueContainerSchema = z
  .object({ value: z.union([z.number(), z.string()]) })
  .passthrough();
const explicitNumericValueSchema = z.union([
  numericValueContainerSchema,
  z.tuple([numericValueContainerSchema]),
]);

const providerQuestionBatchSchema = z
  .object({
    questions: z.array(
      z
        .object({
          type: z.enum(["multiple_choice", "numeric"]),
          text: z.string(),
          distractors: z.array(z.string()).min(3).max(10),
          correctAnswer: z.string(),
          explanation: z.string(),
          verificationSource: z.string(),
        })
        .strict(),
    ),
  })
  .strict();

function parseIntegerSetting(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error("AI_MAX_TOKENS trebuie să fie un număr întreg pozitiv.");
  }
  return parsed;
}

function parseTemperature(value: string | undefined): number {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 2) {
    throw new Error("AI_TEMPERATURE trebuie să fie între 0 și 2.");
  }
  return parsed;
}

function createQuestionResponseFormat(quantity: number) {
  return {
    type: "json_schema",
    json_schema: {
      name: "quizrealm_questions",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["questions"],
        properties: {
          questions: {
            type: "array",
            minItems: quantity,
            maxItems: quantity,
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "type",
                "text",
                "distractors",
                "correctAnswer",
                "explanation",
                "verificationSource",
              ],
              properties: {
                type: {
                  type: "string",
                  enum: ["multiple_choice", "numeric"],
                },
                text: { type: "string", minLength: 10 },
                distractors: {
                  type: "array",
                  minItems: 4,
                  maxItems: 10,
                  uniqueItems: true,
                  items: { type: "string", minLength: 1 },
                },
                correctAnswer: { type: "string", minLength: 1 },
                explanation: { type: "string", minLength: 10 },
                verificationSource: { type: "string", minLength: 3 },
              },
            },
          },
        },
      },
    },
  };
}

const providerResponseSchema = z
  .object({
    choices: z
      .array(
        z
          .object({
            message: z.object({ content: z.string() }).passthrough(),
          })
          .passthrough(),
      )
      .min(1),
  })
  .passthrough();

@Injectable()
export class AiQuestionProviderService {
  constructor(private readonly config: ConfigService) {}

  async generate(request: ProviderRequest): Promise<string> {
    const provider = this.config.getOrThrow<string>("AI_PROVIDER");
    if (provider === "fixture") {
      return this.generateFixture(request);
    }
    if (provider !== "openai-compatible") {
      throw new Error(`Provider AI nesuportat: ${provider}`);
    }
    return this.generateOpenAiCompatible(request);
  }

  private async generateOpenAiCompatible(
    request: ProviderRequest,
  ): Promise<string> {
    const baseUrl = this.config.getOrThrow<string>("AI_BASE_URL");
    const model = this.config.getOrThrow<string>("AI_MODEL");
    const apiKey = this.config.get<string>("AI_API_KEY");
    const maxTokens = parseIntegerSetting(
      this.config.get<string>("AI_MAX_TOKENS"),
      8192,
    );
    const temperature = parseTemperature(
      this.config.get<string>("AI_TEMPERATURE"),
    );
    const configuredReasoningEffort = this.config.get<string>(
      "AI_REASONING_EFFORT",
    );
    const reasoningEffort = configuredReasoningEffort
      ? reasoningEffortSchema.parse(configuredReasoningEffort)
      : undefined;
    const responseFormat = responseFormatSchema.parse(
      this.config.get<string>("AI_RESPONSE_FORMAT", "json_object"),
    );
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
          temperature,
          max_tokens: maxTokens,
          ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
          response_format:
            responseFormat === "json_schema"
              ? createQuestionResponseFormat(request.quantity)
              : { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                'Generează întrebări trivia factuale în română. Răspunde numai cu un obiect JSON având exact forma {"questions":[{"type":"multiple_choice","text":"...","distractors":["...","...","...","..."],"correctAnswer":"...","explanation":"...","verificationSource":"..."}]}. Obiectul rădăcină are numai cheia questions. Fiecare întrebare are exact cele șase câmpuri arătate; nu folosi cheile question, options, category sau difficulty. type este exact multiple_choice sau numeric. Nu inventa fapte. Fiecare întrebare aparține strict categoriei-frunză cerute. correctAnswer conține răspunsul complet, iar distractors conține cel puțin patru răspunsuri greșite, distincte între ele și față de correctAnswer. Folosește numeric numai când correctAnswer poate fi un singur număr finit scris ca string, fără unitate, text, obiect sau array JSON; în orice alt caz folosește multiple_choice. Pentru numeric, distractorii sunt estimări greșite cerute doar pentru uniformitatea structurii. Explicația justifică faptul, iar verificationSource numește o instituție, publicație sau lucrare verificabilă, nu o formulare generică.',
            },
            {
              role: "user",
              content: `Generează exact ${request.quantity} întrebări în limba ${request.language}, exclusiv pentru categoria „${request.categoryPath}”, dificultatea ${request.difficulty} din 5. Verifică atent valorile numerice, unitățile, formularea neambiguă și concordanța dintre răspuns și explicație.`,
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Provider-ul AI a răspuns cu HTTP ${response.status}.`);
    }
    const decoded: unknown = await response.json();
    const parsed = providerResponseSchema.safeParse(decoded);
    if (!parsed.success) {
      throw new Error("Răspunsul provider-ului AI nu are conținutul așteptat.");
    }
    return this.normalizeProviderContent(
      parsed.data.choices[0].message.content,
    );
  }

  private normalizeProviderContent(content: string): string {
    let decoded: unknown;
    try {
      decoded = JSON.parse(content);
    } catch {
      throw new QuestionBatchValidationError(
        "Conținutul providerului AI nu este JSON valid.",
      );
    }
    const parsed = providerQuestionBatchSchema.safeParse(decoded);
    if (!parsed.success) {
      const details = parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      throw new QuestionBatchValidationError(
        `Conținutul providerului nu respectă contractul: ${details}`,
      );
    }
    return JSON.stringify({
      questions: parsed.data.questions.map((question) => {
        if (question.type === "numeric") {
          return {
            type: question.type,
            text: question.text,
            options: null,
            correctAnswer: this.normalizeNumericAnswer(question.correctAnswer),
            explanation: question.explanation,
            verificationSource: question.verificationSource,
          };
        }
        const distractors = this.selectDistractors(
          question.correctAnswer,
          question.distractors,
        );
        const options = this.shuffle([question.correctAnswer, ...distractors]);
        return {
          type: question.type,
          text: question.text,
          options,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          verificationSource: question.verificationSource,
        };
      }),
    });
  }

  private normalizeNumericAnswer(value: string): string {
    const trimmed = value.trim();
    const directValue = /^[-+]?\d+,\d+$/.test(trimmed)
      ? Number(trimmed.replace(",", "."))
      : Number(trimmed);
    if (Number.isFinite(directValue)) return String(directValue);

    let decoded: unknown;
    try {
      decoded = JSON.parse(trimmed);
    } catch {
      throw new QuestionBatchValidationError(
        "Răspunsul numeric al providerului nu are o valoare explicită.",
      );
    }
    const parsed = explicitNumericValueSchema.safeParse(decoded);
    if (parsed.success) {
      const container = Array.isArray(parsed.data)
        ? parsed.data[0]
        : parsed.data;
      const numericValue = Number(container.value);
      if (Number.isFinite(numericValue)) return String(numericValue);
    }
    throw new QuestionBatchValidationError(
      "Răspunsul numeric al providerului nu are o valoare explicită.",
    );
  }

  private selectDistractors(
    correctAnswer: string,
    candidates: string[],
  ): [string, string, string] {
    const answerKey = canonicalText(correctAnswer);
    const seen = new Set([answerKey]);
    const selected: string[] = [];
    for (const candidate of candidates) {
      const key = canonicalText(candidate);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      selected.push(candidate);
      if (selected.length === 3) break;
    }
    if (selected.length !== 3) {
      throw new QuestionBatchValidationError(
        "Întrebarea grilă nu conține trei distractori distincți față de răspunsul corect.",
      );
    }
    return selected as [string, string, string];
  }

  private shuffle(values: [string, string, string, string]) {
    const shuffled = [...values] as [string, string, string, string];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const target = randomInt(index + 1);
      [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
    }
    return shuffled;
  }

  private generateFixture(request: ProviderRequest): string {
    const questions = Array.from({ length: request.quantity }, (_, index) => {
      const ordinal = index + 1;
      if (index % 2 === 1) {
        return {
          type: "numeric",
          text: `Care este rezultatul calculului ${ordinal} + ${request.difficulty} pentru testul categoriei ${request.categoryPath}?`,
          options: null,
          correctAnswer: String(ordinal + request.difficulty),
          explanation: `Suma dintre ${ordinal} și ${request.difficulty} este ${ordinal + request.difficulty}.`,
          verificationSource:
            "Calcul aritmetic direct, fixture de integrare QuizRealm.",
        };
      }
      const correctAnswer = `Varianta corectă ${ordinal}`;
      return {
        type: "multiple_choice",
        text: `Care este răspunsul factual ${ordinal} pentru testul categoriei ${request.categoryPath}?`,
        options: [
          correctAnswer,
          `Alternativa A ${ordinal}`,
          `Alternativa B ${ordinal}`,
          `Alternativa C ${ordinal}`,
        ],
        correctAnswer,
        explanation: `Aceasta este explicația controlată pentru întrebarea fixture ${ordinal}.`,
        verificationSource: "Fixture determinist de integrare QuizRealm.",
      };
    });
    return JSON.stringify({ questions });
  }
}
