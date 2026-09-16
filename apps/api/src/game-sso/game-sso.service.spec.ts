import { GameSsoService } from './game-sso.service';

describe('GameSsoService', () => {
  it('rejects an inactive client before a user is sent to login', async () => {
    const prisma = { gameSsoClient: { findUnique: jest.fn().mockResolvedValue({ isActive: false, redirectUri: 'https://game.example/callback', game: { isPublic: true } }) } };
    const service = new GameSsoService(prisma as any);
    await expect(service.validateAuthorizeRequest('client', 'https://game.example/callback')).rejects.toMatchObject({ code: 'GAME_SSO_CLIENT_INVALID' });
  });

  it('rejects authorization while a public game is under maintenance', async () => {
    const prisma = {
      gameSsoClient: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'client-row', gameId: 'orion', isActive: true, redirectUri: 'https://game.example/callback',
          game: { id: 'orion', code: 'ORION', isPublic: true, operationalStatus: 'MAINTENANCE' },
        }),
      },
    };
    const service = new GameSsoService(prisma as any);

    await expect(service.validateAuthorizeRequest('client', 'https://game.example/callback'))
      .rejects.toMatchObject({ code: 'GAME_SSO_UNAVAILABLE', status: 503 });
  });

  it('rejects exchange of a previously issued code when the game enters maintenance', async () => {
    const client = { id: 'client-row', clientId: 'client', clientSecretHash: 'hash', isActive: true };
    const prisma = {
      gameSsoClient: { findUnique: jest.fn().mockResolvedValue(client) },
      $transaction: jest.fn(async (work: any) => work({
        gameSsoAuthorizationCode: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'code-row', clientId: 'client-row', redirectUri: 'https://game.example/callback', expiresAt: new Date(Date.now() + 60_000), userId: 'player', gameId: 'orion',
            game: { id: 'orion', code: 'ORION', isPublic: true, operationalStatus: 'MAINTENANCE' },
            user: { id: 'player', username: 'player', status: 'ACTIVE', profile: { fullName: 'Player' } },
          }),
        },
      })),
    };
    const verify = jest.spyOn(require('argon2'), 'verify').mockResolvedValue(true);
    const service = new GameSsoService(prisma as any);

    await expect(service.exchange(`Basic ${Buffer.from('client:secret').toString('base64')}`, 'raw-code', 'https://game.example/callback'))
      .rejects.toMatchObject({ code: 'GAME_SSO_UNAVAILABLE', status: 503 });
    verify.mockRestore();
  });
});
