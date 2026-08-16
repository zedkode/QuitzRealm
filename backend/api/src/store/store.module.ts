import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminModule } from '../admin/admin.module';
import { AdminFinanceController } from './admin-finance.controller';
import { AdminStoreController } from './admin-store.controller';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { WalletService } from './wallet.service';

@Module({
  imports: [PrismaModule, AuthModule, AdminModule],
  controllers: [StoreController, AdminStoreController, AdminFinanceController],
  providers: [StoreService, WalletService],
  exports: [WalletService, StoreService],
})
export class StoreModule {}
