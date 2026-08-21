import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

function normalizeLanguage(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class ListQuestionsDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number;

  /** Stable category codes selected for a match. Matching is exact. */
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value
          .split(',')
          .map((code) => code.trim())
          .filter((code) => code.length > 0)
      : value,
  )
  @IsArray()
  @ArrayMaxSize(64)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  categoryCodes?: string[];

  /** Canonical language parameter used by realtime and new clients. */
  @IsOptional()
  @Transform(({ value }) => normalizeLanguage(value))
  @IsString()
  @MaxLength(10)
  requestedLanguageIsoCode?: string;

  /** Temporary public compatibility alias. */
  @IsOptional()
  @Transform(({ value }) => normalizeLanguage(value))
  @IsString()
  @MaxLength(10)
  languageIsoCode?: string;

  /** Legacy Flutter compatibility alias. */
  @IsOptional()
  @Transform(({ value }) => normalizeLanguage(value))
  @IsString()
  @MaxLength(10)
  language?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(/^[A-Z]{2}$/)
  countryCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
