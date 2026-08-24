import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { SocialProvider } from '../common/domain';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { AccountService } from './account.service';
import { ChangeEmailDto, ChangePasswordDto, ChangePhoneDto, UpdateAccountDto } from './dto';
import { SocialService } from '../social/social.service';

@Controller('account')
@UseGuards(AuthGuard)
export class AccountController {
  constructor(private readonly account: AccountService, private readonly social: SocialService) {}

  @Get('me') me(@Req() request: AuthenticatedRequest) { return this.account.getMe(request.user.sub); }
  @Patch('me') update(@Req() request: AuthenticatedRequest, @Body() dto: UpdateAccountDto) { return this.account.updateMe(request.user.sub, dto); }
  @Post('change-password') changePassword(@Req() request: AuthenticatedRequest, @Body() dto: ChangePasswordDto) { return this.account.changePassword(request.user.sub, dto); }
  @Post('change-email') changeEmail(@Req() request: AuthenticatedRequest, @Body() dto: ChangeEmailDto) { return this.account.changeEmail(request.user.sub, dto); }
  @Post('change-phone') changePhone(@Req() request: AuthenticatedRequest, @Body() dto: ChangePhoneDto) { return this.account.changePhone(request.user.sub, dto); }

  @Post('social/:provider/link') link(@Req() request: AuthenticatedRequest, @Param('provider') provider: string) { return this.social.link(request.user.sub, provider.toUpperCase() as SocialProvider); }
  @Delete('social/:provider') unlink(@Req() request: AuthenticatedRequest, @Param('provider') provider: string) { return this.social.unlink(request.user.sub, provider.toUpperCase() as SocialProvider); }
}
