import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import {
  CreateChatReportDto,
  MessageHistoryQueryDto,
  OpenConversationDto,
  SendMessageDto,
  UpdatePrivacyDto,
} from './dto/chat.dto';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  /// Treapta de încredere și progresul spre următoarea. Aplicația afișează
  /// „mai ai X răspunsuri corecte”, dar nu calculează nimic: pragurile trăiesc
  /// pe server (§2.5).
  @Get('trust')
  trust(@Req() request: AuthenticatedRequest) {
    return this.chat.permissionsFor(request.user.id);
  }

  @Get('privacy')
  privacy(@Req() request: AuthenticatedRequest) {
    return this.chat.getPrivacy(request.user.id);
  }

  @Patch('privacy')
  updatePrivacy(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdatePrivacyDto,
  ) {
    return this.chat.updatePrivacy(request.user.id, dto);
  }

  @Get('conversations')
  conversations(@Req() request: AuthenticatedRequest) {
    return this.chat.listConversations(request.user.id);
  }

  @Post('conversations')
  openConversation(
    @Req() request: AuthenticatedRequest,
    @Body() dto: OpenConversationDto,
  ) {
    return this.chat.openConversation(request.user.id, dto.userId);
  }

  @Post('conversations/:id/accept')
  acceptRequest(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.chat.acceptDmRequest(request.user.id, id);
  }

  @Get('conversations/:id/messages')
  messages(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: MessageHistoryQueryDto,
  ) {
    return this.chat.messages(request.user.id, id, {
      before: query.before ? new Date(query.before) : undefined,
      limit: query.limit,
    });
  }

  /// Calea REST de trimitere. Livrarea în timp real vine din `backend/realtime`,
  /// care apelează același serviciu prin endpointul intern — verificările nu
  /// sunt duplicate pe cele două căi.
  @Post('conversations/:id/messages')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  send(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chat.sendMessage(request.user.id, id, dto.content);
  }

  @Post('reports')
  @Throttle({ default: { limit: 20, ttl: 3_600_000 } })
  report(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateChatReportDto,
  ) {
    return this.chat.report(request.user.id, dto);
  }
}
