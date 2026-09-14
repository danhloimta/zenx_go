import { AuthorizationService } from './authorization.service';

describe('AuthorizationService', () => {
  it('gives a SUPER_ADMIN an unrestricted CASL ability', async () => {
    const prisma = {
      userRole: {
        findMany: jest.fn().mockResolvedValue([
          {
            role: {
              id: 'role-super',
              code: 'SUPER_ADMIN',
              name: 'Super Admin',
              isActive: true,
              permissions: [],
            },
          },
        ]),
      },
    };

    const authorization = new AuthorizationService(prisma as any);
    const access = await authorization.getAccess('admin-id');

    expect(access.permissionCodes).toEqual([]);
    expect(access.ability.can('anything', 'anywhere')).toBe(true);
  });

  it('only exposes permissions from active roles', async () => {
    const prisma = {
      userRole: {
        findMany: jest.fn().mockResolvedValue([
          {
            role: {
              id: 'role-support',
              code: 'SUPPORT',
              name: 'Support',
              isActive: true,
              permissions: [
                {
                  permission: {
                    code: 'support.tickets.view',
                    action: 'read',
                    subject: 'SupportTicket',
                  },
                },
              ],
            },
          },
        ]),
      },
    };

    const authorization = new AuthorizationService(prisma as any);
    const access = await authorization.getAccess('support-id');

    expect(access.permissionCodes).toEqual(['support.tickets.view']);
    expect(access.ability.can('read', 'SupportTicket')).toBe(true);
    expect(access.ability.can('manage', 'Finance')).toBe(false);
  });
});
