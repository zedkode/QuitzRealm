import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/// Schimbarea parolei din cont (`design-reference/03-settings.png`, „Schimbă
/// parola"). Aceleași limite ca la înregistrare: o parolă nouă mai slabă decât
/// una acceptată la creare ar face pragul inutil.
export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  newPassword!: string;
}

/// Ștergerea contului. Parola lipsește doar la conturile fără parolă (Google),
/// unde dovada e chiar sesiunea autentificată.
export class DeleteAccountDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  password?: string;
}
