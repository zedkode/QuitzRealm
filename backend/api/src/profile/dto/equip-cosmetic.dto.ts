import { IsIn, IsString, MaxLength, ValidateIf } from 'class-validator';

/// Tipurile pe care le poate schimba jucătorul de pe ecranul de profil.
/// `MAP_SKIN` lipsește intenționat: nu are încă unde să fie purtat.
const EQUIPPABLE_TYPES = [
  'AVATAR',
  'FRAME',
  'BANNER',
  'NAME_STYLE',
  'TITLE',
] as const;

export class EquipCosmeticDto {
  @IsIn([...EQUIPPABLE_TYPES])
  type!: (typeof EQUIPPABLE_TYPES)[number];

  /// `null` scoate ce e purtat acum. Distincția contează la titluri, unde
  /// „niciun titlu" e o alegere validă, nu o valoare lipsă.
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(64)
  code!: string | null;
}
