import {
  ContentPublishStatus,
  GameArticleCategory,
  GameLifecycleStatus,
  GameOperationalStatus,
} from '../../common/domain';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const PAGE_SIZES = [10, 20, 50] as const;
const CONTENT_STATUSES = Object.values(ContentPublishStatus);

function trim(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

function trimOrNull(value: unknown) {
  const normalized = trim(value);
  return normalized === '' ? null : normalized;
}

function trimOrUndefined(value: unknown) {
  const normalized = trim(value);
  return normalized === '' ? undefined : normalized;
}

function booleanValue(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined;
  return value === true || value === 'true';
}

export class AdminContentPageDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @IsIn(PAGE_SIZES) pageSize = 20;
}

export class AdminContentGamesQueryDto extends AdminContentPageDto {
  @IsOptional()
  @Transform(({ value }) => trimOrUndefined(value))
  @IsString()
  @MaxLength(100)
  search?: string;
  @IsOptional() @IsIn(Object.values(GameLifecycleStatus)) lifecycleStatus?: GameLifecycleStatus;
  @IsOptional() @IsIn(Object.values(GameOperationalStatus)) operationalStatus?: GameOperationalStatus;
  @IsOptional() @Transform(({ value }) => booleanValue(value)) @IsBoolean() isPublic?: boolean;
}

export class AdminContentGameUpdateDto {
  @IsDateString() expectedUpdatedAt!: string;
  @Transform(({ value }) => trim(value)) @IsOptional() @IsString() @MinLength(2) @MaxLength(160) name?: string;
  @Transform(({ value }) => trim(value)) @IsOptional() @IsString() @MaxLength(500) tagline?: string;
  @Transform(({ value }) => trim(value)) @IsOptional() @IsString() @MaxLength(1000) shortDescription?: string;
  @Transform(({ value }) => trimOrNull(value)) @IsOptional() @IsString() @MaxLength(20000) longDescription?: string | null;
  @IsOptional() @IsIn(Object.values(GameLifecycleStatus)) lifecycleStatus?: GameLifecycleStatus;
  @IsOptional() @IsIn(Object.values(GameOperationalStatus)) operationalStatus?: GameOperationalStatus;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1900) @Max(2100) releaseYear?: number | null;
  @Transform(({ value }) => trimOrNull(value)) @IsOptional() @IsString() @MaxLength(2048) logoUrl?: string | null;
  @Transform(({ value }) => trimOrNull(value)) @IsOptional() @IsString() @MaxLength(2048) iconUrl?: string | null;
  @Transform(({ value }) => trimOrNull(value)) @IsOptional() @IsString() @MaxLength(2048) coverUrl?: string | null;
  @Transform(({ value }) => trimOrNull(value)) @IsOptional() @IsString() @MaxLength(2048) heroDesktopUrl?: string | null;
  @Transform(({ value }) => trimOrNull(value)) @IsOptional() @IsString() @MaxLength(2048) heroMobileUrl?: string | null;
  @Transform(({ value }) => trimOrNull(value)) @IsOptional() @IsString() @MaxLength(80) primaryCtaLabel?: string | null;
  @Transform(({ value }) => trimOrNull(value)) @IsOptional() @IsString() @MaxLength(2048) primaryCtaPath?: string | null;
  @Transform(({ value }) => trimOrNull(value)) @IsOptional() @IsString() @MaxLength(80) secondaryCtaLabel?: string | null;
  @Transform(({ value }) => trimOrNull(value)) @IsOptional() @IsString() @MaxLength(2048) secondaryCtaPath?: string | null;
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsBoolean() isPublic?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
  @Transform(({ value }) => trim(value)) @IsString() @MinLength(5) @MaxLength(500) reason!: string;
}

export class AdminContentArticlesQueryDto extends AdminContentPageDto {
  @IsOptional()
  @Transform(({ value }) => trimOrUndefined(value))
  @IsString()
  @MaxLength(100)
  search?: string;
  @IsOptional() @IsUUID() gameId?: string;
  @IsOptional() @IsIn(Object.values(GameArticleCategory)) category?: GameArticleCategory;
  @IsOptional() @IsIn(CONTENT_STATUSES) status?: ContentPublishStatus;
}

