import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

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

  /// Filtru pe mai multe categorii deodată, prin coduri stabile
  /// (`history,science,...`). Se folosește la selecția de categorii dinaintea
  /// unui meci: un singur `categoryId` n-ar putea exprima „istorie și știință”.
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

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
