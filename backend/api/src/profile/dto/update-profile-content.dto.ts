import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  BIO_MAX_LENGTH,
  STATUS_EMOJI_MAX_LENGTH,
  STATUS_TEXT_MAX_LENGTH,
} from '../profile-content';
import { THEME_ACCENTS } from '../cosmetic-catalog';

/// Bio, status și temă (`owner-plan.md` §4.3, §4.4, §4.8).
///
/// Fiecare câmp acceptă `null` **explicit**, care înseamnă „șterge", și poate
/// lipsi cu totul, ceea ce înseamnă „nu atinge". `@ValidateIf` lasă `null` să
/// treacă de validatorii de text, care altfel l-ar respinge ca tip greșit.
export class UpdateProfileContentDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(BIO_MAX_LENGTH)
  bio?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(STATUS_TEXT_MAX_LENGTH)
  statusText?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(STATUS_EMOJI_MAX_LENGTH)
  statusEmoji?: string | null;

  /// Peste cât expiră statusul. Plafonat la o săptămână: mai mult decât atât e,
  /// practic, un status permanent, care se exprimă deja prin `null`.
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(5)
  @Max(10_080)
  statusMinutes?: number | null;

  @IsOptional()
  @IsIn([...THEME_ACCENTS])
  themeAccent?: string;
}
