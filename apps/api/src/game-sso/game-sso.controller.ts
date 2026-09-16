import { Body, Controller, Get, Headers, Post, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ACCESS_COOKIE } from '../common/constants';
import { SkipOriginGuard } from '../common/origin-guard.decorator';
import { DomainError, ErrorCode } from '../common/errors';
import { AuthService } from '../auth/auth.service';
import { DomainPolicyService } from '../common/domain-policy.service';
import { GameSsoExchangeDto } from './game-sso.dto';
import { GameSsoService } from './game-sso.service';

@Controller('game-sso')
export class GameSsoController {
  constructor(private readonly sso: GameSsoService, private readonly auth: AuthService, private readonly domains: DomainPolicyService) {}

  @Get('authorize')
  async authorize(@Query('client_id') clientId: string, @Query('redirect_uri') redirectUri: string, @Query('state') state: string | undefined, @Req() request: Request, @Res() response: Response) {
    if (!clientId || !redirectUri || !state || state.length > 512) throw new DomainError(ErrorCode.GAME_SSO_CLIENT_INVALID, 'Invalid authorization request', 400);
    await this.sso.validateAuthorizeRequest(clientId, redirectUri);
    let access: { sub: string };
    try { access = await this.auth.verifyAccessToken(request.cookies?.[ACCESS_COOKIE]); }
    catch {
      const returnTo = new URL(request.originalUrl, this.domains.webOrigin).toString();
      const login = new URL(this.domains.portalUrl('/auth/login'));
      login.searchParams.set('returnTo', returnTo);
      return response.redirect(login.toString());
    }
    const code = await this.sso.authorize(access.sub, clientId, redirectUri);
    const target = new URL(redirectUri);
    target.searchParams.set('code', code);
    target.searchParams.set('state', state);
    return response.redirect(target.toString());
  }

  @SkipOriginGuard()
  @Post('exchange')
  exchange(@Headers('authorization') authorization: string | undefined, @Body() dto: GameSsoExchangeDto) {
    return this.sso.exchange(authorization, dto.code, dto.redirect_uri);
  }
}
