import { QuestionType } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateQuestionDto {
  @IsEnum(QuestionType)
  type!: QuestionType;

  @IsUUID()
  categoryId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  difficulty!: number;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  text!: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsString({ each: true })
  options?: string[];

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  correctAnswer!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @MaxLength(10)
  languageIsoCode!: string;
}
