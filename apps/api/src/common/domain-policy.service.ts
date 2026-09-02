import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  classifyWebHost,
  isAllowedOriginShape,
  normalizeOrigin,
  parseReturnTo,
  type ClassifiedWebHost,
} from '@zenx-go/web-domain';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DomainPolicyService implements OnModuleInit {
  constructor(private readonly config: ConfigService, private readonly prisma: PrismaService) {}

  onModuleInit() {
    const origin = new URL(this.webOrigin);
    const cookieDomain = this.config.get<string>('cookieDomain');
    if (cookieDomain && cookieDomain.replace(/^\.+/, '').toLowerCase() !== this.baseDomain) {
      throw new Error('COOKIE_DOMAIN must belong to PUBLIC_BASE_DOMAIN');
    }
    if (!this.production) return;
    if (origin.protocol !== 'https:') throw new Error('PUBLIC_WEB_ORIGIN must use HTTPS in production');
    if (origin.hostname !== this.baseDomain || origin.pathname !== '/' || origin.search || origin.hash) {
      throw new Error('PUBLIC_WEB_ORIGIN must be the HTTPS portal origin for PUBLIC_BASE_DOMAIN');
    }
    if (!cookieDomain || cookieDomain.replace(/^\.+/, '').toLowerCase() !== this.baseDomain) {
      throw new Error('COOKIE_DOMAIN must be configured for the base domain in production');
    }
    if (this.config.get<boolean>('cookieSecure') !== true) {
      throw new Error('COOKIE_SECURE must be true in production');
    }
    this.validateOAuthRedirect('google');
    this.validateOAuthRedirect('facebook');
  }

  get baseDomain() {
    return this.config.getOrThrow<string>('baseDomain').toLowerCase().replace(/^\.+|\.+$/g, '');
  }

  get webOrigin() {
    return this.config.getOrThrow<string>('webOrigin').replace(/\/$/, '');
  }

  get production() {
    return this.config.get<string>('nodeEnv') === 'production';
  }

  get sessionCookieDomain() {
    const configured = this.config.get<string>('cookieDomain');
    if (!configured) return undefined;
    return `.${configured.replace(/^\.+|\.+$/g, '').toLowerCase()}`;
  }

  get allowGameSubdomains() {
    return this.config.get<boolean>('allowGameSubdomains') !== false;
  }

  classifyHost(host: string | undefined | null) {
    return classifyWebHost(host, this.baseDomain);
  }

  portalUrl(pathname = '/account') {
    const url = new URL(this.webOrigin);
    url.hostname = this.baseDomain;
    url.pathname = pathname.startsWith('/') ? pathname : `/${pathname}`;
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, pathname === '/' ? '/' : '');
  }

  async isAllowedOrigin(origin: string | undefined | null) {
    if (!origin) return true;
    const shape = isAllowedOriginShape(
      origin,
      this.baseDomain,
      this.explicitOrigins,
      { production: this.production, allowGameSubdomains: this.allowGameSubdomains },
    );
    if (!shape) return false;
    if (!this.matchesConfiguredOrigin(origin)) return false;
    if (shape.kind !== 'GAME') return true;
    return this.isPublicGameSubdomain(shape.subdomain);
  }

  async isAllowedRequestOrigin(origin: string | undefined | null) {
    if (!origin) return false;
    return this.isAllowedOrigin(origin);
  }

  async isPublicGameSubdomain(subdomain: string | undefined) {
    if (!subdomain || !this.allowGameSubdomains) return false;
    const game = await this.prisma.game.findFirst({
      where: { subdomain: subdomain.toLowerCase(), isPublic: true },
      select: { id: true },
    });
    return Boolean(game);
  }

  async resolveReturnTo(value: string | undefined | null) {
    const fallback = this.portalUrl('/account');
    const parsed = parseReturnTo(
      value,
      this.baseDomain,
      [],
      { production: this.production, allowGameSubdomains: this.allowGameSubdomains },
    );
    if (!parsed || !this.matchesConfiguredOrigin(parsed.url.origin)) return fallback;

    const host = parsed.host;
    if (host.kind === 'GAME') {
      try {
        if (!(await this.isPublicGameSubdomain(host.subdomain))) return fallback;
      } catch {
        return fallback;
      }
    }

    const target = new URL(parsed.url.toString());
    target.hostname = host.kind === 'GAME' ? `${host.subdomain}.${this.baseDomain}` : this.baseDomain;
    if (host.kind === 'WWW') {
      const portal = new URL(this.webOrigin);
      target.protocol = portal.protocol;
      target.port = portal.port;
    }
    target.hash = '';
    return target.toString();
  }

  async isAllowedReturnTo(value: string | undefined | null) {
    if (!value) return false;
    const parsed = parseReturnTo(
      value,
      this.baseDomain,
      [],
      { production: this.production, allowGameSubdomains: this.allowGameSubdomains },
    );
    if (!parsed || !this.matchesConfiguredOrigin(parsed.url.origin)) return false;
    if (parsed.host.kind !== 'GAME') return true;
    try {
      return await this.isPublicGameSubdomain(parsed.host.subdomain);
    } catch {
      return false;
    }
  }

  private get explicitOrigins() {
    return this.config.get<string[]>('allowedWebOrigins') ?? [];
  }

  private validateOAuthRedirect(provider: 'google' | 'facebook') {
    const clientId = this.config.get<string>(`oauth.${provider}.clientId`);
    const clientSecret = this.config.get<string>(`oauth.${provider}.clientSecret`);
    const redirectUri = this.config.get<string>(`oauth.${provider}.redirectUri`);
    if (!clientId && !clientSecret && !redirectUri) return;
    if (!clientId || !clientSecret) throw new Error(`${provider.toUpperCase()} OAuth credentials must be configured together`);
    if (!redirectUri) throw new Error(`${provider.toUpperCase()}_REDIRECT_URI must be configured in production`);
    const redirect = new URL(redirectUri);
    const origin = new URL(this.webOrigin);
    if (redirect.origin !== origin.origin || redirect.pathname !== `/api/v1/auth/${provider}/callback` || redirect.search || redirect.hash) {
      throw new Error(`${provider.toUpperCase()}_REDIRECT_URI must point to the portal OAuth callback`);
    }
  }

  private matchesConfiguredOrigin(origin: string) {
    const normalized = normalizeOrigin(origin);
    if (!normalized) return false;
    const publicOrigin = normalizeOrigin(this.webOrigin);
    if (!publicOrigin) return false;
    const target = new URL(normalized);
    const expected = new URL(publicOrigin);
    if (this.explicitOrigins.some((allowed) => normalizeOrigin(allowed) === normalized)) return true;
    return target.protocol === expected.protocol && target.port === expected.port;
  }
}

export type { ClassifiedWebHost };
