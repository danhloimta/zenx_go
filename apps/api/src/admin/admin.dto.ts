import { AccountStatus, AdminRole, Gender } from '../common/domain';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { SensitiveIdentityDto } from '../account/dto';

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
}

export class AdminStatusUpdateDto extends AdminExpectedUpdateDto {
  @IsIn([AccountStatus.ACTIVE, AccountStatus.SUSPENDED, AccountStatus.DELETED]) status!:
    typeof AccountStatus.ACTIVE | typeof AccountStatus.SUSPENDED | typeof AccountStatus.DELETED;
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
}

export class AdminUpdateSensitiveIdentityDto extends AdminExpectedUpdateDto {
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @ValidateNested()
  @Type(() => SensitiveIdentityDto)
  @IsOptional()
  identity?: SensitiveIdentityDto | null;
}

export class AdminRolesUpdateDto extends AdminExpectedUpdateDto {
  @IsArray()
  @IsEnum(AdminRole, { each: true })
  roles!: AdminRole[];
}

