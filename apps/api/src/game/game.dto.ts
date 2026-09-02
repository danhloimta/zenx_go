import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const GAME_LIFECYCLE_STATUSES = ['CONCEPT', 'IN_DEVELOPMENT', 'INTERNAL_TEST', 'CLOSED_BETA', 'OPEN_BETA', 'LIVE', 'COMING_SOON', 'SUNSET'] as const;

export class GamesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  genre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(24)
  platform?: string;

  @IsOptional()
  @IsIn(GAME_LIFECYCLE_STATUSES)
  status?: (typeof GAME_LIFECYCLE_STATUSES)[number];
}
