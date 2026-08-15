import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InternalApiKeyGuard } from '../common/guards/internal-api-key.guard';
import { RecordMatchDto } from './dto/record-match.dto';
import { MatchesService } from './matches.service';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matches: MatchesService) {}

  @Get('history')
  @UseGuards(JwtAuthGuard)
  history(@Req() request: Request & { user: AuthenticatedUser }) {
    return this.matches.history(request.user.id);
  }

  @Post('results')
  @UseGuards(InternalApiKeyGuard)
  record(@Body() dto: RecordMatchDto) {
    return this.matches.record(dto);
  }
}
