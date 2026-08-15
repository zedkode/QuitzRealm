import { ConfigService } from "@nestjs/config";
import { AiQuestionProviderService } from "./ai-question-provider.service";
import { QuestionBatchValidationError } from "./question-batch.validator";

describe("AiQuestionProviderService", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("folosește JSON mode și normalizează variantele înainte de validare", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  questions: [
                    {
                      type: "multiple_choice",
                      text: "Care este unitatea de bază a organismelor vii?",
                      distractors: [
                        "Țesutul",
                        "Celula",
                        "Organul",
                        "Molecula",
                        "Atomul",
                      ],
                      correctAnswer: "Celula",
                      explanation: "Celula este unitatea structurală de bază.",
                      verificationSource: "OpenStax Biology 2e",
                    },
                  ],
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    const service = new AiQuestionProviderService(
      new ConfigService({
        AI_PROVIDER: "openai-compatible",
        AI_BASE_URL: "http://localhost:11434/v1/",
        AI_MODEL: "qwen-test",
        AI_REASONING_EFFORT: "none",
        AI_MAX_TOKENS: "4096",
        AI_TEMPERATURE: "0",
      }),
    );

    const generated = await service.generate({
      categoryId: "13000000-0000-4000-8000-000000000001",
      categoryPath: "Știință / Biologie",
      difficulty: 2,
      quantity: 1,
      language: "ro",
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("http://localhost:11434/v1/chat/completions");
    expect(typeof init?.body).toBe("string");
    const body = JSON.parse(init?.body as string) as {
      reasoning_effort: string;
      max_tokens: number;
      temperature: number;
      response_format: {
        type: string;
      };
      messages: Array<{ content: string }>;
    };
    expect(body.reasoning_effort).toBe("none");
    expect(body.max_tokens).toBe(4096);
    expect(body.temperature).toBe(0);
    expect(body.response_format.type).toBe("json_object");
    expect(body.messages[1].content).toContain("Știință / Biologie");
    const normalized = JSON.parse(generated) as {
      questions: Array<{ options: string[]; correctAnswer: string }>;
    };
    expect(normalized.questions[0].options).toHaveLength(4);
    expect(normalized.questions[0].options).toContain("Celula");
    expect(normalized.questions[0].options).not.toContain("Atomul");
    expect(normalized.questions[0].correctAnswer).toBe("Celula");
  });

  it("respinge conținutul JSON care nu respectă contractul providerului", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  questions: [
                    {
                      type: "multiple_choice",
                      text: "Întrebare fără sursă",
                      distractors: ["A", "B", "C"],
                      correctAnswer: "D",
                      explanation: "Explicație suficientă pentru structură.",
                    },
                  ],
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    const service = new AiQuestionProviderService(
      new ConfigService({
        AI_PROVIDER: "openai-compatible",
        AI_BASE_URL: "http://localhost:11434/v1",
        AI_MODEL: "qwen-test",
      }),
    );

    await expect(
      service.generate({
        categoryId: "13000000-0000-4000-8000-000000000001",
        categoryPath: "Știință / Biologie",
        difficulty: 2,
        quantity: 1,
        language: "ro",
      }),
    ).rejects.toThrow(QuestionBatchValidationError);
  });

  it("normalizează o valoare numerică explicită încapsulată de provider", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  questions: [
                    {
                      type: "numeric",
                      text: "Câte grame sunt necesare pentru acest calcul?",
                      distractors: ["1", "5", "20"],
                      correctAnswer: '[{"value":10,"unit":"g"}]',
                      explanation:
                        "Calculul declarat de provider conduce la rezultat.",
                      verificationSource: "Manual de fizică",
                    },
                  ],
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    const service = new AiQuestionProviderService(
      new ConfigService({
        AI_PROVIDER: "openai-compatible",
        AI_BASE_URL: "http://localhost:11434/v1",
        AI_MODEL: "generator-test",
        AI_RESPONSE_FORMAT: "json_schema",
      }),
    );

    const generated = await service.generate({
      categoryId: "13000000-0000-4000-8000-000000000001",
      categoryPath: "Știință / Biologie",
      difficulty: 2,
      quantity: 1,
      language: "ro",
    });
    const batch = JSON.parse(generated) as {
      questions: Array<{ correctAnswer: string }>;
    };
    expect(batch.questions[0].correctAnswer).toBe("10");
    const requestBody = JSON.parse(
      fetchSpy.mock.calls[0][1]?.body as string,
    ) as {
      response_format: {
        type: string;
        json_schema: {
          schema: {
            properties: { questions: { minItems: number; maxItems: number } };
          };
        };
      };
    };
    expect(requestBody.response_format.type).toBe("json_schema");
    expect(
      requestBody.response_format.json_schema.schema.properties.questions
        .minItems,
    ).toBe(1);
    expect(
      requestBody.response_format.json_schema.schema.properties.questions
        .maxItems,
    ).toBe(1);
  });
});
