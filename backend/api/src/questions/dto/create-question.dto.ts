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
import { QuestionType } from '@prisma/client';

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

  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;
}
