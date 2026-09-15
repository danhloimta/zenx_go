import { IsBoolean, IsDateString, IsDefined, IsOptional, ValidateIf } from 'class-validator';

export class AdminAuthSettingsUpdateDto {
  @IsDateString()
  expectedUpdatedAt!: string;

  @IsOptional()
  @IsBoolean()
  googleLoginRegistrationEnabled?: boolean;

  @ValidateIf(
    (value: AdminAuthSettingsUpdateDto) =>
      value.googleLoginRegistrationEnabled === undefined,
  )
  @IsDefined()
  @IsBoolean()
  facebookLoginRegistrationEnabled?: boolean;
}
