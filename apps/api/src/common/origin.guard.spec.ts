import { ForbiddenException } from '@nestjs/common';
import { OriginGuard } from './origin.guard';

describe('OriginGuard', () => {
  const policy = { isAllowedRequestOrigin: jest.fn() };
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
  const guard = new OriginGuard(policy as never, reflector as never);

  const context = (method: string, origin?: string) => ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => ({ method, headers: origin ? { origin } : {} }) }),
  }) as never;

  beforeEach(() => {
    jest.clearAllMocks();
    reflector.getAllAndOverride.mockReturnValue(false);
  });

  it('requires a validated Origin for state-changing requests', async () => {
    await expect(guard.canActivate(context('POST'))).rejects.toBeInstanceOf(ForbiddenException);
    expect(policy.isAllowedRequestOrigin).toHaveBeenCalledWith(undefined);
    policy.isAllowedRequestOrigin.mockResolvedValue(true);
    await expect(guard.canActivate(context('POST', 'https://lucdia.zenxgo.io.vn'))).resolves.toBe(true);
  });

  it('does not require Origin for safe methods and supports signed webhook bypass metadata', async () => {
    await expect(guard.canActivate(context('GET'))).resolves.toBe(true);
    reflector.getAllAndOverride.mockReturnValue(true);
    await expect(guard.canActivate(context('POST'))).resolves.toBe(true);
    expect(policy.isAllowedRequestOrigin).not.toHaveBeenCalled();
  });
});
