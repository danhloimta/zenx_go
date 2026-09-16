import { Exclude } from 'class-transformer';
import { IsBoolean, IsDateString, IsDefined, ValidateIf } from 'class-validator';

export class AdminAuthSettingsUpdateDto {
  @IsDateString()
  expectedUpdatedAt!: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  googleLoginRegistrationEnabled?: boolean;

  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  facebookLoginRegistrationEnabled?: boolean;

  @Exclude()
  @ValidateIf(
    (value: AdminAuthSettingsUpdateDto) =>
      value.googleLoginRegistrationEnabled === undefined &&
      value.facebookLoginRegistrationEnabled === undefined,
  )
  @IsDefined()
  private readonly providerSettingRequired?: never;
}
