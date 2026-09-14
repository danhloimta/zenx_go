import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateRoleDto {
  @IsString() @Matches(/^[A-Z][A-Z0-9_]{2,31}$/) code!: string;
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsString() @MinLength(3) @MaxLength(500) reason!: string;
}

export class UpdateRoleDto {
  @IsDateString() expectedUpdatedAt!: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) name?: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string | null;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsString() @MinLength(3) @MaxLength(500) reason!: string;
  @IsOptional() @IsArray() @IsString({ each: true }) permissionIds?: string[];
}

export class ReplaceRolePermissionsDto {
  @IsDateString() expectedUpdatedAt!: string;
  @IsArray() @IsString({ each: true }) permissionIds!: string[];
  @IsString() @MinLength(3) @MaxLength(500) reason!: string;
}

export class DeleteRoleDto {
  @IsDateString() expectedUpdatedAt!: string;
  @IsString() @MinLength(3) @MaxLength(500) reason!: string;
}

export class RolesQueryDto {
  @IsOptional() @Type(() => Boolean) @IsBoolean() active?: boolean;
}
