import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminPlayersController } from './players.controller';
import { PlayersService } from './players.service';
import { AdminGuard } from './admin.guard';
import { AuditService } from './audit.service';
import { OverviewService } from './overview.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdminController, AdminPlayersController],
  providers: [AdminGuard, AuditService, OverviewService, PlayersService],
  exports: [AdminGuard, AuditService],
})
export class AdminModule {}
