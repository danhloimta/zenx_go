import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateIf } from 'class-validator';

const trim = (value: unknown) => typeof value === 'string' ? value.trim() : value;

export class GameAdminsUpdateDto {
  @IsArray() @IsString({ each: true }) roleIds!: string[];
  @Transform(({ value }) => trim(value)) @IsString() @MinLength(3) @MaxLength(500) reason!: string;
}

export class GameSsoClientUpdateDto {
  @Transform(({ value }) => trim(value)) @IsString() @MaxLength(2048) redirectUri!: string;
  @IsBoolean() isActive!: boolean;
}

export class GamePlayersQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
  @IsOptional() @Transform(({ value }) => trim(value)) @IsString() @MaxLength(100) search?: string;
  @IsOptional() @IsIn(['ACTIVE', 'TEMPORARILY_BLOCKED', 'PERMANENTLY_BANNED', 'BLOCKED']) status?: 'ACTIVE' | 'TEMPORARILY_BLOCKED' | 'PERMANENTLY_BANNED' | 'BLOCKED';
}

export class GamePlayerStatusDto {
  @IsIn(['ACTIVE', 'BLOCKED']) status!: 'ACTIVE' | 'BLOCKED';
  @IsDateString() expectedUpdatedAt!: string;
  @Transform(({ value }) => trim(value)) @IsString() @MinLength(3) @MaxLength(500) reason!: string;
}

export class GamePlayerTemporaryLockDto {
  @IsDateString() expiresAt!: string;
  @IsDateString() expectedUpdatedAt!: string;
  @Transform(({ value }) => trim(value)) @IsString() @MinLength(3) @MaxLength(500) reason!: string;
}

export class GamePlayerPermanentBanDto {
  @IsDateString() expectedUpdatedAt!: string;
  @Transform(({ value }) => trim(value)) @IsString() @MinLength(3) @MaxLength(500) reason!: string;
}

export class GamePlayerReleaseRestrictionDto {
  @IsDateString() expectedUpdatedAt!: string;
  @Transform(({ value }) => trim(value)) @IsString() @MinLength(3) @MaxLength(500) reason!: string;
}

export class GamePlayerChatRestrictionDto {
  @IsBoolean() locked!: boolean;
  @IsDateString() expectedUpdatedAt!: string;
  @Transform(({ value }) => trim(value)) @IsString() @MinLength(3) @MaxLength(500) reason!: string;
}

export class GamePlayerSupportNoteDto {
  @Transform(({ value }) => {
    const normalized = trim(value);
    return normalized === '' ? null : normalized;
  })
  @ValidateIf((_object, value) => value !== null) @IsString() @MaxLength(2000) note!: string | null;
  @IsDateString() expectedUpdatedAt!: string;
}

export class GamePlayerActivityQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
}

export class GameMaintenanceUpdateDto {
  @IsBoolean() enabled!: boolean;
  @Transform(({ value }) => trim(value))
  @ValidateIf((object) => object.enabled === true)
  @IsString() @MinLength(3) @MaxLength(500) message!: string | null;
  @ValidateIf((_object, value) => value !== null && value !== undefined)
  @IsDateString() expectedEndsAt!: string | null;
  @IsDateString() expectedUpdatedAt!: string;
  @Transform(({ value }) => trim(value)) @IsString() @MinLength(3) @MaxLength(500) reason!: string;
}

export class GameAuditQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @IsIn([10, 20, 50]) pageSize = 20;
  @IsOptional() @Transform(({ value }) => trim(value)) @IsString() @MaxLength(64) action?: string;
  @IsOptional() @Transform(({ value }) => trim(value)) @IsString() @MaxLength(64) actorUserId?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
}

export class GameSupportTicketsQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
  @IsOptional() @Transform(({ value }) => trim(value)) @IsString() @MaxLength(100) search?: string;
  @IsOptional() @Transform(({ value }) => trim(value)) @IsString() @IsIn(['NEW', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED']) status?: string;
  @IsOptional() @Transform(({ value }) => trim(value)) @IsString() @IsIn(['URGENT', 'HIGH', 'NORMAL', 'LOW']) priority?: string;
}
