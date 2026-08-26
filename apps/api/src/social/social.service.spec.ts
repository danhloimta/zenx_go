import { SocialService } from './social.service';

describe('SocialService OAuth boundary', () => {
  const config = {
    get: (key: string) => ({
      oauthStateSecret: 'oauth-state-secret-32-characters-minimum',
      jwtRefreshSecret: 'refresh-secret-32-characters-minimum',
      termsVersion: '2026-01',
      privacyVersion: '2026-01',
      'oauth.google.clientId': 'google-client-id',
      'oauth.google.clientSecret': 'google-client-secret',
      'oauth.google.redirectUri': 'http://localhost:4000/api/v1/auth/google/callback',
      'oauth.facebook.clientId': 'facebook-client-id',
      'oauth.facebook.clientSecret': 'facebook-client-secret',
    } as Record<string, string | undefined>)[key],
    getOrThrow: (key: string) => {
      const value = (config.get as (name: string) => string | undefined)(key);
      if (!value) throw new Error(`Missing ${key}`);
      return value;
    },
  };

  const prisma = {
    socialIdentity: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('creates and verifies a signed, provider-bound state', () => {
    const service = new SocialService(prisma as never, config as never);
    const authorization = service.getAuthorizationUrl('GOOGLE', 'link', 'user-1');
    const url = new URL(authorization.url);
    expect(url.searchParams.get('client_id')).toBe('google-client-id');
    expect(url.searchParams.get('state')).toBe(authorization.state);
    expect(service.verifyState('GOOGLE', authorization.state, authorization.state)).toMatchObject({ mode: 'link', userId: 'user-1' });
    expect(() => service.verifyState('FACEBOOK', authorization.state, authorization.state)).toThrow('OAuth state is invalid or expired');
    expect(() => service.verifyState('GOOGLE', authorization.state, 'tampered')).toThrow('OAuth state is invalid or expired');
  });

  it('exchanges an authorization code and reads the provider user profile', async () => {
    const service = new SocialService(prisma as never, config as never);
    const fetchMock = jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'access-token' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ sub: 'google-user-1', email: 'user@example.com', name: 'Test User', email_verified: true }), { status: 200 }));

    await expect(service.exchangeCode('GOOGLE', 'authorization-code')).resolves.toMatchObject({
      providerUserId: 'google-user-1',
      email: 'user@example.com',
      emailVerified: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('https://oauth2.googleapis.com/token');
    fetchMock.mockRestore();
  });

  it('creates a social-only user on first login when the email is new', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    prisma.$transaction.mockImplementation(async (callback: (transaction: unknown) => Promise<string>) => callback({
      socialIdentity: {
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'social-user-1' }),
      },
    }));
    const service = new SocialService(prisma as never, config as never);

    await expect(service.loginIdentity('GOOGLE', {
      providerUserId: 'google-user-1',
      email: 'new-user@example.com',
      name: 'New User',
      emailVerified: true,
    })).resolves.toBe('social-user-1');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('does not auto-link a new social identity to an existing email account', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ id: 'existing-user' });
    const service = new SocialService(prisma as never, config as never);

    await expect(service.loginIdentity('GOOGLE', {
      providerUserId: 'google-user-2',
      email: 'existing@example.com',
      emailVerified: true,
    })).rejects.toMatchObject({ code: 'SOCIAL_NOT_LINKED' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects a social identity already owned by another account', async () => {
    prisma.socialIdentity.findUnique.mockResolvedValue({ userId: 'other-user' });
    const service = new SocialService(prisma as never, config as never);

    await expect(service.linkIdentity('user-1', 'GOOGLE', { providerUserId: 'google-user-1' }))
      .rejects.toMatchObject({ code: 'SOCIAL_LINKED_TO_ANOTHER_ACCOUNT', status: 409 });
    expect(prisma.socialIdentity.create).not.toHaveBeenCalled();
  });

  it('blocks unlinking the only login method for a social-only account', async () => {
    prisma.socialIdentity.findFirst.mockResolvedValue({
      id: 'identity-1',
      user: { passwordHash: null },
    });
    prisma.socialIdentity.count.mockResolvedValue(0);
    const service = new SocialService(prisma as never, config as never);

    await expect(service.unlink('user-1', 'GOOGLE')).rejects.toMatchObject({ code: 'CANNOT_UNLINK_LAST_LOGIN_METHOD', status: 409 });
    expect(prisma.socialIdentity.delete).not.toHaveBeenCalled();
  });
});
