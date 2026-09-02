import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { ACCESS_COOKIE, REFRESH_COOKIE, ACCESS_TTL_SECONDS, REFRESH_TTL_SECONDS } from '../common/constants';
import { AuthGuard, AuthenticatedRequest } from './auth.guard';
import { AuthService } from './auth.service';
import { ForgotPasswordDto, LoginDto, RefreshDto, RegisterDto, ResetPasswordDto } from './dto';
import { SocialProvider } from '../common/domain';
import { DomainError } from '../common/errors';
import { OAuthMode, SocialService } from '../social/social.service';
import { DomainPolicyService } from '../common/domain-policy.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService, private readonly social: SocialService, private readonly domainPolicy: DomainPolicyService) {}

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
    response.clearCookie(ACCESS_COOKIE, this.accessCookieOptions());
    response.clearCookie(REFRESH_COOKIE, this.refreshCookieOptions());
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
  google(@Req() request: Request, @Res() response: Response, @Query('mode') mode?: string, @Query('returnTo') returnTo?: string) {
    return this.startOAuth('GOOGLE', request, response, mode, returnTo);
  }

  @Get('google/callback')
  googleCallback(@Req() request: Request, @Res() response: Response, @Query('code') code?: string, @Query('state') state?: string, @Query('error') error?: string) {
    return this.completeOAuth('GOOGLE', request, response, code, state, error);
  }

  @Get('facebook')
  facebook(@Req() request: Request, @Res() response: Response, @Query('mode') mode?: string, @Query('returnTo') returnTo?: string) {
    return this.startOAuth('FACEBOOK', request, response, mode, returnTo);
  }

  @Get('facebook/callback')
  facebookCallback(@Req() request: Request, @Res() response: Response, @Query('code') code?: string, @Query('state') state?: string, @Query('error') error?: string) {
    return this.completeOAuth('FACEBOOK', request, response, code, state, error);
  }

  private async startOAuth(provider: SocialProvider, request: Request, response: Response, rawMode?: string, rawReturnTo?: string) {
    const mode: OAuthMode = rawMode === 'link' ? 'link' : 'login';
    let returnTo: string | undefined;
    try {
      returnTo = mode === 'login' ? await this.domainPolicy.resolveReturnTo(rawReturnTo) : undefined;
      let userId: string | undefined;
      if (mode === 'link') {
        const access = await this.auth.verifyAccessToken(request.cookies?.[ACCESS_COOKIE]);
        userId = access.sub;
      }
      const authorization = this.social.getAuthorizationUrl(provider, mode, userId, returnTo);
      const stateCookieName = this.social.stateCookieName(provider);
      response.cookie(stateCookieName, this.social.appendState(request.cookies?.[stateCookieName], authorization.state), {
        ...this.oauthStateCookieOptions(),
        maxAge: 10 * 60 * 1000,
        path: `/api/v1/auth/${provider.toLowerCase()}`,
      });
      return response.redirect(authorization.url);
    } catch (error) {
      return this.redirectOAuthError(response, mode, this.errorCode(error), returnTo);
    }
  }

  private async completeOAuth(provider: SocialProvider, request: Request, response: Response, code?: string, state?: string, providerError?: string) {
    const mode: OAuthMode = 'login';
    const stateCookie = this.social.stateCookieName(provider);
    const cookieState = request.cookies?.[stateCookie] as string | undefined;
    let oauthState: ReturnType<SocialService['verifyState']> | undefined;
    let safeReturnTo: string | undefined;
    try {
      oauthState = this.social.verifyState(provider, state, cookieState);
      safeReturnTo = oauthState.mode === 'login' ? await this.domainPolicy.resolveReturnTo(oauthState.returnTo) : undefined;
      const remainingState = this.social.removeState(cookieState, state!);
      if (remainingState) {
        response.cookie(stateCookie, remainingState, {
          ...this.oauthStateCookieOptions(),
          maxAge: 10 * 60 * 1000,
          path: `/api/v1/auth/${provider.toLowerCase()}`,
        });
      } else {
        response.clearCookie(stateCookie, { ...this.oauthStateCookieOptions(), path: `/api/v1/auth/${provider.toLowerCase()}` });
      }
      if (providerError) return this.redirectOAuthError(response, oauthState.mode, 'provider_cancelled', safeReturnTo);
      const profile = await this.social.exchangeCode(provider, code ?? '');
      if (oauthState.mode === 'link') {
        const access = await this.auth.verifyAccessToken(request.cookies?.[ACCESS_COOKIE]);
        if (access.sub !== oauthState.userId) throw new DomainError('INVALID_OAUTH_STATE', 'OAuth session does not belong to the signed-in user', 401);
        await this.social.linkIdentity(oauthState.userId!, provider, profile);
        const target = new URL(this.domainPolicy.portalUrl('/account/social'));
        target.searchParams.set('social', 'linked');
        target.searchParams.set('provider', provider.toLowerCase());
        return response.redirect(target.toString());
      }

      const userId = await this.social.loginIdentity(provider, profile);
      const tokens = await this.auth.loginWithSocial(userId);
      this.withCookies(response, tokens);
      return response.redirect(safeReturnTo ?? this.domainPolicy.portalUrl('/account'));
    } catch (error) {
      return this.redirectOAuthError(response, oauthState?.mode ?? mode, this.errorCode(error), safeReturnTo);
    }
  }

  private redirectOAuthError(response: Response, mode: OAuthMode, code: string, returnTo?: string) {
    if (mode === 'login' && returnTo) {
      const target = new URL(returnTo);
      target.searchParams.set('social_error', code);
      return response.redirect(target.toString());
    }
    const path = mode === 'link' ? '/account/social' : '/auth/login';
    const target = new URL(this.domainPolicy.portalUrl(path));
    target.searchParams.set('social_error', code);
    return response.redirect(target.toString());
  }

  private errorCode(error: unknown) {
    if (error instanceof DomainError) {
      if (error.code === 'SOCIAL_NOT_CONFIGURED') return 'not_configured';
      if (error.code === 'SOCIAL_NOT_LINKED') return 'not_linked';
      if (error.code === 'SOCIAL_ALREADY_LINKED') return 'already_linked';
      if (error.code === 'SOCIAL_LINKED_TO_ANOTHER_ACCOUNT') return 'linked_to_another_account';
      if (error.code === 'CANNOT_UNLINK_LAST_LOGIN_METHOD') return 'last_login_method';
      if (error.code === 'INVALID_OAUTH_STATE') return 'invalid_state';
    }
    return 'oauth_failed';
  }

  private withCookies(response: Response, tokens: { accessToken: string; refreshToken: string; user: unknown; redirectTo?: string }) {
    response.cookie(ACCESS_COOKIE, tokens.accessToken, { ...this.accessCookieOptions(), maxAge: ACCESS_TTL_SECONDS * 1000 });
    response.cookie(REFRESH_COOKIE, tokens.refreshToken, { ...this.refreshCookieOptions(), maxAge: REFRESH_TTL_SECONDS * 1000 });
    return { user: tokens.user, ...(tokens.redirectTo ? { redirectTo: tokens.redirectTo } : {}) };
  }

  private baseCookieOptions(includeDomain = true) {
    return {
      httpOnly: true,
      secure: this.config.get<boolean>('cookieSecure') ?? false,
      sameSite: 'lax' as const,
      ...(includeDomain && this.domainPolicy.sessionCookieDomain ? { domain: this.domainPolicy.sessionCookieDomain } : {}),
    };
  }

  private accessCookieOptions() {
    return { ...this.baseCookieOptions(), path: '/' };
  }

  private refreshCookieOptions() {
    return { ...this.baseCookieOptions(), path: '/api/v1/auth' };
  }

  private oauthStateCookieOptions() {
    return this.baseCookieOptions(false);
  }
}
