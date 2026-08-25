import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { SocialProvider } from '../common/domain';
import { DomainError, ErrorCode } from '../common/errors';
import { PrismaService } from '../database/prisma.service';

export type OAuthMode = 'login' | 'link';

export type SocialProfile = {
  providerUserId: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  emailVerified?: boolean;
};

type OAuthProviderConfig = {
  clientId?: string;
  clientSecret?: string;
  redirectUri: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string;
};

type OAuthState = {
  provider: SocialProvider;
  mode: OAuthMode;
  userId?: string;
  nonce: string;
  expiresAt: number;
};

const STATE_TTL_SECONDS = 10 * 60;
const PROVIDER_TIMEOUT_MS = 10_000;

@Injectable()
export class SocialService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  getAuthorizationUrl(provider: SocialProvider, mode: OAuthMode, userId?: string) {
    const providerConfig = this.providerConfig(provider);
    if (!providerConfig.clientId || !providerConfig.clientSecret) {
      throw new DomainError(ErrorCode.SOCIAL_NOT_CONFIGURED, 'Social provider is not configured', 503);
    }
    if (mode === 'link' && !userId) {
      throw new DomainError(ErrorCode.INVALID_OAUTH_STATE, 'A signed-in user is required to link a social account', 401);
    }

    const state = this.createState(provider, mode, userId);
    const url = new URL(providerConfig.authorizationUrl);
    url.searchParams.set('client_id', providerConfig.clientId);
    url.searchParams.set('redirect_uri', providerConfig.redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', providerConfig.scope);
    url.searchParams.set('state', state);
    if (provider === 'GOOGLE') {
      url.searchParams.set('access_type', 'online');
      url.searchParams.set('prompt', 'select_account');
    }
    return { url: url.toString(), state };
  }

  verifyState(provider: SocialProvider, state: string | undefined, cookieState: string | undefined) {
    if (!state || !cookieState || !cookieState.split('|').includes(state)) {
      throw new DomainError(ErrorCode.INVALID_OAUTH_STATE, 'OAuth state is invalid or expired', 400);
    }
    const [payload, signature] = state.split('.');
    if (!payload || !signature) throw new DomainError(ErrorCode.INVALID_OAUTH_STATE, 'OAuth state is invalid or expired', 400);

    const expected = this.sign(payload);
    const providedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
      throw new DomainError(ErrorCode.INVALID_OAUTH_STATE, 'OAuth state is invalid or expired', 400);
    }

