import { AccountStatus, AdminAuditAction, Gender } from '../common/domain';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

function trimOrUndefined(value: unknown) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function trimOrNull(value: unknown) {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export class AdminUsersQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @IsIn([10, 20, 50]) pageSize = 20;
  @IsOptional()
  @Transform(({ value }) => trimOrUndefined(value))
  @IsString()
  @MaxLength(100)
  search?: string;
  @IsOptional() @IsEnum(AccountStatus) status?: AccountStatus;
}

export class AdminAuditLogsQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @IsIn([20, 50, 100]) pageSize = 20;
  @IsOptional() @IsUUID() actorUserId?: string;
  @IsOptional() @IsEnum(AdminAuditAction) action?: AdminAuditAction;
  @IsOptional() @IsUUID() targetId?: string;
  @IsOptional() @Transform(({ value }) => trimOrUndefined(value)) @IsDateString() from?: string;
  @IsOptional() @Transform(({ value }) => trimOrUndefined(value)) @IsDateString() to?: string;
}

export class AdminExpectedUpdateDto {
  @IsDateString() expectedUpdatedAt!: string;
}

export class AdminProfileUpdateDto extends AdminExpectedUpdateDto {
  @IsOptional()
  @Transform(({ value }) => trimOrUndefined(value))
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  username?: string;
  @IsOptional()
  @Transform(({ value }) => trimOrUndefined(value))
  @IsEmail()
  @MaxLength(320)
  email?: string;
  @IsOptional() @Transform(({ value }) => trimOrNull(value)) @IsString() @MaxLength(32) phone?:
    string | null;
  @IsOptional()
  @Transform(({ value }) => trimOrUndefined(value))
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  fullName?: string;
  @IsOptional() @IsDateString() dateOfBirth?: string | null;
  @IsOptional() @IsEnum(Gender) gender?: Gender;
  @IsOptional() @Transform(({ value }) => trimOrNull(value)) @IsString() @MaxLength(120) city?:
    string | null;
  @IsOptional() @Transform(({ value }) => trimOrNull(value)) @IsString() @MaxLength(255) address?:
    string | null;
  @IsOptional() @IsBoolean() emailVerified?: boolean;
  @IsOptional() @IsBoolean() phoneVerified?: boolean;
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason!: string;
}

export class AdminStatusUpdateDto extends AdminExpectedUpdateDto {
  @IsIn([AccountStatus.ACTIVE, AccountStatus.SUSPENDED]) status!:
    typeof AccountStatus.ACTIVE | typeof AccountStatus.SUSPENDED;
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason!: string;
}

export class AdminResetPasswordDto extends AdminExpectedUpdateDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/, {
    message:
      'Password must contain upper- and lowercase letters, a number, and a special character',
  })
  temporaryPassword!: string;
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  temporaryPasswordConfirmation!: string;
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason!: string;
}

export class AdminReasonDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason!: string;
}

export class AdminSensitiveRevealDto extends AdminReasonDto {}
