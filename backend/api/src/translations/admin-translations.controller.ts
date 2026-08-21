import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminRoles } from '../admin/admin-roles.decorator';
import { AdminGuard } from '../admin/admin.guard';
import { AuditService } from '../admin/audit.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpsertTranslationDto } from './dto/upsert-translation.dto';
import { TranslationsService } from './translations.service';

type AdminRequest = Request & { user: AuthenticatedUser };

@Controller('admin/translations')
@UseGuards(JwtAuthGuard, AdminGuard)
@AdminRoles('ADMIN', 'CONTENT_EDITOR')
export class AdminTranslationsController {
  constructor(
    private readonly translations: TranslationsService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  matrix() {
    return this.translations.matrix();
  }

  @Put(':languageIsoCode/:key')
  async upsert(
    @Param('languageIsoCode') languageIsoCode: string,
    @Param('key') key: string,
    @Body() body: UpsertTranslationDto,
    @Req() request: AdminRequest,
  ) {
    const translation = await this.translations.upsert(
      languageIsoCode,
      key,
      body.value,
      request.user.id,
    );
    await this.audit.record(request.user, request, {
      action: 'translation.upsert',
      targetType: 'translation',
      payload: { key, languageIsoCode, value: body.value },
    });
    return translation;
  }
}
