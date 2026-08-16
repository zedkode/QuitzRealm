import { IsString, MaxLength, MinLength } from 'class-validator';

export class DeclareAttackDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  matchId!: string;

  /// Teritoriul atacat. Serverul verifică dacă e adiacent unuia deținut de
  /// jucător; clientul poate ascunde restul, dar nu poate fi crezut pe cuvânt.
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  territoryId!: string;
}
