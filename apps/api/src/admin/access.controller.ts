import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard, AdminRequest } from './admin.guard';
import { PermissionGuard } from './permission.guard';
import { RequirePermission } from './permission.decorator';
import { AccessAdminService } from './access.service';
import { CreateRoleDto, ReplaceRolePermissionsDto, RolesQueryDto, UpdateRoleDto } from './access.dto';
import { PERMISSIONS } from './permissions';

const roleRead = PERMISSIONS.ROLES_VIEW;
@Controller('admin/access')
@UseGuards(AuthGuard, AdminGuard, PermissionGuard)
export class AccessAdminController {
  constructor(private readonly access: AccessAdminService) {}
  @Get('roles') @RequirePermission(roleRead) roles(@Query() query: RolesQueryDto) { return this.access.listRoles(query.active); }
  @Get('roles/:roleId') @RequirePermission(roleRead) role(@Param('roleId') roleId: string) { return this.access.getRole(roleId); }
  @Get('permissions') @RequirePermission(roleRead) permissions() { return this.access.listPermissions(); }
  @Post('roles') @RequirePermission(PERMISSIONS.ROLES_CREATE) create(@Body() dto: CreateRoleDto, @Req() request: AdminRequest) { return this.access.createRole(dto, request.user.sub); }
  @Patch('roles/:roleId') @RequirePermission(PERMISSIONS.ROLES_UPDATE) update(@Param('roleId') roleId: string, @Body() dto: UpdateRoleDto, @Req() request: AdminRequest) { return this.access.updateRole(roleId, dto, request.user.sub); }
  @Delete('roles/:roleId') @RequirePermission(PERMISSIONS.ROLES_DELETE) remove(@Param('roleId') roleId: string, @Query('reason') reason: string | undefined, @Req() request: AdminRequest) { return this.access.deleteRole(roleId, request.user.sub, reason); }
  @Put('roles/:roleId/permissions') @RequirePermission(PERMISSIONS.ROLES_PERMISSIONS_ASSIGN) replacePermissions(@Param('roleId') roleId: string, @Body() dto: ReplaceRolePermissionsDto, @Req() request: AdminRequest) { return this.access.replacePermissions(roleId, dto, request.user.sub); }
}
