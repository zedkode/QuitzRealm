import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class SetBadgeSlotDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2)
  slotIndex!: number;

  @IsOptional()
  @IsUUID()
  achievementId?: string | null;
}

export class SetShowcaseDto {
  @IsArray()
  @MaxLength(6)
  @IsUUID('4', { each: true })
  achievementIds!: string[];
}
