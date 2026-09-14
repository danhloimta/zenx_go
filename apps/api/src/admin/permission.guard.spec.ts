import { ExecutionContext } from '@nestjs/common';
import { PermissionGuard } from './permission.guard';
import { DomainError } from '../common/errors';

describe('PermissionGuard', () => {
  it('denies an admin route without declared permissions', () => {
    const context = {
      switchToHttp: () => ({ getRequest: () => ({ admin: { ability: { can: () => true } } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
    expect(() => new PermissionGuard({ getAllAndOverride: () => undefined } as any).canActivate(context)).toThrow(DomainError);
  });

  it('allows a declared permission when CASL grants it', () => {
    const context = {
      switchToHttp: () => ({ getRequest: () => ({ admin: { ability: { can: (action: string, subject: string) => action === 'read' && subject === 'User' } } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
    const reflector = { getAllAndOverride: () => [{ code: 'users.view', action: 'read', subject: 'User' }] };
    expect(new PermissionGuard(reflector as any).canActivate(context)).toBe(true);
  });
});
