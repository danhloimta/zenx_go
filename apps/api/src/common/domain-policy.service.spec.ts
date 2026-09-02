import { DomainPolicyService } from './domain-policy.service';

describe('DomainPolicyService', () => {
  const configValues: Record<string, unknown> = {
    baseDomain: 'zenxgo.io.vn',
    webOrigin: 'https://zenxgo.io.vn',
    nodeEnv: 'production',
    allowGameSubdomains: true,
    allowedWebOrigins: ['https://zenxgo.io.vn'],
    cookieDomain: '.zenxgo.io.vn',
    cookieSecure: true,
  };
  const config = {
    get: (key: string) => configValues[key],
    getOrThrow: (key: string) => {
      const value = configValues[key];
      if (value === undefined) throw new Error(`Missing ${key}`);
      return value;
    },
  };
  const prisma = { game: { findFirst: jest.fn() } };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.game.findFirst.mockResolvedValue({ id: 'game-1' });
  });

  it('only allows origins on the configured public protocol and port', async () => {
    const service = new DomainPolicyService(config as never, prisma as never);
    await expect(service.isAllowedOrigin('https://lucdia.zenxgo.io.vn')).resolves.toBe(true);
    await expect(service.isAllowedOrigin('https://lucdia.zenxgo.io.vn:8443')).resolves.toBe(false);
    prisma.game.findFirst.mockResolvedValueOnce(null);
    await expect(service.isAllowedOrigin('https://unknown.zenxgo.io.vn')).resolves.toBe(false);
    expect(prisma.game.findFirst).toHaveBeenCalledWith({ where: { subdomain: 'unknown', isPublic: true }, select: { id: true } });
  });

  it('resolves only public game return URLs and normalizes www to the portal', async () => {
    const service = new DomainPolicyService(config as never, prisma as never);
    await expect(service.resolveReturnTo('https://lucdia.zenxgo.io.vn/tin-tuc?tab=latest')).resolves.toBe('https://lucdia.zenxgo.io.vn/tin-tuc?tab=latest');
    await expect(service.resolveReturnTo('https://LUCDIA.zenxgo.io.vn./tin-tuc?tab=latest')).resolves.toBe('https://lucdia.zenxgo.io.vn/tin-tuc?tab=latest');
    prisma.game.findFirst.mockResolvedValueOnce(null);
    await expect(service.resolveReturnTo('https://unknown.zenxgo.io.vn/account')).resolves.toBe('https://zenxgo.io.vn/account');
    await expect(service.resolveReturnTo('https://www.zenxgo.io.vn/account?from=www')).resolves.toBe('https://zenxgo.io.vn/account?from=www');
  });

  it('fails production startup for insecure or mismatched cookie configuration', () => {
    const service = new DomainPolicyService(config as never, prisma as never);
    expect(() => service.onModuleInit()).not.toThrow();
    configValues.cookieSecure = false;
    expect(() => service.onModuleInit()).toThrow('COOKIE_SECURE must be true in production');
    configValues.cookieSecure = true;
    configValues.cookieDomain = '.other.example';
    expect(() => service.onModuleInit()).toThrow('COOKIE_DOMAIN must belong to PUBLIC_BASE_DOMAIN');
    configValues.cookieDomain = '.zenxgo.io.vn';
  });

  it('requires configured OAuth credentials to use the portal callback', () => {
    configValues['oauth.google.clientId'] = 'client-id';
    configValues['oauth.google.clientSecret'] = 'client-secret';
    configValues['oauth.google.redirectUri'] = 'https://zenxgo.io.vn/api/v1/auth/google/callback';
    const service = new DomainPolicyService(config as never, prisma as never);
    expect(() => service.onModuleInit()).not.toThrow();
    configValues['oauth.google.redirectUri'] = 'https://lucdia.zenxgo.io.vn/api/v1/auth/google/callback';
    expect(() => service.onModuleInit()).toThrow('GOOGLE_REDIRECT_URI must point to the portal OAuth callback');
    delete configValues['oauth.google.clientId'];
    delete configValues['oauth.google.clientSecret'];
    delete configValues['oauth.google.redirectUri'];
  });
});