export class AdminContentArticleCreateDto {
  @IsUUID() gameId!: string;
  @Transform(({ value }) => trim(value)) @IsString() @MinLength(3) @MaxLength(240) title!: string;
  @Transform(({ value }) => trim(value)) @IsString() @MinLength(1) @MaxLength(180) slug!: string;
  @Transform(({ value }) => trim(value)) @IsString() @MinLength(3) @MaxLength(1000) excerpt!: string;
  @IsString() @MinLength(1) @MaxLength(50000) content!: string;
  @Transform(({ value }) => trimOrNull(value)) @IsOptional() @IsString() @MaxLength(2048) coverImageUrl?: string | null;
  @IsIn(Object.values(GameArticleCategory)) category!: GameArticleCategory;
  @Transform(({ value }) => trimOrNull(value)) @IsOptional() @IsString() @MaxLength(240) seoTitle?: string | null;
  @Transform(({ value }) => trimOrNull(value)) @IsOptional() @IsString() @MaxLength(500) seoDescription?: string | null;
  @IsOptional() @IsIn(CONTENT_STATUSES) status: ContentPublishStatus = ContentPublishStatus.DRAFT;
  @Transform(({ value }) => trim(value)) @IsString() @MinLength(5) @MaxLength(500) reason!: string;
}

export class AdminContentArticleUpdateDto {
  @IsDateString() expectedUpdatedAt!: string;
  @Transform(({ value }) => trim(value)) @IsOptional() @IsString() @MinLength(3) @MaxLength(240) title?: string;
  @Transform(({ value }) => trim(value)) @IsOptional() @IsString() @MinLength(3) @MaxLength(1000) excerpt?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(50000) content?: string;
  @Transform(({ value }) => trimOrNull(value)) @IsOptional() @IsString() @MaxLength(2048) coverImageUrl?: string | null;
  @IsOptional() @IsIn(Object.values(GameArticleCategory)) category?: GameArticleCategory;
  @Transform(({ value }) => trimOrNull(value)) @IsOptional() @IsString() @MaxLength(240) seoTitle?: string | null;
  @Transform(({ value }) => trimOrNull(value)) @IsOptional() @IsString() @MaxLength(500) seoDescription?: string | null;
  @IsOptional() @IsIn(CONTENT_STATUSES) status?: ContentPublishStatus;
  @Transform(({ value }) => trim(value)) @IsString() @MinLength(5) @MaxLength(500) reason!: string;
}

export class AdminContentEventsQueryDto extends AdminContentPageDto {
  @IsOptional()
  @Transform(({ value }) => trimOrUndefined(value))
  @IsString()
  @MaxLength(100)
  search?: string;
  @IsOptional() @IsUUID() gameId?: string;
  @IsOptional() @IsIn(CONTENT_STATUSES) status?: ContentPublishStatus;
}

export class AdminContentEventCreateDto {
  @IsOptional() @Transform(({ value }) => trimOrNull(value)) @IsUUID() gameId?: string | null;
  @Transform(({ value }) => trim(value)) @IsString() @MinLength(3) @MaxLength(240) title!: string;
  @Transform(({ value }) => trim(value)) @IsString() @MinLength(3) @MaxLength(180) slug!: string;
  @Transform(({ value }) => trim(value)) @IsString() @MinLength(3) @MaxLength(1000) excerpt!: string;
  @IsString() @MinLength(1) @MaxLength(50000) content!: string;
  @Transform(({ value }) => trimOrNull(value)) @IsOptional() @IsString() @MaxLength(2048) coverImageUrl?: string | null;
  @IsDateString() startsAt!: string;
  @IsOptional() @IsDateString() endsAt?: string | null;
  @Transform(({ value }) => trimOrNull(value)) @IsOptional() @IsString() @MaxLength(240) seoTitle?: string | null;
  @Transform(({ value }) => trimOrNull(value)) @IsOptional() @IsString() @MaxLength(500) seoDescription?: string | null;
  @IsOptional() @IsIn(CONTENT_STATUSES) status: ContentPublishStatus = ContentPublishStatus.DRAFT;
  @Transform(({ value }) => trim(value)) @IsString() @MinLength(5) @MaxLength(500) reason!: string;
}

