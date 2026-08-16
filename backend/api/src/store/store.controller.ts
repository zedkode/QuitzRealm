import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { StoreService, type PayWith } from './store.service';

class BuyDto {
  @IsString()
  code!: string;

  @IsIn(['coins', 'gems'])
  payWith!: PayWith;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  quantity?: number;
}

type PlayerRequest = Request & { user: AuthenticatedUser };

@Controller('store')
export class StoreController {
  constructor(private readonly store: StoreService) {}

  /// Catalogul e public: se vede și fără cont, ca un jucător nou să știe ce
  /// primește înainte să se înregistreze.
  @Get()
  catalog() {
    return this.store.catalog();
  }

  @Get('inventory')
  @UseGuards(JwtAuthGuard)
  inventory(@Req() request: PlayerRequest) {
    return this.store.inventory(request.user.id);
  }

  // Limită strânsă: cumpărarea mișcă valoare, deci merită tratată ca o operație
  // rară, nu ca o citire.
  @Post('powerups/buy')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  buyPowerup(@Body() dto: BuyDto, @Req() request: PlayerRequest) {
    return this.store.buyPowerup(request.user.id, dto.code, dto.payWith, dto.quantity ?? 1);
  }

  @Post('cosmetics/buy')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  buyCosmetic(@Body() dto: BuyDto, @Req() request: PlayerRequest) {
    return this.store.buyCosmetic(request.user.id, dto.code, dto.payWith);
  }
}
