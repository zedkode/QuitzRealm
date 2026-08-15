import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ApiClientModule } from '../api-client/api-client.module';
import { ChatModule } from '../chat/chat.module';
import { RealtimeAuthService } from '../auth/realtime-auth.service';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { MatchmakingService } from './matchmaking.service';

@Module({
  imports: [JwtModule.register({}), ApiClientModule, ChatModule],
  providers: [
    RealtimeAuthService,
    MatchmakingService,
    GameService,
    GameGateway,
  ],
})
export class GameModule {}