    let parsed: OAuthState;
    try {
      parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as OAuthState;
    } catch {
      throw new DomainError(ErrorCode.INVALID_OAUTH_STATE, 'OAuth state is invalid or expired', 400);
    }
    if (parsed.provider !== provider || parsed.expiresAt <= Math.floor(Date.now() / 1000) || (parsed.mode === 'link' && !parsed.userId)) {
      throw new DomainError(ErrorCode.INVALID_OAUTH_STATE, 'OAuth state is invalid or expired', 400);
    }
    return parsed;
  }

  async exchangeCode(provider: SocialProvider, code: string) {
    if (!code) throw new DomainError(ErrorCode.SOCIAL_OAUTH_FAILED, 'OAuth authorization code is missing', 400);
    const providerConfig = this.providerConfig(provider);
    if (!providerConfig.clientId || !providerConfig.clientSecret) {
      throw new DomainError(ErrorCode.SOCIAL_NOT_CONFIGURED, 'Social provider is not configured', 503);
    }

    let response: Response;
    try {
      response = await this.fetchWithTimeout(providerConfig.tokenUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
        body: new URLSearchParams({
          client_id: providerConfig.clientId,
          client_secret: providerConfig.clientSecret,
          code,
          redirect_uri: providerConfig.redirectUri,
          grant_type: 'authorization_code',
        }),
      });
    } catch {
      throw new DomainError(ErrorCode.SOCIAL_OAUTH_FAILED, 'Could not contact the social provider', 502);
    }
    if (!response.ok) throw new DomainError(ErrorCode.SOCIAL_OAUTH_FAILED, 'Social provider rejected the authorization code', 400);

    const token = await this.readJson(response);
    if (typeof token.access_token !== 'string') throw new DomainError(ErrorCode.SOCIAL_OAUTH_FAILED, 'Social provider returned no access token', 400);
    return this.fetchProfile(provider, token.access_token);
  }

  async linkIdentity(userId: string, provider: SocialProvider, profile: SocialProfile) {
    const existing = await this.prisma.socialIdentity.findUnique({
      where: { provider_providerUserId: { provider, providerUserId: profile.providerUserId } },
    });
    if (existing?.userId === userId) throw new DomainError(ErrorCode.SOCIAL_ALREADY_LINKED, 'Social provider is already linked', 409);
    if (existing) throw new DomainError(ErrorCode.SOCIAL_LINKED_TO_ANOTHER_ACCOUNT, 'Social account is linked to another account', 409);

    try {
      return await this.prisma.socialIdentity.create({
        data: {
          userId,
          provider,
          providerUserId: profile.providerUserId,
          emailAtLinkTime: profile.email,
        },
      });
    } catch (error) {
      const duplicate = await this.prisma.socialIdentity.findUnique({
        where: { provider_providerUserId: { provider, providerUserId: profile.providerUserId } },
      });
      if (duplicate && duplicate.userId !== userId) {
        throw new DomainError(ErrorCode.SOCIAL_LINKED_TO_ANOTHER_ACCOUNT, 'Social account is linked to another account', 409);
      }
      throw error;
    }
  }

  async loginIdentity(provider: SocialProvider, profile: SocialProfile) {
    const identity = await this.prisma.socialIdentity.findUnique({ where: { provider_providerUserId: { provider, providerUserId: profile.providerUserId } } });
    if (!identity) throw new DomainError(ErrorCode.SOCIAL_NOT_LINKED, 'Social account is not linked to a ZENX GO account', 404);
    await this.prisma.socialIdentity.update({ where: { id: identity.id }, data: { lastLoginAt: new Date() } });
    return identity.userId;
  }

  async link(userId: string, provider: SocialProvider) {
    throw new DomainError(ErrorCode.SOCIAL_OAUTH_REQUIRED, `Start the ${provider.toLowerCase()} OAuth flow before linking an identity`, 400);
  }

  async unlink(userId: string, provider: SocialProvider) {
    const identity = await this.prisma.socialIdentity.findFirst({ where: { userId, provider }, include: { user: { select: { passwordHash: true } } } });
    if (!identity) return { unlinked: true };
    const otherSocial = await this.prisma.socialIdentity.count({ where: { userId, NOT: { provider } } });
    if (!identity.user.passwordHash && otherSocial === 0) throw new DomainError(ErrorCode.CANNOT_UNLINK_LAST_LOGIN_METHOD, 'Create a password before unlinking the last social login', 409);
    await this.prisma.socialIdentity.delete({ where: { id: identity.id } });
    return { unlinked: true };
  }

  stateCookieName(provider: SocialProvider) {
    return `zenx_oauth_state_${provider.toLowerCase()}`;
  }

  appendState(cookieState: string | undefined, state: string) {
    return [...(cookieState?.split('|').filter(Boolean) ?? []), state].slice(-3).join('|');
  }

  removeState(cookieState: string | undefined, state: string) {
    const remaining = cookieState?.split('|').filter((item) => item && item !== state) ?? [];
    return remaining.length > 0 ? remaining.join('|') : undefined;
  }

  private createState(provider: SocialProvider, mode: OAuthMode, userId?: string) {
    const payload = Buffer.from(JSON.stringify({
      provider,
      mode,
      ...(userId ? { userId } : {}),
      nonce: randomBytes(16).toString('hex'),
      expiresAt: Math.floor(Date.now() / 1000) + STATE_TTL_SECONDS,
    } satisfies OAuthState)).toString('base64url');
    return `${payload}.${this.sign(payload)}`;
  }

  private sign(payload: string) {
    const secret = this.config.get<string>('oauthStateSecret') ?? this.config.getOrThrow<string>('jwtRefreshSecret');
    return createHmac('sha256', secret).update(payload).digest('base64url');
  }

  private providerConfig(provider: SocialProvider): OAuthProviderConfig {
    if (provider === 'GOOGLE') {
      return {
        clientId: this.config.get<string>('oauth.google.clientId'),
        clientSecret: this.config.get<string>('oauth.google.clientSecret'),
        redirectUri: this.config.get<string>('oauth.google.redirectUri') ?? 'http://localhost:4000/api/v1/auth/google/callback',
        authorizationUrl: this.config.get<string>('oauth.google.authorizationUrl') ?? 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: this.config.get<string>('oauth.google.tokenUrl') ?? 'https://oauth2.googleapis.com/token',
        userInfoUrl: this.config.get<string>('oauth.google.userInfoUrl') ?? 'https://openidconnect.googleapis.com/v1/userinfo',
        scope: 'openid email profile',
      };
    }
    return {
      clientId: this.config.get<string>('oauth.facebook.clientId'),
      clientSecret: this.config.get<string>('oauth.facebook.clientSecret'),
      redirectUri: this.config.get<string>('oauth.facebook.redirectUri') ?? 'http://localhost:4000/api/v1/auth/facebook/callback',
      authorizationUrl: this.config.get<string>('oauth.facebook.authorizationUrl') ?? 'https://www.facebook.com/v19.0/dialog/oauth',
      tokenUrl: this.config.get<string>('oauth.facebook.tokenUrl') ?? 'https://graph.facebook.com/v19.0/oauth/access_token',
      userInfoUrl: this.config.get<string>('oauth.facebook.userInfoUrl') ?? 'https://graph.facebook.com/me?fields=id,name,email,picture',
      scope: 'email,public_profile',
    };
  }

  private async fetchProfile(provider: SocialProvider, accessToken: string): Promise<SocialProfile> {
    const config = this.providerConfig(provider);
    const url = new URL(config.userInfoUrl);
    if (provider === 'FACEBOOK') url.searchParams.set('access_token', accessToken);
    let response: Response;
    try {
      response = await this.fetchWithTimeout(url, { headers: { accept: 'application/json', Authorization: `Bearer ${accessToken}` } });
    } catch {
      throw new DomainError(ErrorCode.SOCIAL_OAUTH_FAILED, 'Could not retrieve the social profile', 502);
    }
    if (!response.ok) throw new DomainError(ErrorCode.SOCIAL_OAUTH_FAILED, 'Social provider returned an invalid profile', 400);
    const profile = await this.readJson(response);
    const providerUserId = provider === 'GOOGLE' ? profile.sub : profile.id;
    if (typeof providerUserId !== 'string' || providerUserId.length === 0) throw new DomainError(ErrorCode.SOCIAL_OAUTH_FAILED, 'Social provider returned no user identifier', 400);
    const picture = provider === 'FACEBOOK' && typeof profile.picture?.data?.url === 'string' ? profile.picture.data.url : profile.picture;
    return {
      providerUserId,
      email: typeof profile.email === 'string' ? profile.email : undefined,
      name: typeof profile.name === 'string' ? profile.name : undefined,
      avatarUrl: typeof picture === 'string' ? picture : undefined,
      emailVerified: provider === 'GOOGLE' ? profile.email_verified === true : undefined,
    };
  }

  private async readJson(response: Response): Promise<Record<string, any>> {
    try {
      const body = await response.json() as unknown;
      return typeof body === 'object' && body !== null ? body as Record<string, any> : {};
    } catch {
      throw new DomainError(ErrorCode.SOCIAL_OAUTH_FAILED, 'Social provider returned an invalid response', 400);
    }
  }

  private async fetchWithTimeout(input: string | URL, init: RequestInit = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }
}
