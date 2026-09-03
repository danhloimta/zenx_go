import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard, AdminRequest } from './admin.guard';
import {
  AdminAuditLogsQueryDto,
  AdminProfileUpdateDto,
  AdminReasonDto,
  AdminResetPasswordDto,
  AdminSensitiveRevealDto,
  AdminStatusUpdateDto,
  AdminUsersQueryDto,
} from './admin.dto';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('me')
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
    @Req() request: AdminRequest,
    @Body() dto: AdminProfileUpdateDto,
  ) {
    return this.admin.updateProfile(userId, dto, this.context(request));
  }

  @Patch('users/:userId/status')
  updateStatus(
    @Param('userId') userId: string,
    @Req() request: AdminRequest,
    @Body() dto: AdminStatusUpdateDto,
  ) {
    return this.admin.updateStatus(userId, dto, this.context(request));
  }

  @Post('users/:userId/revoke-sessions')
  revokeSessions(
    @Param('userId') userId: string,
    @Req() request: AdminRequest,
    @Body() dto: AdminReasonDto,
  ) {
    return this.admin.revokeSessions(userId, dto, this.context(request));
  }

  @Post('users/:userId/reset-password')
  resetPassword(
    @Param('userId') userId: string,
    @Req() request: AdminRequest,
    @Body() dto: AdminResetPasswordDto,
  ) {
    return this.admin.resetPassword(userId, dto, this.context(request));
  }

  @Post('users/:userId/sensitive-profile/reveal')
  revealSensitiveProfile(
    @Param('userId') userId: string,
    @Req() request: AdminRequest,
    @Body() dto: AdminSensitiveRevealDto,
  ) {
    return this.admin.revealSensitiveProfile(userId, dto.reason, this.context(request));
  }

  @Get('audit-logs')
  auditLogs(@Query() query: AdminAuditLogsQueryDto) {
    return this.admin.listAuditLogs(query);
  }

  private context(request: Request) {
    const userAgent = request.get('user-agent');
    return {
      actorUserId: (request as AdminRequest).user.sub,
      ipAddress: request.ip,
      ...(userAgent ? { userAgent } : {}),
    };
  }
}
