import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from '../prisma/prisma.module';
import { LocaleInterceptor } from './locale.interceptor';
import { LocaleResolverService } from './locale-resolver.service';
import { LocalizedContentService } from './localized-content.service';
import { LocalizedExceptionFilter } from './localized-exception.filter';

@Module({
  imports: [PrismaModule],
  providers: [
    LocaleResolverService,
    LocalizedContentService,
    { provide: APP_INTERCEPTOR, useClass: LocaleInterceptor },
    { provide: APP_FILTER, useClass: LocalizedExceptionFilter },
  ],
  exports: [LocaleResolverService, LocalizedContentService],
})
export class LocalizationModule {}
