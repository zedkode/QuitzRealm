import { Module } from '@nestjs/common';
import { InternalApiKeyGuard } from '../common/guards/internal-api-key.guard';
import { SocialModule } from '../social/social.module';
import { ChatController } from './chat.controller';
import { ChatInternalController } from './chat-internal.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [SocialModule],
  controllers: [ChatController, ChatInternalController],
  providers: [ChatService, InternalApiKeyGuard],
  exports: [ChatService],
})
export class ChatModule {}
