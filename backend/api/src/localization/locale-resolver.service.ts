import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DEFAULT_LOCALE,
  type LocaleRequestContext,
} from './localization.types';

const LANGUAGE_TAG_PATTERN = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/;
const LANGUAGE_CACHE_TTL_MS = 60_000;

interface WeightedLanguage {
  readonly language: string;
  readonly quality: number;
  readonly position: number;
}

export function parseAcceptLanguage(header: string | undefined): string[] {
  if (!header) return [];
  const weighted: WeightedLanguage[] = [];

  for (const [position, part] of header.split(',').entries()) {
    const [rawLanguage, ...parameters] = part.trim().split(';');
    const language = rawLanguage?.trim().toLowerCase();
    if (!language || language === '*' || !LANGUAGE_TAG_PATTERN.test(language)) {
      continue;
    }

    let quality = 1;
    let valid = true;
    for (const parameter of parameters) {
      const match = /^q=(0(?:\.\d{0,3})?|1(?:\.0{0,3})?|\.\d{1,3})$/i.exec(
        parameter.trim(),
      );
      if (!match) {
        valid = false;
        break;
      }
      quality = Number(match[1]);
    }
    if (valid && quality > 0) weighted.push({ language, quality, position });
  }

  return Array.from(
    new Set(
      weighted
        .sort(
          (left, right) =>
            right.quality - left.quality || left.position - right.position,
        )
        .map((entry) => entry.language),
    ),
  );
}

@Injectable()
export class LocaleResolverService {
  private readonly logger = new Logger(LocaleResolverService.name);
  private cache:
    | { readonly isoCodes: ReadonlySet<string>; readonly expiresAt: number }
    | undefined;

  constructor(private readonly prisma: PrismaService) {}

  async resolve(request: LocaleRequestContext): Promise<string> {
    const supported = await this.activeLanguageCodes();
    const accountLanguage = request.user?.languageIsoCode?.toLowerCase();
    const headerValue = request.headers?.['accept-language'];
    const header =
      typeof headerValue === 'string' ? headerValue : headerValue?.join(',');
    const candidates = [
      ...(accountLanguage ? [accountLanguage] : []),
      ...parseAcceptLanguage(header),
    ];

    for (const candidate of candidates) {
      const exact = supported.has(candidate) ? candidate : undefined;
      if (exact) return exact;
      const base = candidate.split('-')[0];
      if (base && supported.has(base)) return base;
    }
    return DEFAULT_LOCALE;
  }

  private async activeLanguageCodes(): Promise<ReadonlySet<string>> {
    const now = Date.now();
    if (this.cache && this.cache.expiresAt > now) return this.cache.isoCodes;

    try {
      const languages = await this.prisma.language.findMany({
        where: { active: true },
        select: { isoCode: true },
      });
      const isoCodes = new Set(
        languages.map((language) => language.isoCode.toLowerCase()),
      );
      isoCodes.add(DEFAULT_LOCALE);
      this.cache = { isoCodes, expiresAt: now + LANGUAGE_CACHE_TTL_MS };
      return isoCodes;
    } catch {
      this.logger.warn('ACTIVE_LANGUAGE_LOOKUP_FAILED');
      return new Set([DEFAULT_LOCALE]);
    }
  }
}
