import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { MatchMode, MatchResult } from '@prisma/client';

export class MatchPlayerResultDto {
  @IsUUID()
  userId!: string;

  @IsInt()
  @Min(0)
  territoriesWon!: number;

  @IsInt()
  @Min(0)
  score!: number;

  /// Raspunsuri corecte in partida. Alimenteaza treapta de incredere din
  /// 2.5 si vine exclusiv din realtime, care valideaza raspunsurile
  /// server-side - niciodata din client.
  @IsInt()
  @Min(0)
  correctAnswers: number = 0;

  @IsEnum(MatchResult)
  result!: MatchResult;
}

export class RecordMatchDto {
  @IsEnum(MatchMode)
  mode!: MatchMode;

  @IsString()
  @MaxLength(100)
  mapId!: string;

  @IsDateString()
  startedAt!: string;

  @IsDateString()
  endedAt!: string;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => MatchPlayerResultDto)
  players!: MatchPlayerResultDto[];
}
