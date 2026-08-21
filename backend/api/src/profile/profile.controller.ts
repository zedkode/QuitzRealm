import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthenticatedUser } from '../auth/auth.types';
import { ChatService } from '../chat/chat.service';
import { UpdatePrivacyDto } from '../chat/dto/chat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddLinkDto } from './dto/add-link.dto';
import { EquipCosmeticDto } from './dto/equip-cosmetic.dto';
import { RegionSuggestionDto } from './dto/region-suggestion.dto';
import { UpdateProfileContentDto } from './dto/update-profile-content.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { ProfileService } from './profile.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

/// Profilul de jucător din `owner-plan.md` §4.
@Controller('users/me/profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(
    private readonly profile: ProfileService,
    private readonly chat: ChatService,
  ) {}

  @Get()
  me(@Req() request: AuthenticatedRequest) {
    return this.profile.getMyProfile(request.user.id);
  }

  @Patch()
  updateContent(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateProfileContentDto,
  ) {
    return this.profile.updateContent(request.user.id, dto);
  }

  /// `PUT`, nu `POST`: rezultatul e aceeași stare oricâte apăsări ar primi
  /// butonul, iar ecranul de cosmetice invită la apăsat repede.
  @Put('equip')
  equip(
    @Req() request: AuthenticatedRequest,
    @Body() dto: EquipCosmeticDto,
  ) {
    return this.profile.equip(request.user.id, dto);
  }

  /// Limitat: fiecare link acceptat e o adresă pe care alți jucători o vor
  /// deschide, deci merită să coste ceva să încerci în masă.
  @Post('links')
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  addLink(
    @Req() request: AuthenticatedRequest,
    @Body() dto: AddLinkDto,
  ) {
    return this.profile.addLink(request.user.id, dto);
  }

  @Delete('links/:id')
  removeLink(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.profile.removeLink(request.user.id, id);
  }

  @Patch('region')
  updateRegion(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateRegionDto,
  ) {
    return this.profile.updateRegion(request.user.id, dto);
  }

  @Get('region/options')
  regionOptions(@Query() suggestion: RegionSuggestionDto) {
    return this.profile.getRegionOptions(
      suggestion.countryCode,
      suggestion.languageIsoCode,
    );
  }
}

/// Confidențialitatea contului (§4.9).
///
/// Trăiește sub `users/me`, unde o caută ecranul de setări, dar delegă către
/// `ChatService`, care deține deja tabelul și regula că minorii nu pot ridica
/// restricția de mesaje. Două implementări ar însemna două locuri în care acea
/// regulă poate fi uitată.
@Controller('users/me/privacy')
@UseGuards(JwtAuthGuard)
export class AccountPrivacyController {
  constructor(private readonly chat: ChatService) {}

  @Get()
  privacy(@Req() request: AuthenticatedRequest) {
    return this.chat.getPrivacy(request.user.id);
  }

  @Patch()
  update(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdatePrivacyDto,
  ) {
    return this.chat.updatePrivacy(request.user.id, dto);
  }
}

/// Profilul public al altui jucător (§4.9).
@Controller('players')
@UseGuards(JwtAuthGuard)
export class PublicProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get(':username')
  view(
    @Req() request: AuthenticatedRequest,
    @Param('username') username: string,
  ) {
    return this.profile.getPublicProfile(request.user.id, username);
  }
}
