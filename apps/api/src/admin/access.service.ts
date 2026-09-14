import { Injectable } from '@nestjs/common';
import { DomainError, ErrorCode } from '../common/errors';
import { PrismaService } from '../database/prisma.service';
import { CreateRoleDto, ReplaceRolePermissionsDto, UpdateRoleDto } from './access.dto';
import { PERMISSIONS } from './permissions';

const ROLE_INCLUDE = {
  permissions: { include: { permission: true }, orderBy: { permission: { sortOrder: 'asc' as const } } },
  _count: { select: { users: true } },
} as const;

@Injectable()
export class AccessAdminService {
  constructor(private readonly prisma: PrismaService) {}

  listRoles(active?: boolean) {
    return this.prisma.role.findMany({ where: active === undefined ? {} : { isActive: active }, include: ROLE_INCLUDE, orderBy: [{ isSystem: 'desc' }, { name: 'asc' }] }).then((roles) => roles.map((role) => this.serializeRole(role)));
  }

  async getRole(roleId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId }, include: ROLE_INCLUDE });
    if (!role) throw new DomainError(ErrorCode.ROLE_NOT_FOUND, 'Role not found', 404);
    return this.serializeRole(role);
  }

  async listPermissions() {
    return this.prisma.permission.findMany({ where: { isActive: true }, orderBy: [{ module: 'asc' }, { sortOrder: 'asc' }] });
  }

  async createRole(dto: CreateRoleDto, actorUserId: string) {
    try {
      const role = await this.prisma.$transaction(async (tx) => {
        const adminAccess = await tx.permission.findUnique({ where: { code: PERMISSIONS.ADMIN_ACCESS.code }, select: { id: true } });
        if (!adminAccess) throw new DomainError(ErrorCode.PERMISSION_NOT_FOUND, 'Admin access permission is unavailable', 500);
        const created = await tx.role.create({ data: { code: dto.code, name: dto.name.trim(), description: dto.description?.trim() ?? null }, include: ROLE_INCLUDE });
        await tx.rolePermission.create({ data: { roleId: created.id, permissionId: adminAccess.id } });
        const result = await tx.role.findUniqueOrThrow({ where: { id: created.id }, include: ROLE_INCLUDE });
        await this.audit(tx, actorUserId, 'ROLE_CREATED', 'ROLE', result.id, null, this.serializeRole(result), dto.reason);
        return result;
      });
      return this.serializeRole(role);
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') throw new DomainError(ErrorCode.ROLE_CODE_EXISTS, 'Role code already exists', 409);
      throw error;
    }
  }

  async updateRole(roleId: string, dto: UpdateRoleDto, actorUserId: string) {
    const current = await this.prisma.role.findUnique({ where: { id: roleId }, include: ROLE_INCLUDE });
    if (!current) throw new DomainError(ErrorCode.ROLE_NOT_FOUND, 'Role not found', 404);
    if (current.isSystem) throw new DomainError(ErrorCode.SYSTEM_ROLE_PROTECTED, 'System roles cannot be changed', 400);
    if (current.updatedAt.getTime() !== new Date(dto.expectedUpdatedAt).getTime()) throw new DomainError(ErrorCode.STALE_ROLE_UPDATE, 'Role was changed by another operator', 409);
    const updated = await this.prisma.role.update({ where: { id: roleId }, data: { ...(dto.name !== undefined ? { name: dto.name.trim() } : {}), ...(dto.description !== undefined ? { description: dto.description?.trim() ?? null } : {}), ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}) }, include: ROLE_INCLUDE });
    await this.audit(this.prisma, actorUserId, 'ROLE_UPDATED', 'ROLE', roleId, this.serializeRole(current), this.serializeRole(updated), dto.reason);
    if (dto.isActive === false) await this.invalidateRoleUsers(roleId);
    return this.serializeRole(updated);
  }

  async deleteRole(roleId: string, actorUserId: string, reason?: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId }, include: ROLE_INCLUDE });
    if (!role) throw new DomainError(ErrorCode.ROLE_NOT_FOUND, 'Role not found', 404);
    if (role.isSystem) throw new DomainError(ErrorCode.SYSTEM_ROLE_PROTECTED, 'System roles cannot be deleted', 400);
    if (role._count.users) throw new DomainError(ErrorCode.ROLE_IN_USE, 'Role is assigned to users', 409);
    await this.prisma.role.delete({ where: { id: roleId } });
    await this.audit(this.prisma, actorUserId, 'ROLE_DELETED', 'ROLE', roleId, this.serializeRole(role), null, reason);
    return { deleted: true };
  }

  async replacePermissions(roleId: string, dto: ReplaceRolePermissionsDto, actorUserId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId }, include: ROLE_INCLUDE });
    if (!role) throw new DomainError(ErrorCode.ROLE_NOT_FOUND, 'Role not found', 404);
    if (role.isSystem) throw new DomainError(ErrorCode.SYSTEM_ROLE_PROTECTED, 'System role permissions cannot be changed', 400);
    if (role.updatedAt.getTime() !== new Date(dto.expectedUpdatedAt).getTime()) throw new DomainError(ErrorCode.STALE_ROLE_UPDATE, 'Role was changed by another operator', 409);
    const adminAccess = await this.prisma.permission.findUnique({ where: { code: PERMISSIONS.ADMIN_ACCESS.code }, select: { id: true } });
    if (!adminAccess) throw new DomainError(ErrorCode.PERMISSION_NOT_FOUND, 'Admin access permission is unavailable', 500);
    const ids = [...new Set([...dto.permissionIds, adminAccess.id])];
    const permissions = ids.length ? await this.prisma.permission.findMany({ where: { id: { in: ids }, isActive: true }, select: { id: true } }) : [];
    if (permissions.length !== ids.length) throw new DomainError(ErrorCode.PERMISSION_NOT_FOUND, 'One or more permissions are unavailable', 400);
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId } });
      if (ids.length) await tx.rolePermission.createMany({ data: ids.map((permissionId) => ({ roleId, permissionId })) });
      const result = await tx.role.update({ where: { id: roleId }, data: { updatedAt: new Date() }, include: ROLE_INCLUDE });
      await this.invalidateRoleUsers(roleId, tx);
      await this.audit(tx, actorUserId, 'ROLE_PERMISSIONS_REPLACED', 'ROLE', roleId, this.serializeRole(role), this.serializeRole(result), dto.reason);
      return result;
    });
    return this.serializeRole(updated);
  }

  private async invalidateRoleUsers(roleId: string, client: Pick<PrismaService, 'userRole' | 'user' | 'refreshSession'> = this.prisma) {
    const userIds = (await client.userRole.findMany({ where: { roleId }, select: { userId: true } })).map(({ userId }) => userId);
    if (!userIds.length) return;
    await Promise.all([
      client.user.updateMany({ where: { id: { in: userIds } }, data: { authVersion: { increment: 1 } } }),
      client.refreshSession.updateMany({ where: { userId: { in: userIds }, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);
  }

  private audit(client: Pick<PrismaService, 'authorizationAuditLog'>, actorUserId: string, action: string, targetType: string, targetId: string, beforeData: unknown, afterData: unknown, reason?: string) {
    return client.authorizationAuditLog.create({ data: { actorUserId, action, targetType, targetId, beforeData: beforeData === null ? null : JSON.stringify(beforeData), afterData: afterData === null ? null : JSON.stringify(afterData), reason: reason?.trim() || null } });
  }

  private serializeRole(role: any) {
    return { id: role.id, code: role.code, name: role.name, description: role.description, isSystem: role.isSystem, isActive: role.isActive, createdAt: role.createdAt, updatedAt: role.updatedAt, userCount: role._count.users, permissions: role.permissions.map(({ permission }: any) => permission) };
  }
}
