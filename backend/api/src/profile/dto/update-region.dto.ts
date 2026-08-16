import { IsString, Length } from 'class-validator';

/// Țara declarată (§10.2). Codul se validează contra listei acceptate în
/// serviciu; aici verificăm doar forma ISO-3166 alpha-2.
export class UpdateRegionDto {
  @IsString()
  @Length(2, 2)
  countryCode!: string;
}
