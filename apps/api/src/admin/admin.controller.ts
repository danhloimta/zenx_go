import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard, AdminRequest } from './admin.guard';
import {
  AdminProfileUpdateDto,
  AdminResetPasswordDto,
  AdminStatusUpdateDto,
  AdminUsersQueryDto,
} from './admin.dto';
import { AdminService } from './admin.service';
import { RequireAdminRoles } from './admin-roles.decorator';
import { AdminRole } from '../common/domain';

@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('me')
  @RequireAdminRoles(AdminRole.SUPER_ADMIN, AdminRole.SUPPORT)
  me(@Req() request: AdminRequest) {
    return this.admin.me(request.user.sub);
  }

  @Get('dashboard')
  dashboard() {
    return this.admin.dashboard();
  }

  @Get('users')
  users(@Query() query: AdminUsersQueryDto) {
    return this.admin.listUsers(query);
  }

  @Get('users/:userId')
  user(@Param('userId') userId: string) {
    return this.admin.getUser(userId);
  }

  @Patch('users/:userId/profile')
  updateProfile(
    @Param('userId') userId: string,
    @Body() dto: AdminProfileUpdateDto,
  ) {
    return this.admin.updateProfile(userId, dto);
  }

  @Patch('users/:userId/status')
  updateStatus(
    @Param('userId') userId: string,
    @Req() request: AdminRequest,
    @Body() dto: AdminStatusUpdateDto,
  ) {
    return this.admin.updateStatus(userId, dto, request.user.sub);
  }

  @Post('users/:userId/revoke-sessions')
  revokeSessions(@Param('userId') userId: string) {
    return this.admin.revokeSessions(userId);
  }

  @Post('users/:userId/reset-password')
  resetPassword(
    @Param('userId') userId: string,
    @Body() dto: AdminResetPasswordDto,
  ) {
    return this.admin.resetPassword(userId, dto);
  }

  @Post('users/:userId/sensitive-profile/reveal')
  revealSensitiveProfile(
    @Param('userId') userId: string,
  ) {
    return this.admin.revealSensitiveProfile(userId);
  }
}
