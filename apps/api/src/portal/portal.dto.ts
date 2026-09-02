import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const PORTAL_ARTICLE_CATEGORIES = ['DEVELOPMENT_UPDATE', 'ANNOUNCEMENT', 'EVENT', 'MAINTENANCE'] as const;
export const PORTAL_EVENT_STATUSES = ['ACTIVE', 'UPCOMING', 'ENDED'] as const;

export class PortalNewsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  game?: string;

  @IsOptional()
  @IsIn(PORTAL_ARTICLE_CATEGORIES)
  category?: (typeof PORTAL_ARTICLE_CATEGORIES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  pageSize = 9;
}

export class PortalEventsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  game?: string;

  @IsOptional()
  @IsIn(PORTAL_EVENT_STATUSES)
  status?: (typeof PORTAL_EVENT_STATUSES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  pageSize = 9;
}
