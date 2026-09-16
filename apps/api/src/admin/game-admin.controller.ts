import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedRequest } from '../auth/auth.guard';
import { GameAccessGuard, GameAdminRequest } from './game-access.guard';
import { GamePermissionGuard } from './game-permission.guard';
import { RequirePermission } from './permission.decorator';
import { GameAdminService } from './game-admin.service';
import { GamePlayersQueryDto, GamePlayerStatusDto, GamePlayerSupportNoteDto, GamePlayerActivityQueryDto, GameAuditQueryDto } from './game-admin.dto';

@Controller('game-admin')
@UseGuards(AuthGuard)
export class GameAdminController {
  constructor(private readonly games: GameAdminService) {}

  @Get('context/by-subdomain/:subdomain')
  context(@Param('subdomain') subdomain: string, @Req() request: AuthenticatedRequest) { return this.games.context(request.user.sub, subdomain); }

  @Get('games/:gameId/dashboard')
  @UseGuards(GameAccessGuard, GamePermissionGuard)
  @RequirePermission({ code: 'game.dashboard.view', action: 'read', subject: 'GameDashboard' })
  dashboard(@Param('gameId') gameId: string) { return this.games.dashboard(gameId); }

  @Get('games/:gameId/players')
  @UseGuards(GameAccessGuard, GamePermissionGuard)
  @RequirePermission({ code: 'game.players.view', action: 'read', subject: 'GamePlayer' })
  listPlayers(@Param('gameId') gameId: string, @Query() query: GamePlayersQueryDto) { return this.games.listPlayers(gameId, query); }

  @Get('games/:gameId/players/:userId')
  @UseGuards(GameAccessGuard, GamePermissionGuard)
  @RequirePermission({ code: 'game.players.view', action: 'read', subject: 'GamePlayer' })
  getPlayer(@Param('gameId') gameId: string, @Param('userId') userId: string) { return this.games.getPlayer(gameId, userId); }

  @Patch('games/:gameId/players/:userId/status')
  @UseGuards(GameAccessGuard, GamePermissionGuard)
  @RequirePermission({ code: 'game.players.moderate', action: 'moderate', subject: 'GamePlayer' })
  updatePlayerStatus(@Param('gameId') gameId: string, @Param('userId') userId: string, @Body() dto: GamePlayerStatusDto, @Req() request: GameAdminRequest) { return this.games.updatePlayerStatus(gameId, userId, dto, request.user.sub); }

  @Patch('games/:gameId/players/:userId/support-note')
  @UseGuards(GameAccessGuard, GamePermissionGuard)
  @RequirePermission({ code: 'game.players.support-note', action: 'support-note', subject: 'GamePlayer' })
  updatePlayerSupportNote(@Param('gameId') gameId: string, @Param('userId') userId: string, @Body() dto: GamePlayerSupportNoteDto, @Req() request: GameAdminRequest) { return this.games.updatePlayerSupportNote(gameId, userId, dto, request.user.sub); }

  @Get('games/:gameId/players/:userId/activity')
  @UseGuards(GameAccessGuard, GamePermissionGuard)
  @RequirePermission({ code: 'game.players.view', action: 'read', subject: 'GamePlayer' })
  playerActivity(@Param('gameId') gameId: string, @Param('userId') userId: string, @Query() query: GamePlayerActivityQueryDto) { return this.games.playerActivity(gameId, userId, query); }

  @Get('games/:gameId/audit')
  @UseGuards(GameAccessGuard, GamePermissionGuard)
  @RequirePermission({ code: 'game.audit.view', action: 'read', subject: 'GameAudit' })
  audit(@Param('gameId') gameId: string, @Query() query: GameAuditQueryDto) { return this.games.audit(gameId, query); }
}
