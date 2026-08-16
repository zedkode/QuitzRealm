import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminGuard } from './admin.guard';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdminController],
  providers: [AdminGuard],
})
export class AdminModule {}
