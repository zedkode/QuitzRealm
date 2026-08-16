import { IsObject, IsString, Matches, MaxLength } from 'class-validator';

/// Payloadul minim al campaniei locale. Serviciul îl validează și îl reduce la
/// stele pe nivele și XP solo; nu acceptă ELO, monede sau inventar din client.
export class MigrateGuestProgressDto {
  @IsString()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  guestId!: string;

  @IsObject()
  @MaxLength(20_000)
  campaignProgress!: Record<string, unknown>;
}
