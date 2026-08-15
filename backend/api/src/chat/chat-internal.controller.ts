import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { InternalApiKeyGuard } from '../common/guards/internal-api-key.guard';
import { ChatService } from './chat.service';

class InternalSendMessageDto {
  @IsUUID()
  senderId!: string;

  @IsUUID()
  conversationId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content!: string;
}

/// Ce folosește `backend/realtime` din chat.
///
/// Serviciul realtime nu deschide baza de date; trece pe aici, prin aceleași
/// verificări ca ruta REST. Un al doilea drum cu propria logică ar diverge de
/// primul exact la regulile care contează.
@Controller('chat/internal')
@UseGuards(InternalApiKeyGuard)
export class ChatInternalController {
  constructor(private readonly chat: ChatService) {}

  @Get(':userId/global-context')
  globalContext(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.chat.globalChatContext(userId);
  }

  @Post('messages')
  send(@Body() dto: InternalSendMessageDto) {
    return this.chat.sendMessage(dto.senderId, dto.conversationId, dto.content);
  }
}
