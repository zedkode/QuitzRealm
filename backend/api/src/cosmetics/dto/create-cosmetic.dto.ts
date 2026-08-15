import { IsEnum, IsInt, IsString, MaxLength, Min } from 'class-validator';
import { CosmeticType } from '@prisma/client';

export class CreateCosmeticDto {
  @IsEnum(CosmeticType)
  type!: CosmeticType;

  @IsString()
  @MaxLength(100)
  name!: string;

  @IsString()
  @MaxLength(30)
  rarity!: string;

  @IsInt()
  @Min(0)
  priceCoins!: number;

  @IsInt()
  @Min(0)
  priceGems!: number;
}
