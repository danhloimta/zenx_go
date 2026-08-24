import { Module } from '@nestjs/common';
import { OtpController } from './otp.controller';
import { MockMailProvider, MockOtpProvider, OtpService } from './otp.service';

@Module({ controllers: [OtpController], providers: [OtpService, MockOtpProvider, MockMailProvider], exports: [OtpService] })
export class OtpModule {}
