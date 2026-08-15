import { Module } from '@nestjs/common';
import { InternalApiKeyGuard } from '../common/guards/internal-api-key.guard';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';

@Module({
  controllers: [QuestionsController],
  providers: [QuestionsService, InternalApiKeyGuard],
})
export class QuestionsModule {}
