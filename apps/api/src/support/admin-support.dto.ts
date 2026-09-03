import {
  SupportMessageVisibility,
  SupportTicketPriority,
  SupportTicketStatus,
} from '../common/domain';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
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
import { CreateSupportMessageDto } from './dto';

function trim(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

function emptyToUndefined(value: unknown) {
  const normalized = trim(value);
  return normalized === '' ? undefined : normalized;
}

function emptyToNull(value: unknown) {
  const normalized = trim(value);
  return normalized === '' ? null : normalized;
}

export class AdminCreateSupportMessageDto extends CreateSupportMessageDto {
  @IsEnum(SupportMessageVisibility)
  visibility: SupportMessageVisibility = SupportMessageVisibility.PUBLIC;

  @IsDateString()
  expectedUpdatedAt!: string;
}

export class AdminSupportTicketsQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @IsIn([10, 20, 50]) pageSize = 20;
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(100)
  search?: string;
  @IsOptional() @IsEnum(SupportTicketStatus) status?: SupportTicketStatus;
  @IsOptional() @IsEnum(SupportTicketPriority) priority?: SupportTicketPriority;
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsIn(['ME', 'UNASSIGNED'])
  assignee?: 'ME' | 'UNASSIGNED';
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  unreadOnly = false;
}

export class AdminSupportTicketClaimDto {
  @IsDateString() expectedUpdatedAt!: string;
  @Transform(({ value }) => trim(value)) @IsString() @MinLength(5) @MaxLength(500) reason!: string;
}

export class AdminSupportTicketUpdateDto {
  @IsDateString() expectedUpdatedAt!: string;
  @IsOptional() @IsEnum(SupportTicketStatus) status?: SupportTicketStatus;
  @IsOptional() @IsEnum(SupportTicketPriority) priority?: SupportTicketPriority;
  @IsOptional() @Transform(({ value }) => emptyToNull(value)) @IsUUID() assigneeUserId?:
    string | null;
  @Transform(({ value }) => trim(value)) @IsString() @MinLength(5) @MaxLength(500) reason!: string;
}

export class AdminSupportFaqQueryDto {
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsIn(['ACTIVE', 'INACTIVE']) status?: 'ACTIVE' | 'INACTIVE';
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(100)
  search?: string;
}

export class AdminSupportCategoryCreateDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @Matches(/^[A-Z0-9_]{2,32}$/)
  code!: string;
  @Transform(({ value }) => trim(value)) @IsString() @MinLength(2) @MaxLength(80) name!: string;
  @IsOptional() @IsIn(['ACTIVE', 'INACTIVE']) status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';
  @IsOptional() @Type(() => Number) @IsInt() sortOrder = 0;
  @Transform(({ value }) => trim(value)) @IsString() @MinLength(5) @MaxLength(500) reason!: string;
}

export class AdminSupportCategoryUpdateDto {
  @IsDateString() expectedUpdatedAt!: string;
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;
  @IsOptional() @IsIn(['ACTIVE', 'INACTIVE']) status?: 'ACTIVE' | 'INACTIVE';
  @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
  @Transform(({ value }) => trim(value)) @IsString() @MinLength(5) @MaxLength(500) reason!: string;
}

export class AdminSupportFaqCreateDto {
  @IsUUID() categoryId!: string;
  @Transform(({ value }) => trim(value))
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  question!: string;
  @Transform(({ value }) => (typeof value === 'string' ? value : value))
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  answer!: string;
  @IsOptional() @IsIn(['ACTIVE', 'INACTIVE']) status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';
  @IsOptional() @Type(() => Number) @IsInt() sortOrder = 0;
  @Transform(({ value }) => trim(value)) @IsString() @MinLength(5) @MaxLength(500) reason!: string;
}

export class AdminSupportFaqUpdateDto {
  @IsDateString() expectedUpdatedAt!: string;
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  question?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(4000) answer?: string;
  @IsOptional() @IsIn(['ACTIVE', 'INACTIVE']) status?: 'ACTIVE' | 'INACTIVE';
  @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
  @Transform(({ value }) => trim(value)) @IsString() @MinLength(5) @MaxLength(500) reason!: string;
}
