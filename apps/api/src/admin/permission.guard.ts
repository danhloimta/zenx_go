import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DomainError, ErrorCode } from '../common/errors';
import { AdminRequest } from './admin.guard';
import { REQUIRED_PERMISSIONS, RequiredPermission } from './permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permissions = this.reflector.getAllAndOverride<RequiredPermission[]>(REQUIRED_PERMISSIONS, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!permissions?.length) {
      throw new DomainError(ErrorCode.PERMISSION_REQUIRED, 'A permission declaration is required', 403);
    }
    const request = context.switchToHttp().getRequest<AdminRequest>();
    if (!permissions.some((permission) => request.admin.ability.can(permission.action, permission.subject))) {
      throw new DomainError(ErrorCode.PERMISSION_REQUIRED, 'Permission is required', 403);
    }
    return true;
  }
}
