import { Injectable, Logger } from "@nestjs/common";
import { AiQuestionProviderService } from "./ai-question-provider.service";
import { AiQuestionVerifierService } from "./ai-question-verifier.service";
import { QuestionBatchValidator } from "./question-batch.validator";
import {
  generateQuestionsJobSchema,
  GenerationResult,
  GenerateQuestionsJob,
} from "./question-generation.types";
import { QuestionRepository } from "./question.repository";

@Injectable()
export class QuestionGenerationService {
  private readonly logger = new Logger(QuestionGenerationService.name);

  constructor(
    private readonly provider: AiQuestionProviderService,
    private readonly verifier: AiQuestionVerifierService,
    private readonly validator: QuestionBatchValidator,
    private readonly repository: QuestionRepository,
  ) {}

  async process(data: GenerateQuestionsJob): Promise<GenerationResult> {
    const job = generateQuestionsJobSchema.parse(data);
    const categoryPath = await this.repository.getCategoryPath(job.categoryId);
    try {
      const rawBatch = await this.provider.generate({ ...job, categoryPath });
      const questions = this.validator.validate(rawBatch, job.quantity);
      const verification = await this.verifier.verify({
        questions,
        categoryPath,
        difficulty: job.difficulty,
        language: job.language,
      });
      const stored = await this.repository.insertPendingBatch(
        job,
        verification.verified,
      );
      return {
        requested: questions.length,
        inserted: stored.inserted,
        duplicates: stored.duplicates,
        rejected: verification.rejected,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Eroare necunoscută";
      this.logger.error(
        `Lot respins pentru categoria ${job.categoryId}: ${message}`,
      );
      throw error;
    }
  }
}
