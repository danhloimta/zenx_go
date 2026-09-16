import { ContentAdminService } from './content.service';

describe('ContentAdminService maintenance status changes', () => {
  it('clears a previous game-maintenance notice when platform changes status away from maintenance', async () => {
    const current = {
      id: 'orion', updatedAt: new Date('2026-09-17T00:00:00.000Z'), genres: [{ genre: { code: 'RPG', name: 'RPG', slug: 'rpg' } }], platforms: [{ platform: 'PC' }],
      operationalStatus: 'MAINTENANCE', maintenanceMessage: 'Nâng cấp máy chủ', maintenanceEndsAt: new Date('2026-09-18T00:00:00.000Z'),
    };
    const game = { findUnique: jest.fn().mockResolvedValue(current), updateMany: jest.fn().mockResolvedValue({ count: 1 }) };
    const prisma = { game, $transaction: jest.fn(async (work: any) => work({ game, gameGenre: {}, gamePlatform: {} })) };
    const service = new ContentAdminService(prisma as any, { get: jest.fn() } as any);

    await service.updateGame('orion', { expectedUpdatedAt: '2026-09-17T00:00:00.000Z', operationalStatus: 'UNAVAILABLE' } as any);

    expect(game.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      operationalStatus: 'UNAVAILABLE', maintenanceMessage: null, maintenanceEndsAt: null,
    }) }));
  });
});
