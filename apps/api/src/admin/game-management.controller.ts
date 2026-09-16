import { Body, Controller, Get, Param, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard, AdminRequest } from './admin.guard';
import { PermissionGuard } from './permission.guard';
import { RequirePermission } from './permission.decorator';
import { GameAdminsUpdateDto, GameSsoClientUpdateDto } from './game-admin.dto';
import { GameManagementService } from './game-management.service';

@Controller('admin/games')
@UseGuards(AuthGuard, AdminGuard, PermissionGuard)
export class GameManagementController {
  constructor(private readonly games: GameManagementService) {}

  @Get(':gameId/admins')
  @RequirePermission({ code: 'games.manage', action: 'manage', subject: 'Game' })
  listAdmins(@Param('gameId') gameId: string) { return this.games.listAdmins(gameId); }

  @Put(':gameId/admins/:userId')
  @RequirePermission({ code: 'games.manage', action: 'manage', subject: 'Game' })
  replaceAdmins(@Param('gameId') gameId: string, @Param('userId') userId: string, @Body() dto: GameAdminsUpdateDto, @Req() request: AdminRequest) { return this.games.replaceAdmins(gameId, userId, dto, request.user.sub); }

  @Get(':gameId/sso-client')
  @RequirePermission({ code: 'games.manage', action: 'manage', subject: 'Game' })
  getSsoClient(@Param('gameId') gameId: string) { return this.games.getSsoClient(gameId); }

  @Patch(':gameId/sso-client')
  @RequirePermission({ code: 'games.manage', action: 'manage', subject: 'Game' })
  updateSsoClient(@Param('gameId') gameId: string, @Body() dto: GameSsoClientUpdateDto, @Req() request: AdminRequest) { return this.games.updateSsoClient(gameId, dto, request.user.sub); }

  @Post(':gameId/sso-client/rotate-secret')
  @RequirePermission({ code: 'games.manage', action: 'manage', subject: 'Game' })
  rotateSsoSecret(@Param('gameId') gameId: string, @Req() request: AdminRequest) { return this.games.rotateSsoSecret(gameId, request.user.sub); }
}
