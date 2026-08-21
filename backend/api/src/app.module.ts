import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AchievementsModule } from './achievements/achievements.module';
import { AdminModule } from './admin/admin.module';
import { StoreModule } from './store/store.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { ChatModule } from './chat/chat.module';
import { CosmeticsModule } from './cosmetics/cosmetics.module';
import { HealthModule } from './health/health.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { LocalizationModule } from './localization/localization.module';
import { MailModule } from './mail/mail.module';
import { MatchesModule } from './matches/matches.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileModule } from './profile/profile.module';
import { QuestionsModule } from './questions/questions.module';
import { ReportsModule } from './reports/reports.module';
import { SocialModule } from './social/social.module';
import { TranslationsModule } from './translations/translations.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 100,
      },
    ]),
    PrismaModule,
    LocalizationModule,
    MailModule,
    HealthModule,
    AuthModule,
    AchievementsModule,
    AdminModule,
    StoreModule,
    UsersModule,
    CategoriesModule,
    QuestionsModule,
    MatchesModule,
    LeaderboardModule,
    CosmeticsModule,
    ReportsModule,
    SocialModule,
    ChatModule,
    ProfileModule,
    TranslationsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
