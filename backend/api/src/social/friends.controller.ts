import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InternalApiKeyGuard } from '../common/guards/internal-api-key.guard';
import { RequestFriendshipDto, RespondFriendshipDto } from './dto/friends.dto';
import { FriendsService } from './friends.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private readonly friends: FriendsService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.friends.list(request.user.id);
  }

  /// Limitat strict: fără plafon, cererile de prietenie în masă ar fi cel mai
  /// ieftin canal de spam din joc.
  @Post('requests')
  @Throttle({ default: { limit: 20, ttl: 3_600_000 } })
  request(
    @Req() request: AuthenticatedRequest,
    @Body() dto: RequestFriendshipDto,
  ) {
    return this.friends.request(request.user.id, dto.username);
  }

  @Post('requests/:id')
  respond(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RespondFriendshipDto,
  ) {
    return this.friends.respond(request.user.id, id, dto.accept);
  }

  @Delete(':userId')
  @HttpCode(204)
  async remove(
    @Req() request: AuthenticatedRequest,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    await this.friends.remove(request.user.id, userId);
  }
}

/// Ce folosește `backend/realtime` din lista de prieteni: cui trebuie anunțată
/// prezența cuiva care tocmai s-a conectat (§2.3).
@Controller('friends/internal')
@UseGuards(InternalApiKeyGuard)
export class FriendsInternalController {
  constructor(private readonly friends: FriendsService) {}

  @Get(':userId/ids')
  async ids(@Param('userId', ParseUUIDPipe) userId: string) {
    return { friendIds: await this.friends.friendIds(userId) };
  }
}

@Controller('blocks')
@UseGuards(JwtAuthGuard)
export class BlocksController {
  constructor(private readonly friends: FriendsService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.friends.listBlocked(request.user.id);
  }

  @Post(':userId')
  @HttpCode(204)
  async block(
    @Req() request: AuthenticatedRequest,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    await this.friends.block(request.user.id, userId);
  }

  @Delete(':userId')
  @HttpCode(204)
  async unblock(
    @Req() request: AuthenticatedRequest,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    await this.friends.unblock(request.user.id, userId);
  }
}
