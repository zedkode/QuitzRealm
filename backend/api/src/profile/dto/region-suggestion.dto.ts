import { IsOptional, IsString, Length, Matches } from 'class-validator';

/// Indicii furnizate de client din locale-ul dispozitivului sau dintr-un
/// serviciu de geolocație. Sunt folosite numai pentru sugestie, niciodată
/// pentru scrierea preferințelor pe cont.
export class RegionSuggestionDto {
  @IsOptional()
  @IsString()
  @Length(2, 2)
  countryCode?: string;

  @IsOptional()
  @IsString()
  @Length(2, 10)
  @Matches(/^[a-z]{2,3}(?:-[a-z0-9]{2,6})?$/i)
  languageIsoCode?: string;
}
