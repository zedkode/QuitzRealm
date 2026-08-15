import { ConfigService } from "@nestjs/config";
import { BootstrapQuestionPlanService } from "../questions/bootstrap-question-plan.service";
import { BootstrapQuestionsService } from "./bootstrap-questions.service";
import { JobsService } from "./jobs.service";

function serviceWithProvider(
  provider?: string,
  verifierModel?: string,
): BootstrapQuestionsService {
  return new BootstrapQuestionsService(
    new ConfigService({
      ...(provider ? { AI_PROVIDER: provider } : {}),
      ...(verifierModel ? { AI_VERIFIER_MODEL: verifierModel } : {}),
    }),
    {} as BootstrapQuestionPlanService,
    {} as JobsService,
  );
}

describe("BootstrapQuestionsService safeguards", () => {
  it("refuză execuția fără provider configurat", async () => {
    await expect(serviceWithProvider().execute()).rejects.toThrow(
      "AI_PROVIDER trebuie configurat",
    );
  });

  it("refuză provider-ul fixture pentru banca reală", async () => {
    await expect(serviceWithProvider("fixture").execute()).rejects.toThrow(
      "fixture nu este permis",
    );
  });

  it("refuză bootstrap-ul real fără model verificator", async () => {
    await expect(
      serviceWithProvider("openai-compatible").execute(),
    ).rejects.toThrow("AI_VERIFIER_MODEL trebuie configurat");
  });

  it("validează limitele înainte de a porni job-uri", async () => {
    await expect(
      serviceWithProvider("openai-compatible", "verifier").execute({
        batchSize: 101,
      }),
    ).rejects.toThrow("batchSize trebuie să fie între 1 și 100");
  });
});
