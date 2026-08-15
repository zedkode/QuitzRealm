import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ListLeaderboardDto } from './dto/list-leaderboard.dto';
import { LeaderboardService } from './leaderboard.service';
import { RANK_TIERS } from '../ranks/rank-tiers';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  /** Clasamentul global este public: nu expune date sensibile. */
  @Get()
  getTop(@Query() query: ListLeaderboardDto) {
    return this.leaderboard.getTop(query.limit);
  }

  /** Treptele de rang, ca aplicația să nu le dubleze hardcodat. */
  @Get('tiers')
  getTiers() {
    return { tiers: RANK_TIERS };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyPosition(@Req() request: Request & { user: AuthenticatedUser }) {
    return this.leaderboard.getPosition(request.user.id);
  }
}
