import { GameSsoService } from './game-sso.service';

describe('GameSsoService', () => {
  it('rejects an inactive client before a user is sent to login', async () => {
    const prisma = { gameSsoClient: { findUnique: jest.fn().mockResolvedValue({ isActive: false, redirectUri: 'https://game.example/callback', game: { isPublic: true } }) } };
    const service = new GameSsoService(prisma as any);
    await expect(service.validateAuthorizeRequest('client', 'https://game.example/callback')).rejects.toMatchObject({ code: 'GAME_SSO_CLIENT_INVALID' });
  });
});
