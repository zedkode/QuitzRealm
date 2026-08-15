import {
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  /// Handle unic. Doar caractere sigure în URL-uri și în @mențiuni.
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[a-zA-Z0-9_]+$/)
  username!: string;

  /// Numele afișat, schimbabil liber. Lipsa lui înseamnă „folosește username”.
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  displayName?: string;

  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  password!: string;

  /// Age gate (§1.3): `YYYY-MM-DD`. Validarea de plauzibilitate și pragurile
  /// de vârstă se fac în `account-policy`, nu aici.
  @IsDateString({ strict: true })
  birthDate!: string;
}
