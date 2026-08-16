import { UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import {
  ApiClientService,
  ChatRejectedError,
} from '../api-client/api-client.service';
import {
  MatchChatDto,
  SendDirectMessageDto,
  SendGlobalMessageDto,
  SendMatchMessageDto,
  SendMatchReactionDto,
} from './dto/chat.dto';
import { ChatService, GLOBAL_ROOM } from './chat.service';
import { socketCorsOrigin } from '../web-origins';

/// Chatul stă pe același namespace `/game` ca partidele, cu prefixe de
/// eveniment separate (`chat:*`). Un al doilea namespace ar însemna o a doua
/// conexiune și un al doilea handshake pentru același jucător.
@WebSocketGateway({
  namespace: '/game',
  transports: ['websocket'],
  cors: { origin: socketCorsOrigin(), credentials: true },
})
@UsePipes(
  new ValidationPipe({
    forbidNonWhitelisted: true,
    transform: true,
    whitelist: true,
  }),
)
export class ChatGateway {
  @WebSocketServer()
  server!: Namespace;

  constructor(
    private readonly chat: ChatService,
    private readonly api: ApiClientService,
  ) {}

  @SubscribeMessage('chat:global:join')
  async joinGlobal(@ConnectedSocket() client: Socket): Promise<void> {
    const userId = this.userId(client);
    await client.join(GLOBAL_ROOM);
    client.emit('chat:global:history', {
      messages: await this.chat.recentGlobal(userId),
    });
  }

  @SubscribeMessage('chat:global:leave')
  async leaveGlobal(@ConnectedSocket() client: Socket): Promise<void> {
    await client.leave(GLOBAL_ROOM);
  }

  @SubscribeMessage('chat:global:send')
  async sendGlobal(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendGlobalMessageDto,
  ): Promise<void> {
    const userId = this.userId(client);
    const outcome = await this.chat.sendGlobal(userId, dto.content);
    if (!outcome.ok) {
      client.emit('chat:rejected', { scope: 'global', reason: outcome.reason });
      return;
    }
    if (outcome.shadowBanned) {
      // Confirmăm mesajul numai expeditorului. Nu îl trimitem în camera
      // globală și nici nu îl includem în istoricul public.
      client.emit('chat:global:message', outcome.message);
      return;
    }
    this.server
      .to(GLOBAL_ROOM)
      .except(outcome.excludedUserIds.map((id) => `user:${id}`))
      .emit('chat:global:message', outcome.message);
  }

  @SubscribeMessage('chat:match:join')
  async joinMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: MatchChatDto,
  ): Promise<void> {
    const outcome = await this.chat.joinMatch(this.userId(client), dto.matchId);
    if (!outcome.ok) {
      this.rejectMatch(client, dto.matchId, outcome.reason);
      return;
    }
    client.emit('chat:match:history', {
      matchId: dto.matchId,
      access: outcome.access,
      messages: outcome.messages,
    });
  }

  @SubscribeMessage('chat:match:send')
  async sendMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMatchMessageDto,
  ): Promise<void> {
    const outcome = await this.chat.sendMatchText(
      this.userId(client),
      dto.matchId,
      dto.content,
    );
    this.deliverMatchOutcome(client, dto.matchId, outcome);
  }

  @SubscribeMessage('chat:match:react')
  async reactInMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMatchReactionDto,
  ): Promise<void> {
    const outcome = await this.chat.sendMatchReaction(
      this.userId(client),
      dto.matchId,
      dto.reaction,
    );
    this.deliverMatchOutcome(client, dto.matchId, outcome);
  }

  /// Mesaj într-o conversație persistentă. Verificările stau în API, nu aici:
  /// două locuri cu aceleași reguli ar diverge exact acolo unde contează.
  @SubscribeMessage('chat:send')
  async sendDirect(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendDirectMessageDto,
  ): Promise<void> {
    const userId = this.userId(client);
    try {
      const stored = await this.api.sendChatMessage({
        senderId: userId,
        conversationId: dto.conversationId,
        content: dto.content,
      });
      const payload = {
        id: stored.id,
        conversationId: stored.conversationId,
        senderId: stored.senderId,
        content: stored.content,
        createdAt: stored.createdAt,
      };
      client.emit('chat:message', payload);
      for (const recipientId of stored.recipientIds) {
        this.server.to(`user:${recipientId}`).emit('chat:message', payload);
      }
    } catch (error) {
      if (error instanceof ChatRejectedError) {
        client.emit('chat:rejected', {
          scope: 'direct',
          reason: 'refused',
          message: error.message,
        });
        return;
      }
      throw error;
    }
  }

  private userId(client: Socket): string {
    const userId = (client.data as { userId?: string }).userId;
    if (!userId) {
      throw new WsException('Sesiunea nu este autentificată.');
    }
    return userId;
  }

  private deliverMatchOutcome(
    client: Socket,
    matchId: string,
    outcome: Awaited<ReturnType<ChatService['sendMatchText']>>,
  ): void {
    if (!outcome.ok) {
      this.rejectMatch(client, matchId, outcome.reason);
      return;
    }
    this.server
      .to(`match:${matchId}`)
      .except(outcome.excludedUserIds.map((id) => `user:${id}`))
      .emit('chat:match:message', outcome.message);
  }

  private rejectMatch(client: Socket, matchId: string, reason: string): void {
    client.emit('chat:rejected', { scope: 'match', matchId, reason });
  }
}
