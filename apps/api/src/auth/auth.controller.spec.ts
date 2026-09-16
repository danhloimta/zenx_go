import { Request } from 'express';
import { AuthController } from './auth.controller';
import { DomainError, ErrorCode } from '../common/errors';

describe('AuthController OAuth settings enforcement', () => {
  const auth = {
    verifyAccessToken: jest.fn(),
    loginWithSocial: jest.fn(),
  };
  const config = { get: jest.fn() };
  const social = {
    getAuthorizationUrl: jest.fn(),
    stateCookieName: jest.fn(),
    appendState: jest.fn(),
    verifyState: jest.fn(),
    removeState: jest.fn(),
    exchangeCode: jest.fn(),
    linkIdentity: jest.fn(),
    loginIdentity: jest.fn(),
  };
  const domainPolicy = {
    resolveReturnTo: jest.fn(),
    portalUrl: jest.fn(),
    sessionCookieDomain: jest.fn(),
  };
  const settings = { assertLoginRegistrationEnabled: jest.fn() };
  const response = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    redirect: jest.fn(),
  };

  let controller: AuthController;

  beforeEach(() => {
    jest.clearAllMocks();
    auth.verifyAccessToken.mockResolvedValue({ sub: 'user-1' });
    auth.loginWithSocial.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: 'user-1' },
    });
    config.get.mockReturnValue(undefined);
    social.getAuthorizationUrl.mockReturnValue({
      url: 'https://provider.example/authorize',
      state: 'signed-state',
    });
    social.stateCookieName.mockImplementation((provider: string) =>
      `zenx_oauth_state_${provider.toLowerCase()}`,
    );
    social.appendState.mockReturnValue('signed-state');
    social.verifyState.mockReturnValue({
      provider: 'GOOGLE',
      mode: 'login',
      returnTo: 'https://zenx.example/return',
      nonce: 'nonce',
      expiresAt: Number.MAX_SAFE_INTEGER,
    });
    social.removeState.mockReturnValue(undefined);
    social.exchangeCode.mockResolvedValue({ providerUserId: 'provider-user-1' });
    social.loginIdentity.mockResolvedValue('user-1');
    domainPolicy.resolveReturnTo.mockResolvedValue('https://zenx.example/return');
    domainPolicy.portalUrl.mockImplementation((path: string) => `https://zenx.example${path}`);
    settings.assertLoginRegistrationEnabled.mockResolvedValue(undefined);

    controller = new AuthController(
      auth as never,
      config as never,
      social as never,
      domainPolicy as never,
      settings as never,
    );
  });

  it.each([
    ['google', 'GOOGLE'],
    ['facebook', 'FACEBOOK'],
  ] as const)('checks current settings before starting %s login OAuth', async (method, provider) => {
    await controller[method](request(), response as never);

    expect(settings.assertLoginRegistrationEnabled).toHaveBeenCalledWith(provider);
    expect(settings.assertLoginRegistrationEnabled.mock.invocationCallOrder[0]).toBeLessThan(
      social.getAuthorizationUrl.mock.invocationCallOrder[0],
    );
    expect(response.cookie).toHaveBeenCalled();
    expect(response.redirect).toHaveBeenCalledWith('https://provider.example/authorize');
  });

  it.each([
    [ErrorCode.SOCIAL_PROVIDER_DISABLED, 'provider_disabled'],
    [ErrorCode.SETTINGS_UNAVAILABLE, 'settings_unavailable'],
  ] as const)('stops login start on %s before return-to, provider, or cookie work', async (code, redirectCode) => {
    settings.assertLoginRegistrationEnabled.mockRejectedValue(new DomainError(code));

    await controller.google(request(), response as never, undefined, 'https://zenx.example/return');

    expect(domainPolicy.resolveReturnTo).not.toHaveBeenCalled();
    expect(social.getAuthorizationUrl).not.toHaveBeenCalled();
    expect(response.cookie).not.toHaveBeenCalled();
    expect(response.redirect).toHaveBeenCalledWith(
      `https://zenx.example/auth/login?social_error=${redirectCode}`,
    );
  });

  it('checks callback settings after verified state and before provider exchange', async () => {
    await controller.googleCallback(
      request({ zenx_oauth_state_google: 'signed-state' }),
      response as never,
      'authorization-code',
      'signed-state',
    );

    expect(social.verifyState.mock.invocationCallOrder[0]).toBeLessThan(
      settings.assertLoginRegistrationEnabled.mock.invocationCallOrder[0],
    );
    expect(settings.assertLoginRegistrationEnabled).toHaveBeenCalledWith('GOOGLE');
    expect(settings.assertLoginRegistrationEnabled.mock.invocationCallOrder[0]).toBeLessThan(
      social.exchangeCode.mock.invocationCallOrder[0],
    );
    expect(social.loginIdentity).toHaveBeenCalled();
  });

  it.each([
    [ErrorCode.SOCIAL_PROVIDER_DISABLED, 'provider_disabled'],
    [ErrorCode.SETTINGS_UNAVAILABLE, 'settings_unavailable'],
  ] as const)('stops a verified login callback on %s before provider or user work', async (code, redirectCode) => {
    settings.assertLoginRegistrationEnabled.mockRejectedValue(new DomainError(code));

    await controller.googleCallback(
      request({ zenx_oauth_state_google: 'signed-state' }),
      response as never,
      'authorization-code',
      'signed-state',
    );

    expect(social.verifyState).toHaveBeenCalled();
    expect(social.exchangeCode).not.toHaveBeenCalled();
    expect(social.loginIdentity).not.toHaveBeenCalled();
    expect(auth.loginWithSocial).not.toHaveBeenCalled();
    expect(response.redirect).toHaveBeenCalledWith(
      `https://zenx.example/return?social_error=${redirectCode}`,
    );
  });

  it('lets invalid callback state win without reading settings', async () => {
    social.verifyState.mockImplementation(() => {
      throw new DomainError(ErrorCode.INVALID_OAUTH_STATE);
    });

    await controller.googleCallback(
      request({ zenx_oauth_state_google: 'cookie-state' }),
      response as never,
      'unused',
      'tampered',
    );

    expect(settings.assertLoginRegistrationEnabled).not.toHaveBeenCalled();
    expect(social.exchangeCode).not.toHaveBeenCalled();
    expect(response.redirect).toHaveBeenCalledWith(
      'https://zenx.example/auth/login?social_error=invalid_state',
    );
  });

  it('does not apply login settings to link start', async () => {
    await controller.google(request({ zenx_access: 'access-cookie' }), response as never, 'link');

    expect(settings.assertLoginRegistrationEnabled).not.toHaveBeenCalled();
    expect(auth.verifyAccessToken).toHaveBeenCalledWith('access-cookie');
    expect(social.getAuthorizationUrl).toHaveBeenCalledWith(
      'GOOGLE',
      'link',
      'user-1',
      undefined,
    );
  });

  it('does not apply login settings to a verified link callback', async () => {
    social.verifyState.mockReturnValue({
      provider: 'GOOGLE',
      mode: 'link',
      userId: 'user-1',
      nonce: 'nonce',
      expiresAt: Number.MAX_SAFE_INTEGER,
    });

    await controller.googleCallback(
      request({
        zenx_access: 'access-cookie',
        zenx_oauth_state_google: 'signed-state',
      }),
      response as never,
      'authorization-code',
      'signed-state',
    );

    expect(settings.assertLoginRegistrationEnabled).not.toHaveBeenCalled();
    expect(social.exchangeCode).toHaveBeenCalledWith('GOOGLE', 'authorization-code');
    expect(social.linkIdentity).toHaveBeenCalledWith(
      'user-1',
      'GOOGLE',
      { providerUserId: 'provider-user-1' },
    );
    expect(social.loginIdentity).not.toHaveBeenCalled();
  });

  function request(cookies: Record<string, string> = {}) {
    return { cookies, headers: {} } as Request;
  }
});
