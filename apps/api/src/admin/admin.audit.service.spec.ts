import { AdminAuditService } from './admin.audit.service';

describe('AdminAuditService', () => {
  it('redacts secret-like metadata keys before persistence', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'audit-id' });
    const service = new AdminAuditService({} as any);
    await service.record(
      {
        actorUserId: 'actor-id',
        action: 'PASSWORD_RESET',
        targetType: 'USER',
        targetId: 'target-id',
        reason: 'Support request',
        metadata: {
          fields: ['passwordHash'],
          temporaryPassword: 'Password123!',
          nested: { citizenId: '079123456789', safe: true },
        },
      },
      { adminAuditLog: { create } } as any,
    );
    const metadata = JSON.parse(create.mock.calls[0][0].data.metadata);
    expect(metadata).toEqual({
      fields: ['passwordHash'],
      temporaryPassword: '[REDACTED]',
      nested: { citizenId: '[REDACTED]', safe: true },
    });
    expect(create.mock.calls[0][0].data.reason).toBe('Support request');
  });
});
