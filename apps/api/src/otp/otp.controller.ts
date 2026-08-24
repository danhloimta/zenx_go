import { Body, Controller, Post } from '@nestjs/common';
import { OtpPurpose } from '../common/domain';
import { OtpService } from './otp.service';
import { SendOtpDto, VerifyOtpDto } from '../auth/dto';

@Controller('otp')
export class OtpController {
  constructor(private readonly otp: OtpService) {}

  @Post('send')
  send(@Body() dto: SendOtpDto) { return this.otp.send({ channel: dto.channel, purpose: dto.purpose as OtpPurpose, destination: dto.destination }); }

  @Post('verify')
  verify(@Body() dto: VerifyOtpDto) { return this.otp.verify({ channel: dto.channel, purpose: dto.purpose as OtpPurpose, destination: dto.destination, code: dto.code }); }
}
