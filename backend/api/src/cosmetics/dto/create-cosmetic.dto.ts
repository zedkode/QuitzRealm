import { IsEnum, IsInt, IsString, Matches, MaxLength, Min } from 'class-validator';
import { CosmeticType } from '@prisma/client';

export class CreateCosmeticDto {
  /// Cheia stabilă de care se leagă desenul și traducerea. Impusă la creare:
  /// un cosmetic fără cod n-ar putea fi referit din aplicație.
  @IsString()
  @MaxLength(64)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Codul acceptă doar litere mici, cifre și cratime.',
  })
  code!: string;

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
