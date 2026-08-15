import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class GrantCosmeticDto {
  @IsUUID()
  userId!: string;

  @IsUUID()
  cosmeticId!: string;

  @IsOptional()
  @IsBoolean()
  equipped = false;
}
