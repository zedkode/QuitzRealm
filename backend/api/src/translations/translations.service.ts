import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  FALLBACK_LANGUAGE_ISO_CODE,
  MISSING_TRANSLATION_KEY,
} from './translation-catalog.seed';

const LANGUAGE_CODE_PATTERN = /^[a-z]{2,3}(?:-[a-z0-9]{2,6})?$/;
const TRANSLATION_KEY_PATTERN = /^[a-z][a-z0-9_-]*(?:\.[a-z][a-z0-9_-]*)+$/;
const MAX_TRANSLATION_VALUE_LENGTH = 20_000;

interface TranslationRow {
  readonly key: string;
  readonly value: string;
  readonly updatedAt: Date;
  readonly language: { readonly isoCode: string };
}

export interface TranslationCatalogResponse {
  readonly requestedLanguage: string;
  readonly resolvedLanguage: string;
  readonly fallbackLanguage: typeof FALLBACK_LANGUAGE_ISO_CODE;
  readonly usedLanguageFallback: boolean;
  readonly entries: Readonly<Record<string, string>>;
  readonly fallbackKeys: readonly string[];
  readonly updatedAt: string | null;
}

export interface TranslationMatrixEntry {
  readonly key: string;
  readonly values: Readonly<Record<string, string | null>>;
  readonly missingLanguages: readonly string[];
}

function localizedException(
  kind: 'bad_request' | 'not_found' | 'unavailable',
  code: string,
  messageKey: string,
  params: Record<string, string> = {},
): Error {
  const payload = { code, messageKey, params };
  if (kind === 'bad_request') return new BadRequestException(payload);
  if (kind === 'not_found') return new NotFoundException(payload);
  return new ServiceUnavailableException(payload);
}

export function normalizeLanguageCode(languageIsoCode: string): string {
  const normalized = languageIsoCode.trim().toLowerCase();
  if (!LANGUAGE_CODE_PATTERN.test(normalized) || normalized.length > 10) {
    throw localizedException(
      'bad_request',
      'INVALID_LANGUAGE_CODE',
      'error.language.not_supported',
      { language: normalized },
    );
  }
  return normalized;
}

export function validateTranslationInput(key: string, value: unknown): string {
  if (key.length > 160 || !TRANSLATION_KEY_PATTERN.test(key)) {
    throw localizedException(
      'bad_request',
      'INVALID_TRANSLATION_KEY',
      'error.translation.invalid_key',
      { key },
    );
  }
  if (
    typeof value !== 'string' ||
    value.trim().length === 0 ||
    value.length > MAX_TRANSLATION_VALUE_LENGTH
  ) {
    throw localizedException(
      'bad_request',
      'TRANSLATION_VALUE_REQUIRED',
      'error.translation.value_required',
      { key },
    );
  }
  return value;
}

