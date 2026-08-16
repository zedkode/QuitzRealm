import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AchievementsService } from './achievements.service';
import { SetBadgeSlotDto, SetShowcaseDto } from './dto/achievement.dto';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('achievements')
@UseGuards(JwtAuthGuard)
export class AchievementsController {
  constructor(private readonly achievements: AchievementsService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.achievements.listForUser(request.user.id);
  }

  @Get('summary')
  summary(@Req() request: AuthenticatedRequest) {
    return this.achievements.profileSummary(request.user.id);
  }

  @Patch('badges')
  setBadge(@Req() request: AuthenticatedRequest, @Body() dto: SetBadgeSlotDto) {
    return this.achievements.setBadgeSlot(
      request.user.id,
      dto.slotIndex,
      dto.achievementId ?? null,
    );
  }

  @Patch('showcase')
  setShowcase(@Req() request: AuthenticatedRequest, @Body() dto: SetShowcaseDto) {
    return this.achievements.setShowcase(request.user.id, dto.achievementIds);
  }
}
