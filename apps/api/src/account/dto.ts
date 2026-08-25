import { Gender } from '../common/domain';
import { IsDateString, IsEmail, IsEnum, IsOptional, IsString, IsUrl, Matches, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateAccountDto {
  @IsOptional() @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @MinLength(2) fullName?: string;
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @IsOptional() @IsEnum(Gender) gender?: Gender;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsUrl() avatarUrl?: string;
}

export class CompleteProfileDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @MinLength(2) fullName!: string;
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @IsOptional() @IsEnum(Gender) gender?: Gender;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() address?: string;
}

export class ChangePasswordDto {
  @IsOptional() @IsString() currentPassword?: string;
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/, {
    message: 'New password must contain upper- and lowercase letters, a number, and a special character',
  })
  newPassword!: string;
}

export class ChangeEmailDto {
  @IsString() verificationToken!: string;
  @IsEmail() newEmail!: string;
}

export class ChangePhoneDto {
  @IsString() verificationToken!: string;
  @IsString() @Matches(/^\+?[0-9\s().-]{8,20}$/) newPhone!: string;
}
