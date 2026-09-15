import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { OtpModule } from '../otp/otp.module';
import { SocialModule } from '../social/social.module';
import { AuthSettingsModule } from '../auth-settings/auth-settings.module';

@Module({
  imports: [OtpModule, SocialModule, AuthSettingsModule, JwtModule.registerAsync({ inject: [ConfigService], useFactory: (config: ConfigService) => ({ secret: config.getOrThrow('jwtAccessSecret') }) })],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard, JwtModule],
})
export class AuthModule {}
