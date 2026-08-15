import { Module } from "@nestjs/common";
import { AiQuestionProviderService } from "./ai-question-provider.service";
import { AiQuestionVerifierService } from "./ai-question-verifier.service";
import { QuestionBatchValidator } from "./question-batch.validator";
import { QuestionGenerationService } from "./question-generation.service";
import { QuestionRepository } from "./question.repository";

@Module({
  providers: [
    AiQuestionProviderService,
    AiQuestionVerifierService,
    QuestionBatchValidator,
    QuestionGenerationService,
    QuestionRepository,
  ],
  exports: [QuestionGenerationService],
})
export class QuestionsModule {}
