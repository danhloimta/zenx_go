import { Gender, OtpChannel, SecurityQuestionCode, SensitiveChallengeMethod } from '../common/domain';
import { IsDateString, IsEmail, IsEnum, IsIn, IsOptional, IsString, IsUrl, Matches, MaxLength, MinLength, ValidateIf, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

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

export class SensitiveIdentityDto {
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/\s/g, '') : value)
  @IsString() @Matches(/^\d{12}$/, { message: 'Citizen ID must contain exactly 12 digits' })
  citizenId!: string;

  @IsDateString() issuedAt!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString() @MinLength(1) @MaxLength(160)
  issuedPlace!: string;
}

export class SensitiveSecurityDto {
  @IsString() @Matches(/^\d{6}$/, { message: 'Secret code must contain exactly 6 digits' })
  secretCode!: string;

  @IsString() @Matches(/^\d{6}$/, { message: 'Secret code confirmation must contain exactly 6 digits' })
  secretCodeConfirmation!: string;

  @IsEnum(SecurityQuestionCode)
  questionCode!: SecurityQuestionCode;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString() @MinLength(3) @MaxLength(100)
  answer!: string;
}

export class SensitiveProfileChallengeDto {
  @IsEnum(SensitiveChallengeMethod)
  method!: SensitiveChallengeMethod;

  @IsString() @MinLength(1) @MaxLength(120)
  value!: string;
}

export class SensitiveProfileOtpVerifyDto {
  @IsIn([OtpChannel.SMS, OtpChannel.EMAIL])
  channel!: OtpChannel;

  @IsString() @Matches(/^\d{6}$/)
  code!: string;
}

export class SensitiveProfileUpdateDto {
  @IsString() @MinLength(20) @MaxLength(4096)
  accessToken!: string;

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @ValidateNested()
  @Type(() => SensitiveIdentityDto)
  identity?: SensitiveIdentityDto | null;

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @ValidateNested()
  @Type(() => SensitiveSecurityDto)
  security?: SensitiveSecurityDto | null;
}

export class SensitiveProfileRevealDto {
  @IsString() @MinLength(20) @MaxLength(4096)
  accessToken!: string;
}
