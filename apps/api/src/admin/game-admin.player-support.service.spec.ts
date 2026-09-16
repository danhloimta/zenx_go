import 'reflect-metadata';
import { DomainError, ErrorCode } from '../common/errors';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GamePlayerSupportNoteDto } from './game-admin.dto';
import { GameAdminService } from './game-admin.service';

const player = (overrides: Record<string, unknown> = {}) => ({
  id: 'player-row',
  userId: 'player-user',
  gameId: 'orion',
  status: 'ACTIVE',
  firstLoginAt: new Date('2026-09-16T00:00:00.000Z'),
  lastLoginAt: new Date('2026-09-16T00:00:00.000Z'),
  loginCount: 1,
  blockedAt: null,
  blockReason: null,
  supportNote: null,
  updatedAt: new Date('2026-09-16T01:00:00.000Z'),
  user: { id: 'player-user', username: 'player', profile: { fullName: 'Player One', avatarUrl: null } },
  ...overrides,
});

function makeService(overrides: Record<string, unknown> = {}) {
  const prisma = {
    gamePlayer: {
      findUnique: jest.fn().mockResolvedValue(player()),
      findUniqueOrThrow: jest.fn().mockResolvedValue(player({ supportNote: 'Needs follow-up', updatedAt: new Date('2026-09-16T01:01:00.000Z') })),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    authorizationAuditLog: {
      create: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    userRole: { findMany: jest.fn().mockResolvedValue([]) },
    $transaction: jest.fn(async (operation: unknown) => typeof operation === 'function' ? (operation as (client: unknown) => unknown)(prisma) : Promise.all(operation as Promise<unknown>[])),
    ...overrides,
  };
  return { prisma, service: new GameAdminService(prisma as any, {} as any) };
}

describe('GameAdminService player support', () => {
  it('projects dashboard recent players without internal support data', async () => {
    const recent = [player({ supportNote: 'Private note', blockReason: 'Private reason' })];
    const { service } = makeService({
      gamePlayer: {
        count: jest.fn().mockResolvedValue(1),
        aggregate: jest.fn().mockResolvedValue({ _sum: { loginCount: 1 } }),
        findMany: jest.fn().mockResolvedValue(recent),
      },
    });

    const result = await service.dashboard('orion');

    expect(result.recentPlayers[0]).toEqual(expect.objectContaining({ userId: 'player-user', loginCount: 1 }));
    expect(result.recentPlayers[0]).not.toHaveProperty('supportNote');
    expect(result.recentPlayers[0]).not.toHaveProperty('blockReason');
  });

  it('validates a nullable support note and rejects absent or oversized notes', async () => {
    const valid = await validate(plainToInstance(GamePlayerSupportNoteDto, { note: null, expectedUpdatedAt: '2026-09-16T01:00:00.000Z' }));
    const invalid = await validate(plainToInstance(GamePlayerSupportNoteDto, { note: 'x'.repeat(2_001), expectedUpdatedAt: 'invalid' }));
    const absent = await validate(plainToInstance(GamePlayerSupportNoteDto, { expectedUpdatedAt: '2026-09-16T01:00:00.000Z' }));

    expect(valid).toHaveLength(0);
    expect(invalid.map((entry) => entry.property)).toEqual(expect.arrayContaining(['note', 'expectedUpdatedAt']));
    expect(absent.map((entry) => entry.property)).toContain('note');
  });

  it('serializes the current internal support note without exposing sensitive user fields', async () => {
    const { service } = makeService();

    const result = await service.getPlayer('orion', 'player-user');

    expect(result).toMatchObject({ userId: 'player-user', supportNote: null });
    expect(result.user).not.toHaveProperty('email');
    expect(result.user).not.toHaveProperty('phone');
    expect(result.user).not.toHaveProperty('wallet');
  });

  it('trims a support note, performs an optimistic write, and audits only note data', async () => {
    const { prisma, service } = makeService();

    const result = await (service as any).updatePlayerSupportNote('orion', 'player-user', {
      note: '  Needs follow-up  ',
      expectedUpdatedAt: '2026-09-16T01:00:00.000Z',
    }, 'moderator');

    expect(prisma.gamePlayer.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'player-row', updatedAt: new Date('2026-09-16T01:00:00.000Z') },
      data: expect.objectContaining({ supportNote: 'Needs follow-up' }),
    }));
    expect(prisma.authorizationAuditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      actorUserId: 'moderator', gameId: 'orion', action: 'GAME_PLAYER_SUPPORT_NOTE_UPDATED', targetId: 'player-row',
      beforeData: JSON.stringify({ supportNote: null }), afterData: JSON.stringify({ supportNote: 'Needs follow-up' }),
    }) });
    expect(result).toMatchObject({ supportNote: 'Needs follow-up' });
  });

  it('normalizes whitespace-only notes to null', async () => {
    const { prisma, service } = makeService();
    prisma.gamePlayer.findUniqueOrThrow.mockResolvedValue(player({ supportNote: null }));

    await (service as any).updatePlayerSupportNote('orion', 'player-user', {
      note: '   ', expectedUpdatedAt: '2026-09-16T01:00:00.000Z',
    }, 'moderator');

    expect(prisma.gamePlayer.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ supportNote: null }) }));
  });

  it('rejects a stale support-note update without writing or auditing', async () => {
    const { prisma, service } = makeService();

    await expect((service as any).updatePlayerSupportNote('orion', 'player-user', {
      note: 'Note', expectedUpdatedAt: '2026-09-16T00:00:00.000Z',
    }, 'moderator')).rejects.toMatchObject<Partial<DomainError>>({ code: ErrorCode.STALE_GAME_PLAYER_UPDATE, status: 409 });
    expect(prisma.gamePlayer.updateMany).not.toHaveBeenCalled();
    expect(prisma.authorizationAuditLog.create).not.toHaveBeenCalled();
  });

  it('propagates audit failure from the same support-note transaction', async () => {
    const auditFailure = new Error('audit unavailable');
    const { prisma, service } = makeService({ authorizationAuditLog: { create: jest.fn().mockRejectedValue(auditFailure), findMany: jest.fn(), count: jest.fn() } });

    await expect((service as any).updatePlayerSupportNote('orion', 'player-user', {
      note: 'Transaction note', expectedUpdatedAt: '2026-09-16T01:00:00.000Z',
    }, 'moderator')).rejects.toThrow('audit unavailable');
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function));
  });

  it('treats a player from another game as not found before writing a support note', async () => {
    const { prisma, service } = makeService({
      gamePlayer: { findUnique: jest.fn().mockResolvedValue(null), findUniqueOrThrow: jest.fn(), updateMany: jest.fn() },
    });

    await expect((service as any).updatePlayerSupportNote('hoalong', 'player-user', {
      note: 'Orion-only note', expectedUpdatedAt: '2026-09-16T01:00:00.000Z',
    }, 'moderator')).rejects.toMatchObject<Partial<DomainError>>({ code: ErrorCode.GAME_PLAYER_NOT_FOUND, status: 404 });
    expect(prisma.gamePlayer.updateMany).not.toHaveBeenCalled();
    expect(prisma.authorizationAuditLog.create).not.toHaveBeenCalled();
  });

  it('updates a scoped player profile through the shared profile service and records game audit', async () => {
    const updated = {
      id: 'player-user', username: 'renamed-player', email: 'player@example.com', phone: '+84901234567',
      emailVerified: true, phoneVerified: true, updatedAt: new Date('2026-09-16T02:00:00.000Z'),
      profile: { fullName: 'Player Renamed', avatarUrl: null, dateOfBirth: null, gender: 'UNSPECIFIED', city: 'Hồ Chí Minh', address: null },
      roles: [],
    };
    const admin = {
      updateProfile: jest.fn(async (_userId: string, _dto: unknown, onUpdated: (tx: unknown, snapshot: unknown) => Promise<void>) => {
        await onUpdated({ authorizationAuditLog: (prisma as any).authorizationAuditLog }, { before: { username: 'player' }, after: { username: 'renamed-player' } });
        return updated;
      }),
    };
    const { prisma } = makeService();
    const service = new (GameAdminService as any)(prisma, {}, admin);

    const result = await service.updatePlayerProfile('orion', 'player-user', {
      username: 'renamed-player', email: 'player@example.com', phone: '+84901234567', fullName: 'Player Renamed',
      dateOfBirth: null, gender: 'UNSPECIFIED', city: 'Hồ Chí Minh', address: null,
      emailVerified: true, phoneVerified: true, expectedUpdatedAt: '2026-09-16T01:00:00.000Z',
    }, 'game-admin');

    expect(admin.updateProfile).toHaveBeenCalledWith('player-user', expect.objectContaining({ username: 'renamed-player', emailVerified: true, phoneVerified: true }), expect.any(Function));
    expect(prisma.authorizationAuditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ actorUserId: 'game-admin', gameId: 'orion', action: 'GAME_PLAYER_PROFILE_UPDATED', targetType: 'GAME_PLAYER', targetId: 'player-row' }) });
    expect(result).toMatchObject({ username: 'renamed-player', email: 'player@example.com', profile: { fullName: 'Player Renamed' } });
    expect(result).not.toHaveProperty('roles');
    expect(result).not.toHaveProperty('wallet');
  });

  it('prevents a non-Super-Admin game operator from editing a platform administrator player', async () => {
    const admin = { updateProfile: jest.fn() };
    const { prisma } = makeService({
      gamePlayer: { findUnique: jest.fn().mockResolvedValue({ id: 'player-row', user: { roles: [{ role: { code: 'SUPPORT', isActive: true, scopeType: 'PLATFORM' } }] } }) },
      userRole: { findMany: jest.fn().mockResolvedValue([]) },
    });
    const service = new (GameAdminService as any)(prisma, {}, admin);

    await expect(service.updatePlayerProfile('orion', 'platform-admin', { expectedUpdatedAt: '2026-09-16T01:00:00.000Z', fullName: 'No access' }, 'game-admin'))
      .rejects.toMatchObject({ code: 'GAME_PRIVILEGED_PLAYER_PROFILE_PROTECTED', status: 403 });
    expect(admin.updateProfile).not.toHaveBeenCalled();
  });

  it('prevents a non-Super-Admin game operator from editing another game administrator player', async () => {
    const admin = { updateProfile: jest.fn() };
    const { prisma } = makeService({
      gamePlayer: { findUnique: jest.fn().mockResolvedValue({ id: 'player-row', user: { roles: [], gameRoleAssignments: [{ id: 'other-game-role' }] } }) },
      userRole: { findMany: jest.fn().mockResolvedValue([]) },
    });
    const service = new (GameAdminService as any)(prisma, {}, admin);

    await expect(service.updatePlayerProfile('orion', 'other-game-admin', { expectedUpdatedAt: '2026-09-16T01:00:00.000Z', fullName: 'No access' }, 'game-admin'))
      .rejects.toMatchObject({ code: 'GAME_PRIVILEGED_PLAYER_PROFILE_PROTECTED', status: 403 });
    expect(admin.updateProfile).not.toHaveBeenCalled();
  });

  it('returns only this player\'s moderation and support activity in the requested game', async () => {
    const entries = [{
      id: 'audit-1', gameId: 'orion', action: 'GAME_PLAYER_SUPPORT_NOTE_UPDATED', targetType: 'GAME_PLAYER', targetId: 'player-row', reason: null,
      beforeData: JSON.stringify({ supportNote: null }), afterData: JSON.stringify({ supportNote: 'Follow up' }), createdAt: new Date('2026-09-16T02:00:00.000Z'),
      actor: { id: 'moderator', username: 'mod', profile: { fullName: 'Moderator' } },
    }];
    const { prisma, service } = makeService({
      authorizationAuditLog: { create: jest.fn(), findMany: jest.fn().mockResolvedValue(entries), count: jest.fn().mockResolvedValue(1) },
    });

    const result = await (service as any).playerActivity('orion', 'player-user', { page: 1, pageSize: 20 });

    expect(prisma.authorizationAuditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {
      gameId: 'orion', targetType: 'GAME_PLAYER', targetId: 'player-row', action: { in: ['GAME_PLAYER_BLOCKED', 'GAME_PLAYER_UNBLOCKED', 'GAME_PLAYER_SUPPORT_NOTE_UPDATED'] },
    } }));
    expect(result).toEqual(expect.objectContaining({ total: 1, items: [expect.objectContaining({ action: 'GAME_PLAYER_SUPPORT_NOTE_UPDATED', actor: { id: 'moderator', username: 'mod', displayName: 'Moderator' } })] }));
  });

  it('does not leak a note into unrelated block audit snapshots', async () => {
    const current = player({ supportNote: 'Private note' });
    const { prisma, service } = makeService({
      gamePlayer: {
        findUnique: jest.fn().mockResolvedValue(current),
        findUniqueOrThrow: jest.fn().mockResolvedValue(player({ status: 'BLOCKED', supportNote: 'Private note' })),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    });

    await service.updatePlayerStatus('orion', 'player-user', {
      status: 'BLOCKED', reason: 'Abuse', expectedUpdatedAt: '2026-09-16T01:00:00.000Z',
    }, 'moderator');

    const audit = prisma.authorizationAuditLog.create.mock.calls[0][0].data;
    expect(JSON.parse(audit.beforeData)).not.toHaveProperty('supportNote');
    expect(JSON.parse(audit.afterData)).not.toHaveProperty('supportNote');
  });

  it('propagates audit failure from the same moderation transaction', async () => {
    const auditFailure = new Error('audit unavailable');
    const { prisma, service } = makeService({ authorizationAuditLog: { create: jest.fn().mockRejectedValue(auditFailure), findMany: jest.fn(), count: jest.fn() } });

    await expect(service.updatePlayerStatus('orion', 'player-user', {
      status: 'BLOCKED', reason: 'Abuse', expectedUpdatedAt: '2026-09-16T01:00:00.000Z',
    }, 'moderator')).rejects.toThrow('audit unavailable');
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function));
  });
});
