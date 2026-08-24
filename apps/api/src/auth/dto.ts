import { Gender, OtpChannel, OtpPurpose } from '../common/domain';
import { IsBoolean, IsDateString, IsEmail, IsEnum, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString() @MinLength(3) username!: string;
  @IsEmail() email!: string;
  @IsString() @Matches(/^\+?[0-9\s().-]{8,20}$/) phone!: string;
  @IsString() @MinLength(8) password!: string;
  @IsString() @MinLength(1) fullName!: string;
  @IsString() verificationToken!: string;
  @IsDateString() dateOfBirth!: string;
  @IsEnum(Gender) gender!: Gender;
  @IsString() city!: string;
  @IsBoolean() acceptTerms!: boolean;
  @IsBoolean() acceptPrivacy!: boolean;
}

export class LoginDto {
  @IsString() username!: string;
  @IsString() password!: string;
}

export class ResetPasswordDto {
  @IsEmail() email!: string;
  @IsString() verificationToken!: string;
  @IsString() @MinLength(8) newPassword!: string;
}

export class ForgotPasswordDto {
  @IsEmail() email!: string;
}

export class SendOtpDto {
  @IsEnum(OtpChannel) channel!: OtpChannel;
  @IsEnum(OtpPurpose) purpose!: OtpPurpose;
  @IsString() destination!: string;
}

export class VerifyOtpDto {
  @IsEnum(OtpChannel) channel!: OtpChannel;
  @IsEnum(OtpPurpose) purpose!: OtpPurpose;
  @IsString() destination!: string;
  @IsString() @Matches(/^\d{6}$/) code!: string;
}

export class RefreshDto {
  @IsOptional() @IsString() refreshToken?: string;
}
