import { UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import { ApiClientService } from '../api-client/api-client.service';
import { agreeOnCategories } from './category-selection';
import { RealtimeAuthService } from '../auth/realtime-auth.service';
import { PresenceService } from '../chat/presence.service';
import { JoinMatchmakingDto } from './dto/join-matchmaking.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { GameService } from './game.service';
import { MatchProfile, publicMatchProfile } from './match-profile';
import { MatchmakingService } from './matchmaking.service';

@WebSocketGateway({
  namespace: '/game',
  transports: ['websocket'],
  cors: { origin: false },
})
@UsePipes(
  new ValidationPipe({
    forbidNonWhitelisted: true,
    transform: true,
    whitelist: true,
  }),
)
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Namespace;

  constructor(
    private readonly auth: RealtimeAuthService,
    private readonly matchmaking: MatchmakingService,
    private readonly game: GameService,
    private readonly api: ApiClientService,
    private readonly presence: PresenceService,
  ) {}

  afterInit(server: Namespace): void {
    this.game.attachServer(server);
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const payload = await this.auth.authenticate(client);
      const data = this.getSocketData(client);
      data.userId = payload.sub;
      data.email = payload.email;
      await this.matchmaking.registerConnection(payload.sub, client.id);
      await client.join(`user:${payload.sub}`);
      // Clientul află din `session:ready` dacă are o partidă de reluat, ca să
      // nu intre în coadă peste ea.
      const activeMatchId = await this.matchmaking.getActiveMatch(payload.sub);
      client.emit('session:ready', {
        userId: payload.sub,
        activeMatchId: activeMatchId ?? null,
        // Prezenta prietenilor (2.3) vine odata cu sesiunea: altfel lista ar
        // arata pe toata lumea offline pana se misca cineva.
        friendsOnline: await this.presence.friendsOnline(payload.sub),
      });
      await this.presence.announceOnline(this.server, payload.sub);
      if (activeMatchId) {
        await this.game.resumeMatch(payload.sub, client);
      }
    } catch {
      client.emit('server:error', { message: 'Autentificare eșuată.' });
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const userId = this.getSocketData(client).userId;
    if (userId) {
      await this.matchmaking.unregisterConnection(userId, client.id);
      await this.game.handleDisconnect(userId, client.id);
      await this.presence.announceOffline(this.server, userId);
    }
  }

  @SubscribeMessage('matchmaking:join')
  async joinMatchmaking(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinMatchmakingDto,
  ): Promise<void> {
    const userId = this.getUserId(client);

    // §1.3: multiplayer ranked cere email verificat. Verificarea se face aici,
    // în server, nu în aplicație — clientul poate minți despre orice.
    const capabilities = await this.api.getCapabilities(userId);
    if (!capabilities.canPlayRanked) {
      client.emit('matchmaking:rejected', {
        mode: dto.mode,
        reason: capabilities.emailVerified
          ? 'account_restricted'
          : 'email_not_verified',
      });
      return;
    }

    let profile: MatchProfile;
    try {
      profile = publicMatchProfile(dto.mode, dto.playerCount);
    } catch (error) {
      throw new WsException((error as Error).message);
    }

    const requested = dto.categoryCodes ?? [];
    await this.matchmaking.setQueuePreferences(userId, requested);

    const matchedUsers = await this.matchmaking.join(userId, profile);
    client.emit('matchmaking:queued', {
      mode: profile.clientMode,
      playerCountTarget: profile.playerCountTarget,
      lobbyType: profile.lobbyType,
      categoryCodes: requested,
    });
    if (matchedUsers) {
      const categoryCodes = agreeOnCategories(
        await Promise.all(
          matchedUsers.map((id) => this.matchmaking.getQueuePreferences(id)),
        ),
      );
      await this.matchmaking.clearQueuePreferences(matchedUsers);
      await this.game.createMatch(matchedUsers, profile, categoryCodes);
    }
  }

  @SubscribeMessage('matchmaking:leave')
  async leaveMatchmaking(@ConnectedSocket() client: Socket): Promise<void> {
    const profile = await this.matchmaking.leave(this.getUserId(client));
    client.emit('matchmaking:left', {
      mode: profile?.clientMode ?? 'duo',
      playerCountTarget: profile?.playerCountTarget ?? 2,
    });
  }

  @SubscribeMessage('round:answer')
  async submitAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SubmitAnswerDto,
  ): Promise<void> {
    await this.game.submitAnswer(this.getUserId(client), dto);
    client.emit('round:answer-accepted', { matchId: dto.matchId });
  }

  private getUserId(client: Socket): string {
    const userId = this.getSocketData(client).userId;
    if (!userId) {
      throw new WsException('Sesiunea nu este autentificată.');
    }
    return userId;
  }

  private getSocketData(client: Socket): {
    userId?: string;
    email?: string;
  } {
    return client.data as { userId?: string; email?: string };
  }
}
