import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { ClientMatchMode } from '../match-profile';

export class JoinMatchmakingDto {
  @IsIn(['duo', 'classic'])
  mode!: ClientMatchMode;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(8)
  playerCount?: number;

  /// Categoriile din care vrea jucătorul întrebări. Lipsa listei sau lista
  /// goală înseamnă „toate” — bifa implicită din aplicație.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(64)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  categoryCodes?: string[];
}
