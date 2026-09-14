import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthenticatedRequest } from '../auth/auth.guard';
import { DomainError, ErrorCode } from '../common/errors';
import { AuthorizationAccess, AuthorizationService } from './authorization.service';

export type AdminRequest = AuthenticatedRequest & {
  admin: AuthorizationAccess;
};

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly authorization: AuthorizationService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const access = await this.authorization.getAccess(request.user.sub);
    if (!access.roles.length) {
      throw new DomainError(
        ErrorCode.ADMIN_ACCESS_REQUIRED,
        'Administrator access is required',
        403,
      );
    }
    request.admin = access;
    return true;
  }
}
