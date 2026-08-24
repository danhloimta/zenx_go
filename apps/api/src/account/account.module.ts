import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OtpModule } from '../otp/otp.module';
import { SocialModule } from '../social/social.module';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

@Module({ imports: [AuthModule, OtpModule, SocialModule], controllers: [AccountController], providers: [AccountService] })
export class AccountModule {}
