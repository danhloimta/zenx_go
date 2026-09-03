import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SocialProvider } from '../common/domain';
import { DomainError, ErrorCode } from '../common/errors';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { AccountService } from './account.service';
import {
  ChangeEmailDto,
  ChangePasswordDto,
  ChangePhoneDto,
  CompleteProfileDto,
  SensitiveProfileChallengeDto,
  SensitiveProfileOtpVerifyDto,
  SensitiveProfileRevealDto,
  SensitiveProfileUpdateDto,
  UpdateAccountDto,
} from './dto';
import { SocialService } from '../social/social.service';
import { SensitiveProfileService } from './sensitive-profile.service';
import { AllowPasswordChangeRequired } from '../common/password-change-required.decorator';

@Controller('account')
@UseGuards(AuthGuard)
export class AccountController {
  constructor(
    private readonly account: AccountService,
    private readonly social: SocialService,
    private readonly sensitiveProfile: SensitiveProfileService,
  ) {}

  @Get('me')
  @AllowPasswordChangeRequired()
  me(@Req() request: AuthenticatedRequest) {
    return this.account.getMe(request.user.sub);
  }
  @Patch('me') update(@Req() request: AuthenticatedRequest, @Body() dto: UpdateAccountDto) {
    return this.account.updateMe(request.user.sub, dto);
  }
  @Post('complete-profile') completeProfile(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CompleteProfileDto,
  ) {
    return this.account.completeProfile(request.user.sub, dto);
  }
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }))
  uploadAvatar(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; size?: number } | undefined,
  ) {
    return this.account.uploadAvatar(request.user.sub, file);
  }
  @Post('change-password')
  @AllowPasswordChangeRequired()
  changePassword(@Req() request: AuthenticatedRequest, @Body() dto: ChangePasswordDto) {
    return this.account.changePassword(request.user.sub, dto);
  }
  @Post('change-email') changeEmail(
    @Req() request: AuthenticatedRequest,
    @Body() dto: ChangeEmailDto,
  ) {
    return this.account.changeEmail(request.user.sub, dto);
  }
  @Post('change-phone') changePhone(
    @Req() request: AuthenticatedRequest,
    @Body() dto: ChangePhoneDto,
  ) {
    return this.account.changePhone(request.user.sub, dto);
  }

  @Get('sensitive-profile') sensitiveSummary(@Req() request: AuthenticatedRequest) {
    return this.sensitiveProfile.summary(request.user.sub);
  }
  @Get('sensitive-profile/questions') sensitiveQuestions() {
    return this.sensitiveProfile.questions();
  }
  @Post('sensitive-profile/otp') sensitiveOtp(@Req() request: AuthenticatedRequest) {
    return this.sensitiveProfile.sendOtp(request.user.sub);
  }
  @Post('sensitive-profile/otp/verify') sensitiveOtpVerify(
    @Req() request: AuthenticatedRequest,
    @Body() dto: SensitiveProfileOtpVerifyDto,
  ) {
    return this.sensitiveProfile.verifyOtp(request.user.sub, dto);
  }
  @Post('sensitive-profile/challenge') sensitiveChallenge(
    @Req() request: AuthenticatedRequest,
    @Body() dto: SensitiveProfileChallengeDto,
  ) {
    return this.sensitiveProfile.challenge(request.user.sub, dto);
  }
  @Post('sensitive-profile/reveal') sensitiveReveal(
    @Req() request: AuthenticatedRequest,
    @Body() dto: SensitiveProfileRevealDto,
  ) {
    return this.sensitiveProfile.reveal(request.user.sub, dto.accessToken);
  }
  @Patch('sensitive-profile') sensitiveUpdate(
    @Req() request: AuthenticatedRequest,
    @Body() dto: SensitiveProfileUpdateDto,
  ) {
    return this.sensitiveProfile.update(request.user.sub, dto);
  }

  @Post('social/:provider/link') link(
    @Req() request: AuthenticatedRequest,
    @Param('provider') provider: string,
  ) {
    return this.social.link(request.user.sub, this.parseSocialProvider(provider));
  }
  @Delete('social/:provider') unlink(
    @Req() request: AuthenticatedRequest,
    @Param('provider') provider: string,
  ) {
    return this.social.unlink(request.user.sub, this.parseSocialProvider(provider));
  }

  private parseSocialProvider(provider: string): SocialProvider {
    const normalized = provider.toUpperCase();
    if (!Object.values(SocialProvider).includes(normalized as SocialProvider)) {
      throw new DomainError(ErrorCode.INVALID_SOCIAL_PROVIDER, 'Social provider is invalid', 400);
    }
    return normalized as SocialProvider;
  }
}
