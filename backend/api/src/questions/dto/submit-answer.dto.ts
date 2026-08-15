import { IsString, MaxLength } from 'class-validator';

export class SubmitAnswerDto {
  @IsString()
  @MaxLength(512)
  answer!: string;
}
