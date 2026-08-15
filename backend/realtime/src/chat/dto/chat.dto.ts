import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

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
