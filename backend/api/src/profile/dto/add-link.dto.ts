import { IsString, MaxLength, MinLength } from 'class-validator';
import {
  LINK_LABEL_MAX_LENGTH,
  LINK_URL_MAX_LENGTH,
} from '../profile-content';

/// Un link de profil (§4.6). Domeniul se verifică în serviciu, nu aici:
/// verificarea e o regulă de securitate testabilă separat, nu o constrângere
/// de formă.
export class AddLinkDto {
  @IsString()
  @MinLength(1)
  @MaxLength(LINK_LABEL_MAX_LENGTH)
  label!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(LINK_URL_MAX_LENGTH)
  url!: string;
}
