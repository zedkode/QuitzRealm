import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ApiClientModule } from './api-client/api-client.module';
import { ChatModule } from './chat/chat.module';
import { GameModule } from './game/game.module';
import { HealthController } from './health.controller';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    RedisModule,
    ApiClientModule,
    GameModule,
    ChatModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
