import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  FALLBACK_LANGUAGE_ISO_CODE,
  MISSING_TRANSLATION_KEY,
} from '../translations/translation-catalog.seed';

@Injectable()
export class LocalizedContentService {
  constructor(private readonly prisma: PrismaService) {}

  async values(
    languageIsoCode: string,
    keys: readonly string[],
  ): Promise<Readonly<Record<string, string>>> {
    const requestedKeys = Array.from(new Set(keys));
    const rows = await this.prisma.translation.findMany({
      where: {
        key: { in: [...requestedKeys, MISSING_TRANSLATION_KEY] },
        language: {
          active: true,
          isoCode: {
            in: Array.from(
              new Set([languageIsoCode, FALLBACK_LANGUAGE_ISO_CODE]),
            ),
          },
        },
      },
      select: {
        key: true,
        value: true,
        language: { select: { isoCode: true } },
      },
    });
    const english = new Map(
      rows
        .filter((row) => row.language.isoCode === FALLBACK_LANGUAGE_ISO_CODE)
        .map((row) => [row.key, row.value]),
    );
    const localized = new Map(
      rows
        .filter((row) => row.language.isoCode === languageIsoCode)
        .map((row) => [row.key, row.value]),
    );
    const missing =
      localized.get(MISSING_TRANSLATION_KEY) ??
      english.get(MISSING_TRANSLATION_KEY);
    if (!missing) {
      throw new ServiceUnavailableException({
        code: 'TRANSLATION_FALLBACK_UNAVAILABLE',
        messageKey: 'error.translation.fallback_unavailable',
        params: {},
      });
    }

    return Object.fromEntries(
      requestedKeys.map((key) => [
        key,
        localized.get(key) ?? english.get(key) ?? missing,
      ]),
    );
  }
}
