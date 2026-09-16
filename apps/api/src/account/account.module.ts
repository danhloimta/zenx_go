import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthSettingsModule } from '../auth-settings/auth-settings.module';
import { OtpModule } from '../otp/otp.module';
import { SocialModule } from '../social/social.module';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { SensitiveProfileCrypto, SensitiveProfileService } from './sensitive-profile.service';

@Module({
  imports: [AuthModule, AuthSettingsModule, OtpModule, SocialModule],
  controllers: [AccountController],
  providers: [AccountService, SensitiveProfileService, SensitiveProfileCrypto],
  exports: [SensitiveProfileCrypto],
})
export class AccountModule {}
