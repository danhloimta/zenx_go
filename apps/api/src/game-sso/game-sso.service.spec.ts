jest.mock('argon2', () => ({ verify: jest.fn() }));
import * as argon2 from 'argon2';
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
    const verify = argon2.verify as jest.Mock;
    verify.mockResolvedValue(true);
    const service = new GameSsoService(prisma as any);

    await expect(service.exchange(`Basic ${Buffer.from('client:secret').toString('base64')}`, 'raw-code', 'https://game.example/callback'))
      .rejects.toMatchObject({ code: 'GAME_SSO_UNAVAILABLE', status: 503 });
    verify.mockReset();
  });

  it('rejects SSO while a temporary game lock is still active', async () => {
    const prisma = {
      gameSsoClient: { findUnique: jest.fn().mockResolvedValue({ id: 'client-row', gameId: 'orion', clientId: 'client', isActive: true, redirectUri: 'https://game.example/callback', game: { id: 'orion', code: 'ORION', isPublic: true, operationalStatus: 'AVAILABLE' } }) },
      gamePlayer: { findUnique: jest.fn().mockResolvedValue({ id: 'player-row', status: 'TEMPORARILY_BLOCKED', blockedUntil: new Date(Date.now() + 60_000) }), updateMany: jest.fn() },
    };
    const service = new GameSsoService(prisma as any);
    await expect(service.authorize('player', 'client', 'https://game.example/callback')).rejects.toMatchObject({ code: 'GAME_PLAYER_BLOCKED', status: 403 });
  });

  it('clears an expired temporary game lock before issuing an SSO code', async () => {
    const prisma = {
      gameSsoClient: { findUnique: jest.fn().mockResolvedValue({ id: 'client-row', gameId: 'orion', clientId: 'client', isActive: true, redirectUri: 'https://game.example/callback', game: { id: 'orion', code: 'ORION', isPublic: true, operationalStatus: 'AVAILABLE' } }) },
      gamePlayer: { findUnique: jest.fn().mockResolvedValue({ id: 'player-row', status: 'TEMPORARILY_BLOCKED', blockedUntil: new Date(Date.now() - 60_000) }), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      gameSsoAuthorizationCode: { upsert: jest.fn().mockResolvedValue({}) },
    };
    const service = new GameSsoService(prisma as any);
    await expect(service.authorize('player', 'client', 'https://game.example/callback')).resolves.toEqual(expect.any(String));
    expect(prisma.gamePlayer.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: 'player-row', status: 'TEMPORARILY_BLOCKED' }), data: expect.objectContaining({ status: 'ACTIVE' }) }));
  });
});