export class AdminContentEventUpdateDto {
  @IsDateString() expectedUpdatedAt!: string;
  @IsOptional() @Transform(({ value }) => trimOrNull(value)) @IsUUID() gameId?: string | null;
  @Transform(({ value }) => trim(value)) @IsOptional() @IsString() @MinLength(3) @MaxLength(240) title?: string;
  @Transform(({ value }) => trim(value)) @IsOptional() @IsString() @MinLength(3) @MaxLength(1000) excerpt?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(50000) content?: string;
  @Transform(({ value }) => trimOrNull(value)) @IsOptional() @IsString() @MaxLength(2048) coverImageUrl?: string | null;
  @IsDateString() @IsOptional() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string | null;
  @Transform(({ value }) => trimOrNull(value)) @IsOptional() @IsString() @MaxLength(240) seoTitle?: string | null;
  @Transform(({ value }) => trimOrNull(value)) @IsOptional() @IsString() @MaxLength(500) seoDescription?: string | null;
  @IsOptional() @IsIn(CONTENT_STATUSES) status?: ContentPublishStatus;
  @Transform(({ value }) => trim(value)) @IsString() @MinLength(5) @MaxLength(500) reason!: string;
}

export class AdminContentAnnouncementsQueryDto extends AdminContentPageDto {
  @IsOptional()
  @Transform(({ value }) => trimOrUndefined(value))
  @IsString()
  @MaxLength(100)
  search?: string;
  @IsOptional() @IsIn(CONTENT_STATUSES) status?: ContentPublishStatus;
}

export class AdminContentAnnouncementCreateDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @Matches(/^[A-Z0-9_-]{2,64}$/)
  code!: string;
  @Transform(({ value }) => trim(value)) @IsString() @MinLength(2) @MaxLength(160) title!: string;
  @Transform(({ value }) => trim(value)) @IsString() @MinLength(1) @MaxLength(500) message!: string;
  @Transform(({ value }) => trimOrNull(value)) @IsOptional() @IsString() @MaxLength(80) ctaLabel?: string | null;
  @Transform(({ value }) => trimOrNull(value)) @IsOptional() @IsString() @MaxLength(2048) ctaPath?: string | null;
  @IsOptional() @IsIn(CONTENT_STATUSES) status: ContentPublishStatus = ContentPublishStatus.DRAFT;
  @IsDateString() startsAt!: string;
  @IsOptional() @IsDateString() endsAt?: string | null;
  @IsOptional() @Type(() => Number) @IsInt() sortOrder = 0;
  @Transform(({ value }) => trim(value)) @IsString() @MinLength(5) @MaxLength(500) reason!: string;
}

export class AdminContentAnnouncementUpdateDto {
  @IsDateString() expectedUpdatedAt!: string;
  @Transform(({ value }) => trim(value)) @IsOptional() @IsString() @MinLength(2) @MaxLength(160) title?: string;
  @Transform(({ value }) => trim(value)) @IsOptional() @IsString() @MinLength(1) @MaxLength(500) message?: string;
  @Transform(({ value }) => trimOrNull(value)) @IsOptional() @IsString() @MaxLength(80) ctaLabel?: string | null;
  @Transform(({ value }) => trimOrNull(value)) @IsOptional() @IsString() @MaxLength(2048) ctaPath?: string | null;
  @IsOptional() @IsIn(CONTENT_STATUSES) status?: ContentPublishStatus;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string | null;
  @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
  @Transform(({ value }) => trim(value)) @IsString() @MinLength(5) @MaxLength(500) reason!: string;
}
