import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InternalApiKeyGuard } from '../common/guards/internal-api-key.guard';
import { CosmeticsService } from './cosmetics.service';
import { CreateCosmeticDto } from './dto/create-cosmetic.dto';
import { GrantCosmeticDto } from './dto/grant-cosmetic.dto';

@Controller()
export class CosmeticsController {
  constructor(private readonly cosmetics: CosmeticsService) {}

  @Get('cosmetics')
  list() {
    return this.cosmetics.list();
  }

  @Post('cosmetics')
  @UseGuards(InternalApiKeyGuard)
  create(@Body() dto: CreateCosmeticDto) {
    return this.cosmetics.create(dto);
  }

  @Get('inventory')
  @UseGuards(JwtAuthGuard)
  inventory(@Req() request: Request & { user: AuthenticatedUser }) {
    return this.cosmetics.inventory(request.user.id);
  }

  @Post('inventory/grant')
  @UseGuards(InternalApiKeyGuard)
  grant(@Body() dto: GrantCosmeticDto) {
    return this.cosmetics.grant(dto);
  }
}
