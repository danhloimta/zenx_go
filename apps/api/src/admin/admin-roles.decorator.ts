import { SetMetadata } from '@nestjs/common';
import { AdminRole } from '../common/domain';

export const REQUIRED_ADMIN_ROLES = 'requiredAdminRoles';

export const RequireAdminRoles = (...roles: AdminRole[]) =>
  SetMetadata(REQUIRED_ADMIN_ROLES, roles);
