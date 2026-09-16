import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

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
  @IsOptional() @IsIn(['ACTIVE', 'BLOCKED']) status?: 'ACTIVE' | 'BLOCKED';
}

export class GamePlayerStatusDto {
  @IsIn(['ACTIVE', 'BLOCKED']) status!: 'ACTIVE' | 'BLOCKED';
  @IsDateString() expectedUpdatedAt!: string;
  @Transform(({ value }) => trim(value)) @IsString() @MinLength(3) @MaxLength(500) reason!: string;
}

export class GameAuditQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @IsIn([20, 50]) pageSize = 20;
  @IsOptional() @Transform(({ value }) => trim(value)) @IsString() @MaxLength(64) action?: string;
  @IsOptional() @Transform(({ value }) => trim(value)) @IsString() @MaxLength(64) actorUserId?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
}
