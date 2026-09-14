import { ExecutionContext } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { DomainError } from '../common/errors';

describe('AdminGuard', () => {
  it('accepts a live SUPER_ADMIN role from the database', async () => {
    const authorization = { getAccess: jest.fn().mockResolvedValue({ roles: [{ code: 'SUPER_ADMIN' }], permissionCodes: [], abilityRules: [], ability: { can: () => true } }) };
    const request: any = { user: { sub: 'admin-id' } };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
    await expect(
      new AdminGuard(authorization as any).canActivate(
        context,
      ),
    ).resolves.toBe(true);
    expect(request.admin.roles).toEqual([{ code: 'SUPER_ADMIN' }]);
  });

  it('rejects users without SUPER_ADMIN', async () => {
    const authorization = { getAccess: jest.fn().mockResolvedValue({ roles: [], permissionCodes: [], abilityRules: [], ability: { can: () => false } }) };
    const context = {
      switchToHttp: () => ({ getRequest: () => ({ user: { sub: 'user-id' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
    await expect(
      new AdminGuard(authorization as any).canActivate(
        context,
      ),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it('accepts any active role and leaves permission checks to PermissionGuard', async () => {
    const authorization = { getAccess: jest.fn().mockResolvedValue({ roles: [{ code: 'SUPPORT' }], permissionCodes: ['support.tickets.view'], abilityRules: [], ability: { can: () => true } }) };
    const request: any = { user: { sub: 'support-id' } };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
    await expect(
      new AdminGuard(authorization as any).canActivate(context),
    ).resolves.toBe(true);
  });
});
