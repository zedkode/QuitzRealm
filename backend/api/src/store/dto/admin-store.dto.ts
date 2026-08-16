import { Type } from 'class-transformer';
import {
  IsBoolean, IsEnum, IsInt, IsOptional, IsString, Length, Matches, Max, Min,
} from 'class-validator';
import { CurrencyKind, PowerupEffect, PowerupKind } from '@prisma/client';

/// Cheile de catalog sunt scrise în asset-uri și traduceri, deci forma lor e
/// restrânsă intenționat: fără spații, fără diacritice, stabile.
const CODE_PATTERN = /^[a-z0-9][a-z0-9_-]{1,62}[a-z0-9]$/;

export class UpsertPowerupDto {
  @IsString()
  @Matches(CODE_PATTERN, { message: 'code: doar litere mici, cifre, - și _' })
  code!: string;

  @IsString()
  @Length(1, 100)
  name!: string;

  @IsString()
  @Length(1, 500)
  description!: string;

  @IsEnum(PowerupKind)
  kind!: PowerupKind;

  @IsEnum(PowerupEffect)
  effect!: PowerupEffect;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100_000)
  magnitude!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2_592_000)
  durationSeconds?: number;

  // Prețurile au plafon: o zero în plus dintr-o greșeală de tastare ar scoate
  // obiectul din piață fără ca nimeni să observe imediat.
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  priceCoins!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  priceGems!: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000)
  sortOrder?: number;
}

export class UpsertGemPackDto {
  @IsString()
  @Matches(CODE_PATTERN, { message: 'code: doar litere mici, cifre, - și _' })
  code!: string;

  @IsString()
  @Length(1, 100)
  name!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  gems!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  bonusGems?: number;

  /// În bani/cenți, întreg. Plafonat ca o greșeală de tastare să nu producă un
  /// preț absurd pe care un client l-ar putea totuși plăti.
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10_000_00)
  priceCents!: number;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'currency: cod ISO din 3 litere mari' })
  currency?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000)
  sortOrder?: number;
}

/// Acordare manuală de monedă către un cont.
///
/// Cere motiv obligatoriu: o mișcare de valoare fără explicație e exact ce n-ar
/// trebui să poată face un administrator fără urmă.
export class GrantCurrencyDto {
  @IsEnum(CurrencyKind)
  currency!: CurrencyKind;

  @Type(() => Number)
  @IsInt()
  @Min(-1_000_000)
  @Max(1_000_000)
  amount!: number;

  @IsString()
  @Length(3, 500)
  reason!: string;
}
