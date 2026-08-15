import { Module } from '@nestjs/common';
import { InternalApiKeyGuard } from '../common/guards/internal-api-key.guard';
import {
  BlocksController,
  FriendsController,
  FriendsInternalController,
} from './friends.controller';
import { FriendsService } from './friends.service';

@Module({
  controllers: [FriendsController, FriendsInternalController, BlocksController],
  providers: [FriendsService, InternalApiKeyGuard],
  exports: [FriendsService],
})
export class SocialModule {}
