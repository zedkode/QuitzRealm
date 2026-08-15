import { IsString, MaxLength, MinLength } from 'class-validator';

export class ConfirmTokenDto {
  @IsString()
  @MinLength(16)
  @MaxLength(256)
  token!: string;
}
