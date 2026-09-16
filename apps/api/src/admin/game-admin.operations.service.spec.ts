import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GameAdminService } from './game-admin.service';
import { GameMaintenanceUpdateDto } from './game-admin.dto';
import { ErrorCode } from '../common/errors';

const game = (overrides: Record<string, unknown> = {}) => ({
  id: 'orion', operationalStatus: 'AVAILABLE', maintenanceMessage: null, maintenanceEndsAt: null,
  updatedAt: new Date('2026-09-17T00:00:00.000Z'), ...overrides,
});

describe('GameAdminService maintenance operations', () => {
  it('validates a maintenance request with required message and operator reason', async () => {
    const valid = await validate(plainToInstance(GameMaintenanceUpdateDto, {
      enabled: true, message: 'Nâng cấp máy chủ', expectedEndsAt: '2026-09-18T00:00:00.000Z', expectedUpdatedAt: '2026-09-17T00:00:00.000Z', reason: 'Triển khai bản vá',
    }));
    const invalid = await validate(plainToInstance(GameMaintenanceUpdateDto, {
      enabled: true, message: 'x', expectedUpdatedAt: 'invalid', reason: 'x',
    }));

    expect(valid).toHaveLength(0);
    expect(invalid.map((entry) => entry.property)).toEqual(expect.arrayContaining(['message', 'expectedUpdatedAt', 'reason']));
  });

  it('enables maintenance with an optimistic write and a redacted audit snapshot', async () => {
    const prisma = {
      game: { findUnique: jest.fn().mockResolvedValue(game()), updateMany: jest.fn().mockResolvedValue({ count: 1 }), findUniqueOrThrow: jest.fn().mockResolvedValue(game({ operationalStatus: 'MAINTENANCE', maintenanceMessage: 'Nâng cấp máy chủ', maintenanceEndsAt: new Date('2026-09-18T00:00:00.000Z') })) },
      authorizationAuditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const service = new GameAdminService(prisma as any, {} as any);

    const result = await (service as any).updateMaintenance('orion', {
      enabled: true, message: 'Nâng cấp máy chủ', expectedEndsAt: '2026-09-18T00:00:00.000Z', expectedUpdatedAt: '2026-09-17T00:00:00.000Z', reason: 'Triển khai bản vá',
    }, 'game-admin');

    expect(prisma.game.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'orion', updatedAt: new Date('2026-09-17T00:00:00.000Z') },
      data: expect.objectContaining({ operationalStatus: 'MAINTENANCE', maintenanceMessage: 'Nâng cấp máy chủ' }),
    }));
    const audit = prisma.authorizationAuditLog.create.mock.calls[0][0].data;
    expect(audit).toEqual(expect.objectContaining({ action: 'GAME_MAINTENANCE_ENABLED', actorUserId: 'game-admin', gameId: 'orion', targetType: 'GAME', targetId: 'orion' }));
    expect(JSON.parse(audit.afterData)).toEqual({ operationalStatus: 'MAINTENANCE', maintenanceMessage: 'Nâng cấp máy chủ', maintenanceEndsAt: '2026-09-18T00:00:00.000Z' });
    expect(JSON.stringify(audit)).not.toMatch(/secret|authorization/i);
    expect(result).toEqual(expect.objectContaining({ operationalStatus: 'MAINTENANCE', maintenanceMessage: 'Nâng cấp máy chủ' }));
  });

  it('refuses a game-admin maintenance write when platform status is locked', async () => {
    const prisma = { game: { findUnique: jest.fn().mockResolvedValue(game({ operationalStatus: 'UNAVAILABLE' })) } };
    const service = new GameAdminService(prisma as any, {} as any);

    await expect((service as any).updateMaintenance('orion', {
      enabled: true, message: 'Nâng cấp máy chủ', expectedEndsAt: null, expectedUpdatedAt: '2026-09-17T00:00:00.000Z', reason: 'Triển khai bản vá',
    }, 'game-admin')).rejects.toMatchObject({ code: 'GAME_OPERATION_STATUS_LOCKED', status: 409 });
  });

  it('does not overwrite an operations update that has gone stale', async () => {
    const prisma = {
      game: { findUnique: jest.fn().mockResolvedValue(game()), updateMany: jest.fn().mockResolvedValue({ count: 0 }), findUniqueOrThrow: jest.fn() },
      authorizationAuditLog: { create: jest.fn() },
    };
    const service = new GameAdminService(prisma as any, {} as any);

    await expect((service as any).updateMaintenance('orion', {
      enabled: true, message: 'Nâng cấp máy chủ', expectedEndsAt: null, expectedUpdatedAt: '2026-09-17T00:00:00.000Z', reason: 'Triển khai bản vá',
    }, 'game-admin')).rejects.toMatchObject({ code: ErrorCode.STALE_GAME_OPERATION_UPDATE, status: 409 });
    expect(prisma.authorizationAuditLog.create).not.toHaveBeenCalled();
  });
});
