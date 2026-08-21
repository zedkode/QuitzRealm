import { IsString, Length, Matches } from 'class-validator';

/// Identitatea regională confirmată explicit (§10.2). Ambele câmpuri sunt
/// obligatorii: serverul nu deduce și nu salvează tăcut limba din țară.
export class UpdateRegionDto {
  @IsString()
  @Length(2, 2)
  countryCode!: string;

  @IsString()
  @Length(2, 10)
  @Matches(/^[a-z]{2,3}(?:-[a-z0-9]{2,6})?$/i)
  languageIsoCode!: string;
}
