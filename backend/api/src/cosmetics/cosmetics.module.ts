import { Module } from '@nestjs/common';
import { InternalApiKeyGuard } from '../common/guards/internal-api-key.guard';
import { CosmeticsController } from './cosmetics.controller';
import { CosmeticsService } from './cosmetics.service';

@Module({
  controllers: [CosmeticsController],
  providers: [CosmeticsService, InternalApiKeyGuard],
})
export class CosmeticsModule {}
