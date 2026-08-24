import { Gender } from '../common/domain';
import { IsDateString, IsEmail, IsEnum, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class UpdateAccountDto {
  @IsOptional() @IsString() @MinLength(1) fullName?: string;
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @IsOptional() @IsEnum(Gender) gender?: Gender;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsUrl() avatarUrl?: string;
}

export class ChangePasswordDto {
  @IsString() currentPassword!: string;
  @IsString() @MinLength(8) newPassword!: string;
}

export class ChangeEmailDto {
  @IsString() verificationToken!: string;
  @IsEmail() newEmail!: string;
}

export class ChangePhoneDto {
  @IsString() verificationToken!: string;
  @IsString() newPhone!: string;
}
