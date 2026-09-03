import { Body, Controller, Post } from '@nestjs/common';
import { OtpPurpose } from '../common/domain';
import { DomainError, ErrorCode } from '../common/errors';
import { OtpService } from './otp.service';
import { SendOtpDto, VerifyOtpDto } from '../auth/dto';

@Controller('otp')
export class OtpController {
  constructor(private readonly otp: OtpService) {}

  @Post('send')
  send(@Body() dto: SendOtpDto) {
    this.assertPublicPurpose(dto.purpose as OtpPurpose);
    return this.otp.send({ channel: dto.channel, purpose: dto.purpose as OtpPurpose, destination: dto.destination });
  }

  @Post('verify')
  verify(@Body() dto: VerifyOtpDto) {
    this.assertPublicPurpose(dto.purpose as OtpPurpose);
    return this.otp.verify({ channel: dto.channel, purpose: dto.purpose as OtpPurpose, destination: dto.destination, code: dto.code });
  }

  private assertPublicPurpose(purpose: OtpPurpose) {
    if (purpose === OtpPurpose.MANAGE_SENSITIVE_PROFILE) {
      throw new DomainError(ErrorCode.INVALID_SENSITIVE_PROFILE, 'Sensitive profile OTP must be requested from the account endpoint', 400);
    }
  }
}
