import { DmPermission, ProfileVisibility } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class OpenConversationDto {
  @IsUUID()
  userId!: string;
}

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content!: string;
}

export class MessageHistoryQueryDto {
  /// Paginare pe timp, nu pe offset: într-un fir care primește mesaje în timp
  /// ce derulezi, un offset ar sări sau ar repeta rânduri.
  @IsOptional()
  @IsDateString()
  before?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class UpdatePrivacyDto {
  @IsOptional()
  @IsEnum(DmPermission)
  dmPermission?: DmPermission;

  @IsOptional()
  @IsEnum(ProfileVisibility)
  profileVisibility?: ProfileVisibility;
}

export class CreateChatReportDto {
  @IsUUID()
  reportedUserId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;

  /// `global`, `friend` sau `dm`. Text liber scurt, nu enum: contextul e doar
  /// pentru trierea din moderare, nu pentru o decizie automată.
  @IsString()
  @MaxLength(20)
  scope!: string;

  @IsOptional()
  @IsUUID()
  messageId?: string;

  /// Necesar pentru chatul global, care nu se persistă: fără o copie a
  /// textului, raportul ar rămâne fără dovadă.
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  contentSnapshot?: string;
}
