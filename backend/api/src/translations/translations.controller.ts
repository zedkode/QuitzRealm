import { Controller, Get, Param } from '@nestjs/common';
import { TranslationsService } from './translations.service';

@Controller('translations')
export class TranslationsController {
  constructor(private readonly translations: TranslationsService) {}

  @Get(':languageIsoCode')
  catalog(@Param('languageIsoCode') languageIsoCode: string) {
    return this.translations.catalog(languageIsoCode);
  }
}
