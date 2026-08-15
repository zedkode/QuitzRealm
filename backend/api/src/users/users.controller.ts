import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SetBirthDateDto } from './dto/set-birth-date.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUsernameDto } from './dto/update-username.dto';
import { UsersService } from './users.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  getProfile(@Req() request: AuthenticatedRequest) {
    return this.users.getProfile(request.user.id);
  }

  @Patch('me')
  updateProfile(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.users.updateProfile(request.user.id, dto);
  }

  /// Pentru conturile create înainte de age gate. Se poate seta o singură dată.
  @Patch('me/birth-date')
  setBirthDate(
    @Req() request: AuthenticatedRequest,
    @Body() dto: SetBirthDateDto,
  ) {
    return this.users.setBirthDate(request.user.id, dto);
  }

  /// Separat de `PATCH /users/me`: are cooldown propriu și poate eșua din
  /// motive diferite (nume luat, fereastră neexpirată).
  @Patch('me/username')
  updateUsername(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateUsernameDto,
  ) {
    return this.users.updateUsername(request.user.id, dto);
  }
}
