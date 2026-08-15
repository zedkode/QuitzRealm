import { Module } from '@nestjs/common';
import { InternalApiKeyGuard } from '../common/guards/internal-api-key.guard';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';

@Module({
  controllers: [MatchesController],
  providers: [MatchesService, InternalApiKeyGuard],
})
export class MatchesModule {}
