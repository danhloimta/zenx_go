import { SetMetadata } from '@nestjs/common';

export type RequiredPermission = { code: string; action: string; subject: string };
export const REQUIRED_PERMISSIONS = 'requiredPermissions';
export const RequirePermission = (permission: RequiredPermission) =>
  SetMetadata(REQUIRED_PERMISSIONS, [permission]);
export const RequireAnyPermission = (...permissions: RequiredPermission[]) =>
  SetMetadata(REQUIRED_PERMISSIONS, permissions);
