import { GameAccessService } from './game-access.service';

describe('GameAccessService', () => {
  it('builds an ability only from roles assigned in the requested game', async () => {
    const prisma = {
      userRole: { findMany: jest.fn().mockResolvedValue([]) },
      gameRoleAssignment: { findMany: jest.fn().mockResolvedValue([{ role: { id: 'moderator', code: 'GAME_PLAYER_MODERATOR', name: 'Moderator', isActive: true, scopeType: 'GAME', permissions: [{ permission: { action: 'read', subject: 'GamePlayer', isActive: true, scopeType: 'GAME' } }] } }]) },
    };
    const access = await new GameAccessService(prisma as any).getAccess('user-a', 'game-orion');
    expect(prisma.gameRoleAssignment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-a', gameId: 'game-orion' } }));
    expect(access.ability.can('read', 'GamePlayer')).toBe(true);
    expect(access.ability.can('moderate', 'GamePlayer')).toBe(false);
  });

  it('lets a platform super admin access every game', async () => {
    const prisma = { userRole: { findMany: jest.fn().mockResolvedValue([{ role: { code: 'SUPER_ADMIN', isActive: true } }]) } };
    const access = await new GameAccessService(prisma as any).getAccess('root', 'game-any');
    expect(access.isSuperAdmin).toBe(true);
    expect(access.ability.can('manage', 'GamePlayer')).toBe(true);
  });

  it('does not give a content-only game role player support permission', async () => {
    const prisma = {
      userRole: { findMany: jest.fn().mockResolvedValue([]) },
      gameRoleAssignment: { findMany: jest.fn().mockResolvedValue([{ role: { id: 'content', code: 'GAME_CONTENT_MANAGER', name: 'Content', isActive: true, scopeType: 'GAME', permissions: [{ permission: { action: 'manage', subject: 'GameContent', isActive: true, scopeType: 'GAME' } }] } }]) },
    };
    const access = await new GameAccessService(prisma as any).getAccess('content-user', 'game-orion');
    expect(access.ability.can('support-note', 'GamePlayer')).toBe(false);
  });
});
