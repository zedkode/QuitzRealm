import { Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';
import {
  AccountPrivacyController,
  ProfileController,
  PublicProfileController,
} from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [LeaderboardModule, ChatModule],
  controllers: [
    ProfileController,
    AccountPrivacyController,
    PublicProfileController,
  ],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
