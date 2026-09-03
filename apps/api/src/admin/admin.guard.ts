import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../database/prisma.service';
import { AuthenticatedRequest } from '../auth/auth.guard';
import { AdminRole } from '../common/domain';
import { DomainError, ErrorCode } from '../common/errors';
import { REQUIRED_ADMIN_ROLES } from './admin-roles.decorator';

export type AdminRequest = AuthenticatedRequest & {
  admin: { roles: string[] };
};

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const roles = await this.prisma.userRole.findMany({
      where: { userId: request.user.sub },
      select: { role: true },
    });
    const roleCodes = roles.map(({ role }) => role);
    const requiredRoles = this.reflector.getAllAndOverride<AdminRole[]>(REQUIRED_ADMIN_ROLES, [
      context.getHandler(),
      context.getClass(),
    ]) ?? [AdminRole.SUPER_ADMIN];
    if (!requiredRoles.some((role) => roleCodes.includes(role))) {
      throw new DomainError(
        ErrorCode.ADMIN_ACCESS_REQUIRED,
        'Administrator access is required',
        403,
      );
    }
    request.admin = { roles: roleCodes };
    return true;
  }
}
