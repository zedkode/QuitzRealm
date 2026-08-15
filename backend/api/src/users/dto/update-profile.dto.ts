import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  /// Numele afișat în joc și chat. Se schimbă liber (§1.2).
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  displayName!: string;
}
