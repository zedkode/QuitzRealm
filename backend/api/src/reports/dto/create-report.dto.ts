import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateReportDto {
  @IsUUID()
  questionId!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  reason!: string;
}
