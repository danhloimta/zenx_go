import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { DomainError } from '../common/errors';

function context(request: any, allowPending = false) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
    allowPending,
  } as unknown as ExecutionContext;
}

describe('AuthGuard', () => {
  it('rejects a token with a stale auth version', async () => {
    const jwt = {
      verifyAsync: jest
        .fn()
        .mockResolvedValue({ sub: 'user-id', username: 'user', type: 'access', av: 1 }),
    };
    const prisma = {
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ status: 'ACTIVE', authVersion: 2, mustChangePassword: false }),
      },
    };
    const request: any = { cookies: { zenx_access: 'token' } };
    await expect(
      new AuthGuard(
        jwt as any,
        prisma as any,
        { getAllAndOverride: () => false } as any,
      ).canActivate(context(request)),
    ).rejects.toThrow('Authentication required');
  });

  it('blocks normal routes while a temporary password is pending', async () => {
    const jwt = {
      verifyAsync: jest
        .fn()
        .mockResolvedValue({ sub: 'user-id', username: 'user', type: 'access', av: 0 }),
    };
    const prisma = {
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ status: 'ACTIVE', authVersion: 0, mustChangePassword: true }),
      },
    };
    const request: any = { cookies: { zenx_access: 'token' } };
    await expect(
      new AuthGuard(
        jwt as any,
        prisma as any,
        { getAllAndOverride: () => false } as any,
      ).canActivate(context(request)),
    ).rejects.toMatchObject({ code: 'PASSWORD_CHANGE_REQUIRED' } satisfies Partial<DomainError>);
  });

  it('allows account-me/change-password routes while a temporary password is pending', async () => {
    const jwt = {
      verifyAsync: jest
        .fn()
        .mockResolvedValue({ sub: 'user-id', username: 'user', type: 'access', av: 0 }),
    };
    const prisma = {
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ status: 'ACTIVE', authVersion: 0, mustChangePassword: true }),
      },
    };
    const request: any = { cookies: { zenx_access: 'token' } };
    await expect(
      new AuthGuard(
        jwt as any,
        prisma as any,
        { getAllAndOverride: () => true } as any,
      ).canActivate(context(request)),
    ).resolves.toBe(true);
    expect(request.user.mustChangePassword).toBe(true);
  });
});
