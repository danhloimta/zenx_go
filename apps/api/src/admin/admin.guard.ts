import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuthenticatedRequest } from '../auth/auth.guard';
import { AdminRole } from '../common/domain';
import { DomainError, ErrorCode } from '../common/errors';

export type AdminRequest = AuthenticatedRequest & {
  admin: { roles: string[] };
};

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const roles = await this.prisma.userRole.findMany({
      where: { userId: request.user.sub },
      select: { role: true },
    });
    const roleCodes = roles.map(({ role }) => role);
    if (!roleCodes.includes(AdminRole.SUPER_ADMIN)) {
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
