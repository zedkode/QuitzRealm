import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class SubmitAnswerDto {
  @IsUUID()
  matchId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  answer!: string;
}
