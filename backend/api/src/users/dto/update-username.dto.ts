import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateUsernameDto {
  /// Handle-ul unic. Aceleași reguli ca la înregistrare: doar caractere sigure
  /// în URL-uri și în @mențiuni.
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[a-zA-Z0-9_]+$/)
  username!: string;
}