@Injectable()
export class TranslationsService {
  private readonly logger = new Logger(TranslationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async catalog(languageIsoCode: string): Promise<TranslationCatalogResponse> {
    const requestedLanguage = normalizeLanguageCode(languageIsoCode);
    const languages = await this.prisma.language.findMany({
      where: {
        active: true,
        isoCode: {
          in: Array.from(
            new Set([requestedLanguage, FALLBACK_LANGUAGE_ISO_CODE]),
          ),
        },
      },
      select: { id: true, isoCode: true },
    });
    const fallbackLanguage = languages.find(
      (language) => language.isoCode === FALLBACK_LANGUAGE_ISO_CODE,
    );
    if (!fallbackLanguage) {
      throw localizedException(
        'unavailable',
        'TRANSLATION_FALLBACK_UNAVAILABLE',
        'error.translation.fallback_unavailable',
      );
    }

    const requested = languages.find(
      (language) => language.isoCode === requestedLanguage,
    );
    const resolved = requested ?? fallbackLanguage;
    const languageIds = Array.from(new Set([fallbackLanguage.id, resolved.id]));
    const rows = await this.prisma.translation.findMany({
      where: { languageId: { in: languageIds } },
      select: {
        key: true,
        value: true,
        updatedAt: true,
        language: { select: { isoCode: true } },
      },
      orderBy: { key: 'asc' },
    });

    return this.buildCatalog(
      requestedLanguage,
      resolved.isoCode,
      rows,
      requested === undefined,
    );
  }

  async matrix(): Promise<{
    languages: readonly string[];
    entries: readonly TranslationMatrixEntry[];
  }> {
    const languages = await this.prisma.language.findMany({
      where: { active: true },
      select: { isoCode: true },
      orderBy: { isoCode: 'asc' },
    });
    const isoCodes = languages.map((language) => language.isoCode);
    const rows = await this.prisma.translation.findMany({
      where: { language: { active: true } },
      select: {
        key: true,
        value: true,
        updatedAt: true,
        language: { select: { isoCode: true } },
      },
      orderBy: { key: 'asc' },
    });
    const byKey = new Map<string, Map<string, string>>();
    for (const row of rows) {
      const values = byKey.get(row.key) ?? new Map<string, string>();
      values.set(row.language.isoCode, row.value);
      byKey.set(row.key, values);
    }

    return {
      languages: isoCodes,
      entries: Array.from(byKey.entries())
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, storedValues]) => {
          const missingLanguages = isoCodes.filter(
            (isoCode) => !storedValues.has(isoCode),
          );
          return {
            key,
            values: Object.fromEntries(
              isoCodes.map((isoCode) => [
                isoCode,
                storedValues.get(isoCode) ?? null,
              ]),
            ),
            missingLanguages,
          };
        }),
    };
  }

  async upsert(
    languageIsoCode: string,
    key: string,
    value: unknown,
    updatedById: string,
  ) {
    const isoCode = normalizeLanguageCode(languageIsoCode);
    const validatedValue = validateTranslationInput(key, value);
    const language = await this.prisma.language.findUnique({
      where: { isoCode },
      select: { id: true },
    });
    if (!language) {
      throw localizedException(
        'not_found',
        'LANGUAGE_NOT_SUPPORTED',
        'error.language.not_supported',
        { language: isoCode },
      );
    }

    return this.prisma.translation.upsert({
      where: { key_languageId: { key, languageId: language.id } },
      update: { value: validatedValue, updatedById },
      create: {
        key,
        languageId: language.id,
        value: validatedValue,
        updatedById,
      },
      select: {
        key: true,
        value: true,
        updatedAt: true,
        updatedById: true,
        language: { select: { isoCode: true } },
      },
    });
  }

  private buildCatalog(
    requestedLanguage: string,
    resolvedLanguage: string,
    rows: readonly TranslationRow[],
    usedLanguageFallback: boolean,
  ): TranslationCatalogResponse {
    const english = new Map(
      rows
        .filter((row) => row.language.isoCode === FALLBACK_LANGUAGE_ISO_CODE)
        .map((row) => [row.key, row.value]),
    );
    const localized = new Map(
      rows
        .filter((row) => row.language.isoCode === resolvedLanguage)
        .map((row) => [row.key, row.value]),
    );
    const fallbackKeys =
      resolvedLanguage === FALLBACK_LANGUAGE_ISO_CODE
        ? []
        : Array.from(english.keys()).filter((key) => !localized.has(key));
    const entries = new Map(english);
    for (const [key, value] of localized) entries.set(key, value);

    const updatedAt = rows.reduce<Date | null>(
      (latest, row) =>
        latest === null || row.updatedAt > latest ? row.updatedAt : latest,
      null,
    );

    if (!entries.has(MISSING_TRANSLATION_KEY)) {
      this.logger.error('TRANSLATION_FALLBACK_VALUE_MISSING');
      throw localizedException(
        'unavailable',
        'TRANSLATION_FALLBACK_UNAVAILABLE',
        'error.translation.fallback_unavailable',
      );
    }

    if (fallbackKeys.length > 0) {
      this.logger.warn(
        `TRANSLATION_FALLBACK_USED language=${resolvedLanguage} count=${fallbackKeys.length}`,
      );
    }

    return {
      requestedLanguage,
      resolvedLanguage,
      fallbackLanguage: FALLBACK_LANGUAGE_ISO_CODE,
      usedLanguageFallback,
      entries: Object.fromEntries(
        Array.from(entries.entries()).sort(([left], [right]) =>
          left.localeCompare(right),
        ),
      ),
      fallbackKeys: fallbackKeys.sort(),
      updatedAt: updatedAt?.toISOString() ?? null,
    };
  }
}
