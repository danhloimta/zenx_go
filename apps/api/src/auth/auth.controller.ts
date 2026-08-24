import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { ACCESS_COOKIE, REFRESH_COOKIE, ACCESS_TTL_SECONDS, REFRESH_TTL_SECONDS } from '../common/constants';
import { AuthGuard, AuthenticatedRequest } from './auth.guard';
import { AuthService } from './auth.service';
import { ForgotPasswordDto, LoginDto, RefreshDto, RegisterDto, ResetPasswordDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService) {}

  @Post('register')
  register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    return this.auth.register(dto).then((tokens) => this.withCookies(response, tokens));
  }

  @Post('login')
  login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    return this.auth.login(dto).then((tokens) => this.withCookies(response, tokens));
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    return this.auth.refresh(dto.refreshToken ?? request.cookies?.[REFRESH_COOKIE]).then((tokens) => this.withCookies(response, tokens));
  }

  @Post('logout')
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout(request.cookies?.[REFRESH_COOKIE]);
    response.clearCookie(ACCESS_COOKIE, this.cookieOptions());
    response.clearCookie(REFRESH_COOKIE, { ...this.cookieOptions(), path: '/api/v1/auth' });
    return { loggedOut: true };
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) { return this.auth.forgotPassword(dto.email); }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) { return this.auth.resetPassword(dto); }

  @UseGuards(AuthGuard)
  @Get('me')
  me(@Req() request: AuthenticatedRequest) { return { userId: request.user.sub, username: request.user.username }; }

  @Get('google')
  google() { return { data: { provider: 'GOOGLE', status: 'adapter_pending' } }; }

  @Get('google/callback')
  googleCallback() { return { data: { provider: 'GOOGLE', status: 'adapter_pending' } }; }

  @Get('facebook')
  facebook() { return { data: { provider: 'FACEBOOK', status: 'adapter_pending' } }; }

  @Get('facebook/callback')
  facebookCallback() { return { data: { provider: 'FACEBOOK', status: 'adapter_pending' } }; }

  private withCookies(response: Response, tokens: { accessToken: string; refreshToken: string; user: unknown }) {
    response.cookie(ACCESS_COOKIE, tokens.accessToken, { ...this.cookieOptions(), maxAge: ACCESS_TTL_SECONDS * 1000 });
    response.cookie(REFRESH_COOKIE, tokens.refreshToken, { ...this.cookieOptions(), maxAge: REFRESH_TTL_SECONDS * 1000, path: '/api/v1/auth' });
    return { user: tokens.user };
  }

  private cookieOptions() {
    return { httpOnly: true, secure: this.config.get<boolean>('cookieSecure') ?? false, sameSite: 'lax' as const, domain: this.config.get<string>('cookieDomain') };
  }
}
