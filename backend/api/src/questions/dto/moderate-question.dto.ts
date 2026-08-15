import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { QuestionStatus } from '@prisma/client';

export class ModerateQuestionDto {
  @IsEnum(QuestionStatus)
  status!: QuestionStatus;

  @IsOptional()
  @IsUUID()
  reviewedById?: string;
}
