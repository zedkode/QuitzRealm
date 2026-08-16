import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminGuard } from './admin.guard';
import { AuditService } from './audit.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdminController],
  providers: [AdminGuard, AuditService],
  exports: [AdminGuard, AuditService],
})
export class AdminModule {}
