import { Module } from '@nestjs/common';
import { InternalApiKeyGuard } from '../common/guards/internal-api-key.guard';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';
import { UsersController } from './users.controller';
import { UsersInternalController } from './users-internal.controller';
import { UsersService } from './users.service';

@Module({
  imports: [LeaderboardModule],
  controllers: [UsersController, UsersInternalController],
  providers: [UsersService, InternalApiKeyGuard],
})
export class UsersModule {}
