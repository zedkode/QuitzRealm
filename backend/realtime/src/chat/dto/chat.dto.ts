import { IsIn, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export const MATCH_REACTIONS = [
  'good_luck',
  'nice_move',
  'wow',
  'well_played',
] as const;

export class MatchChatDto {
  @IsUUID()
  matchId!: string;
}

export class SendMatchMessageDto extends MatchChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  content!: string;
}

export class SendMatchReactionDto extends MatchChatDto {
  @IsString()
  @IsIn(MATCH_REACTIONS)
  reaction!: (typeof MATCH_REACTIONS)[number];
}

export class SendGlobalMessageDto {
  /// Mai scurt decât la mesajele private: chatul global e un flux comun, iar
  /// pereții de text îl fac ilizibil pentru toată lumea.
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  content!: string;
}

export class SendDirectMessageDto {
  @IsUUID()
  conversationId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content!: string;
}
