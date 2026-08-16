import { IsString, Length } from 'class-validator';

/// Cod opac, utilizabil o singură dată, trimis din callback-ul browserului în
/// aplicația mobilă. Nu este un access token și nu trebuie logat de client.
export class GoogleMobileExchangeDto {
  @IsString()
  @Length(20, 256)
  code!: string;
}
