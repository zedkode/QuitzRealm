import { Module } from '@nestjs/common';
import { ApiClientModule } from '../api-client/api-client.module';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { PresenceService } from './presence.service';

@Module({
  imports: [ApiClientModule],
  providers: [ChatService, PresenceService, ChatGateway],
  exports: [PresenceService],
})
export class ChatModule {}
