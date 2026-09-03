import { ExecutionContext } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { DomainError } from '../common/errors';

describe('AdminGuard', () => {
  it('accepts a live SUPER_ADMIN role from the database', async () => {
    const prisma = {
      userRole: {
        findMany: jest.fn().mockResolvedValue([{ role: 'SUPER_ADMIN' }, { role: 'FUTURE_ROLE' }]),
      },
    };
    const request: any = { user: { sub: 'admin-id' } };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    await expect(new AdminGuard(prisma as any).canActivate(context)).resolves.toBe(true);
    expect(request.admin).toEqual({ roles: ['SUPER_ADMIN', 'FUTURE_ROLE'] });
  });

  it('rejects users without SUPER_ADMIN', async () => {
    const prisma = { userRole: { findMany: jest.fn().mockResolvedValue([{ role: 'EDITOR' }]) } };
    const context = {
      switchToHttp: () => ({ getRequest: () => ({ user: { sub: 'user-id' } }) }),
    } as unknown as ExecutionContext;
    await expect(new AdminGuard(prisma as any).canActivate(context)).rejects.toBeInstanceOf(
      DomainError,
    );
  });
});
