import { IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';

/// Codul din aplicația de autentificare. Spațiile și cratimele sunt normalizate
/// de serviciu, dar aici limităm suprafața de intrare la un cod realist.
export class TotpCodeDto {
  @IsString()
  @Matches(/^[0-9\s-]{6,12}$/)
  code!: string;
}

/// Parola actuală dovedește că utilizatorul autentic nu activează 2FA pe un
/// telefon lăsat deblocat. Codul confirmă că secretul a fost scanat corect.
export class EnableTwoFactorDto extends TotpCodeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword!: string;
}

export class DisableTwoFactorDto extends TotpCodeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword!: string;
}

/// După parola corectă, clientul primește o provocare de viață scurtă și o
/// finalizează cu un cod TOTP sau cu un cod de recuperare.
export class CompleteTwoFactorLoginDto extends TotpCodeDto {
  @IsString()
  @Length(20, 256)
  challengeToken!: string;
}
