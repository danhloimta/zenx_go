import 'reflect-metadata';
import { DomainError, ErrorCode } from '../common/errors';
import { GameAdminService } from './game-admin.service';

const updatedAt = new Date('2026-09-18T01:00:00.000Z');
const player = (overrides: Record<string, unknown> = {}) => ({
  id: 'player-row', userId: 'player-user', gameId: 'game-a', status: 'ACTIVE',
  firstLoginAt: new Date('2026-09-17T00:00:00.000Z'), lastLoginAt: new Date('2026-09-18T00:00:00.000Z'), loginCount: 1,
  blockedAt: null, blockedUntil: null, blockedByUserId: null, blockReason: null,
  chatBlocked: false, chatBlockedAt: null, chatBlockedByUserId: null, chatBlockReason: null,
  supportNote: null, updatedAt, user: { id: 'player-user', username: 'player', profile: { fullName: 'Player', avatarUrl: null } },
  ...overrides,
});

function setup(overrides: Record<string, unknown> = {}) {
  const prisma = {
    gamePlayer: {
      findUnique: jest.fn().mockResolvedValue(player()),
      findUniqueOrThrow: jest.fn().mockResolvedValue(player()),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    authorizationAuditLog: { create: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn(async (work: unknown) => typeof work === 'function' ? (work as (tx: unknown) => unknown)(prisma) : Promise.all(work as Promise<unknown>[])),
    ...overrides,
  };
  return { prisma, service: new GameAdminService(prisma as any, {} as any, {} as any) };
}

describe('GameAdminService player restrictions', () => {
  it('stores a future temporary lock scoped to the requested game', async () => {
    const { prisma, service } = setup();
    const expiresAt = new Date('2026-09-19T01:00:00.000Z');
    const result = await service.temporaryLockPlayer('game-a', 'player-user', { expiresAt: expiresAt.toISOString(), expectedUpdatedAt: updatedAt.toISOString(), reason: 'Vi phạm quy định' }, 'operator');
    expect(prisma.gamePlayer.updateMany).toHaveBeenLastCalledWith(expect.objectContaining({ where: { id: 'player-row', updatedAt }, data: expect.objectContaining({ status: 'TEMPORARILY_BLOCKED', blockedUntil: expiresAt, blockedByUserId: 'operator' }) }));
    expect(prisma.authorizationAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ gameId: 'game-a', action: 'GAME_PLAYER_TEMPORARILY_BLOCKED' }) }));
    expect(result.status).toBe('ACTIVE');
  });

  it('rejects an expired temporary lock without writing', async () => {
    const { prisma, service } = setup();
    await expect(service.temporaryLockPlayer('game-a', 'player-user', { expiresAt: '2020-01-01T00:00:00.000Z', expectedUpdatedAt: updatedAt.toISOString(), reason: 'Không hợp lệ' }, 'operator')).rejects.toMatchObject<Partial<DomainError>>({ code: ErrorCode.GAME_PLAYER_RESTRICTION_INVALID, status: 400 });
    expect(prisma.authorizationAuditLog.create).not.toHaveBeenCalled();
  });

  it('requires the permanent-ban permission to release a permanent ban', async () => {
    const { service } = setup({ gamePlayer: { findUnique: jest.fn().mockResolvedValue(player({ status: 'PERMANENTLY_BANNED' })), findUniqueOrThrow: jest.fn().mockResolvedValue(player({ status: 'ACTIVE' })), updateMany: jest.fn().mockResolvedValue({ count: 1 }) } });
    const access = { isSuperAdmin: false, ability: { can: (action: string) => action === 'lock' } } as any;
    await expect(service.releasePlayerRestriction('game-a', 'player-user', { expectedUpdatedAt: updatedAt.toISOString(), reason: 'Gỡ nhầm' }, 'operator', access)).rejects.toMatchObject<Partial<DomainError>>({ code: ErrorCode.GAME_PERMISSION_REQUIRED, status: 403 });
  });

  it('stores chat lock state and its audit in the requested game', async () => {
    const { prisma, service } = setup();
    await service.updatePlayerChatRestriction('game-a', 'player-user', { locked: true, expectedUpdatedAt: updatedAt.toISOString(), reason: 'Chat không phù hợp' }, 'operator');
    expect(prisma.gamePlayer.updateMany).toHaveBeenLastCalledWith(expect.objectContaining({ where: { id: 'player-row', updatedAt }, data: expect.objectContaining({ chatBlocked: true, chatBlockedByUserId: 'operator', chatBlockReason: 'Chat không phù hợp' }) }));
    expect(prisma.authorizationAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ gameId: 'game-a', action: 'GAME_PLAYER_CHAT_BLOCKED' }) }));
  });
});
