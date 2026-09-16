import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard, AdminRequest } from './admin.guard';
import {
  AdminExpectedUpdateDto,
  AdminProfileUpdateDto,
  AdminResetPasswordDto,
  AdminRolesUpdateDto,
  AdminStatusUpdateDto,
  AdminUpdateSensitiveIdentityDto,
  AdminUsersQueryDto,
} from './admin.dto';
import { AdminService } from './admin.service';
import { AccountStatus } from '../common/domain';
import { PermissionGuard } from './permission.guard';
import { RequirePermission } from './permission.decorator';
import { ActivityLogsQueryDto } from './admin.dto';
import { Request, Response } from 'express';

@Controller('admin')
@UseGuards(AuthGuard, AdminGuard, PermissionGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('me')
  @RequirePermission({ code: 'admin.access', action: 'access', subject: 'Admin' })
  async me(@Req() request: AdminRequest) {
    const user = await this.admin.me(request.user.sub);
    return { ...user, permissions: request.admin.permissionCodes, abilityRules: request.admin.abilityRules };
  }

  @Get('dashboard')
  @RequirePermission({ code: 'admin.dashboard.view', action: 'read', subject: 'Dashboard' })
  dashboard() {
    return this.admin.dashboard();
  }

  @Get('users')
  @RequirePermission({ code: 'users.view', action: 'read', subject: 'User' })
  users(@Query() query: AdminUsersQueryDto) {
    return this.admin.listUsers(query);
  }

  @Get('users/:userId')
  @RequirePermission({ code: 'users.view', action: 'read', subject: 'User' })
  user(@Param('userId') userId: string) {
    return this.admin.getUser(userId);
  }

  @Get('users/:userId/activity-logs')
  @RequirePermission({ code: 'users.view', action: 'read', subject: 'User' })
  async activityLogs(@Param('userId') userId: string, @Query() query: ActivityLogsQueryDto, @Res({ passthrough: true }) response: Response) {
    response.setHeader('Cache-Control', 'no-store');
    return this.admin.activityLogs(userId, query);
  }

  @Patch('users/:userId/profile')
  @RequirePermission({ code: 'users.profile.update', action: 'update-profile', subject: 'User' })
  updateProfile(
    @Param('userId') userId: string,
    @Req() request: AdminRequest & Request,
    @Body() dto: AdminProfileUpdateDto,
  ) {
    return this.admin.updateProfile(userId, dto, requestContext(request));
  }

  @Patch('users/:userId/status')
  @RequirePermission({ code: 'users.status.update', action: 'update-status', subject: 'User' })
  updateStatus(
    @Param('userId') userId: string,
    @Req() request: AdminRequest & Request,
    @Body() dto: AdminStatusUpdateDto,
  ) {
    return this.admin.updateStatus(userId, dto, request.user.sub, requestContext(request));
  }

  @Patch('users/:userId/roles')
  @RequirePermission({ code: 'users.roles.assign', action: 'assign-role', subject: 'User' })
  updateRoles(
    @Param('userId') userId: string,
    @Req() request: AdminRequest & Request,
    @Body() dto: AdminRolesUpdateDto,
  ) {
    return this.admin.updateRoles(userId, dto, request.user.sub, requestContext(request));
  }

  @Delete('users/:userId')
  @RequirePermission({ code: 'users.status.update', action: 'update-status', subject: 'User' })
  deleteUser(
    @Param('userId') userId: string,
    @Req() request: AdminRequest & Request,
    @Body() dto: AdminExpectedUpdateDto,
  ) {
    return this.admin.updateStatus(
      userId,
      { status: AccountStatus.DELETED, expectedUpdatedAt: dto.expectedUpdatedAt },
      request.user.sub, requestContext(request),
    );
  }

  @Post('users/:userId/revoke-sessions')
  @RequirePermission({ code: 'users.sessions.revoke', action: 'revoke-session', subject: 'User' })
  revokeSessions(@Param('userId') userId: string, @Req() request: AdminRequest & Request) {
    return this.admin.revokeSessions(userId, requestContext(request));
  }

  @Post('users/:userId/reset-password')
  @RequirePermission({ code: 'users.password.reset', action: 'reset-password', subject: 'User' })
  resetPassword(
    @Param('userId') userId: string,
    @Body() dto: AdminResetPasswordDto, @Req() request: AdminRequest & Request,
  ) {
    return this.admin.resetPassword(userId, dto, requestContext(request));
  }

  @Post('users/:userId/sensitive-profile/reveal')
  @RequirePermission({ code: 'users.sensitive.view', action: 'view-sensitive', subject: 'User' })
  revealSensitiveProfile(
    @Param('userId') userId: string,
  ) {
    return this.admin.revealSensitiveProfile(userId);
  }

  @Patch('users/:userId/sensitive-profile/identity')
  @RequirePermission({ code: 'users.sensitive.update', action: 'update-sensitive', subject: 'User' })
  updateSensitiveIdentity(
    @Param('userId') userId: string,
    @Req() request: AdminRequest & Request,
    @Body() dto: AdminUpdateSensitiveIdentityDto,
  ) {
    return this.admin.updateSensitiveIdentity(userId, dto, requestContext(request));
  }
}

function requestContext(request: Request) {
  const context = { ipAddress: request.ip, userAgent: request.headers['user-agent'] };
  return context.ipAddress || context.userAgent ? context : undefined;
}
