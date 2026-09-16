import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DomainError, ErrorCode } from '../common/errors';
import { REQUIRED_PERMISSIONS, RequiredPermission } from './permission.decorator';
import { GameAdminRequest } from './game-access.guard';

@Injectable()
export class GamePermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<RequiredPermission[]>(REQUIRED_PERMISSIONS, [context.getHandler(), context.getClass()]);
    if (!required?.length) throw new DomainError(ErrorCode.GAME_PERMISSION_REQUIRED, 'A game permission declaration is required', 403);
    const request = context.switchToHttp().getRequest<GameAdminRequest>();
    if (!required.some((entry) => request.gameAdmin.ability.can(entry.action, entry.subject))) throw new DomainError(ErrorCode.GAME_PERMISSION_REQUIRED, 'Game permission is required', 403);
    return true;
  }
}
