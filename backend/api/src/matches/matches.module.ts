import { Module } from '@nestjs/common';
import { AchievementsModule } from '../achievements/achievements.module';
import { InternalApiKeyGuard } from '../common/guards/internal-api-key.guard';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';

@Module({
  imports: [AchievementsModule],
  controllers: [MatchesController],
  providers: [MatchesService, InternalApiKeyGuard],
})
export class MatchesModule {}
