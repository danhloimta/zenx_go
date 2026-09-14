import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard, AdminRequest } from './admin.guard';
import { PermissionGuard } from './permission.guard';
import { RequireAnyPermission, RequirePermission } from './permission.decorator';
import { AccessAdminService } from './access.service';
import { DomainError, ErrorCode } from '../common/errors';
import { CreateRoleDto, DeleteRoleDto, ReplaceRolePermissionsDto, RolesQueryDto, UpdateRoleDto } from './access.dto';
import { PERMISSIONS } from './permissions';

const roleRead = PERMISSIONS.ROLES_VIEW;
@Controller('admin/access')
@UseGuards(AuthGuard, AdminGuard, PermissionGuard)
export class AccessAdminController {
  constructor(private readonly access: AccessAdminService) {}
  @Get('roles') @RequirePermission(roleRead) roles(@Query() query: RolesQueryDto) { return this.access.listRoles(query.active); }
  @Get('roles/:roleId') @RequirePermission(roleRead) role(@Param('roleId') roleId: string) { return this.access.getRole(roleId); }
  @Get('permissions') @RequirePermission(roleRead) permissions() { return this.access.listPermissions(); }
  @Post('roles') @RequirePermission(PERMISSIONS.ROLES_CREATE) create(@Body() dto: CreateRoleDto, @Req() request: AdminRequest) { return this.access.createRole(dto, request.user.sub, request.ip, request.headers['user-agent']); }
  @Patch('roles/:roleId') @RequireAnyPermission(PERMISSIONS.ROLES_UPDATE, PERMISSIONS.ROLES_PERMISSIONS_ASSIGN) update(@Param('roleId') roleId: string, @Body() dto: UpdateRoleDto, @Req() request: AdminRequest) {
    if (dto.permissionIds !== undefined && !request.admin.ability.can(PERMISSIONS.ROLES_PERMISSIONS_ASSIGN.action, PERMISSIONS.ROLES_PERMISSIONS_ASSIGN.subject)) throw new DomainError(ErrorCode.PERMISSION_REQUIRED, 'Permission is required', 403);
    if ((dto.name !== undefined || dto.description !== undefined || dto.isActive !== undefined) && !request.admin.ability.can(PERMISSIONS.ROLES_UPDATE.action, PERMISSIONS.ROLES_UPDATE.subject)) throw new DomainError(ErrorCode.PERMISSION_REQUIRED, 'Permission is required', 403);
    return this.access.updateRole(roleId, dto, request.user.sub, request.ip, request.headers['user-agent']);
  }
  @Delete('roles/:roleId') @RequirePermission(PERMISSIONS.ROLES_DELETE) remove(@Param('roleId') roleId: string, @Body() dto: DeleteRoleDto, @Req() request: AdminRequest) { return this.access.deleteRole(roleId, dto, request.user.sub, request.ip, request.headers['user-agent']); }
  @Put('roles/:roleId/permissions') @RequirePermission(PERMISSIONS.ROLES_PERMISSIONS_ASSIGN) replacePermissions(@Param('roleId') roleId: string, @Body() dto: ReplaceRolePermissionsDto, @Req() request: AdminRequest) { return this.access.updateRole(roleId, dto, request.user.sub, request.ip, request.headers['user-agent']); }
}
