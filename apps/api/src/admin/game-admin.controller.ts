import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedRequest } from '../auth/auth.guard';
import { GameAccessGuard, GameAdminRequest } from './game-access.guard';
import { GamePermissionGuard } from './game-permission.guard';
import { RequireAnyPermission, RequirePermission } from './permission.decorator';
import { GameAdminService } from './game-admin.service';
import { GamePlayersQueryDto, GamePlayerStatusDto, GamePlayerTemporaryLockDto, GamePlayerPermanentBanDto, GamePlayerReleaseRestrictionDto, GamePlayerChatRestrictionDto, GamePlayerSupportNoteDto, GamePlayerActivityQueryDto, GameAuditQueryDto, GameMaintenanceUpdateDto, GameSupportTicketsQueryDto } from './game-admin.dto';
import { AdminProfileUpdateDto } from './admin.dto';
import { CreateSupportMessageDto, SupportTicketMessagesQueryDto } from '../support/dto';

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

  @Get('games/:gameId/players/:userId/profile')
  @UseGuards(GameAccessGuard, GamePermissionGuard)
  @RequirePermission({ code: 'game.players.profile.manage', action: 'manage', subject: 'GamePlayerProfile' })
  getPlayerProfile(@Param('gameId') gameId: string, @Param('userId') userId: string) { return this.games.getPlayerProfile(gameId, userId); }

  @Patch('games/:gameId/players/:userId/profile')
  @UseGuards(GameAccessGuard, GamePermissionGuard)
  @RequirePermission({ code: 'game.players.profile.manage', action: 'manage', subject: 'GamePlayerProfile' })
  updatePlayerProfile(@Param('gameId') gameId: string, @Param('userId') userId: string, @Body() dto: AdminProfileUpdateDto, @Req() request: GameAdminRequest) { return this.games.updatePlayerProfile(gameId, userId, dto, request.user.sub); }

  @Patch('games/:gameId/players/:userId/status')
  @UseGuards(GameAccessGuard, GamePermissionGuard)
  @RequirePermission({ code: 'game.players.moderate', action: 'moderate', subject: 'GamePlayer' })
  updatePlayerStatus(@Param('gameId') gameId: string, @Param('userId') userId: string, @Body() dto: GamePlayerStatusDto, @Req() request: GameAdminRequest) { return this.games.updatePlayerStatus(gameId, userId, dto, request.user.sub); }

  @Patch('games/:gameId/players/:userId/temporary-lock')
  @UseGuards(GameAccessGuard, GamePermissionGuard)
  @RequirePermission({ code: 'game.players.temporary-lock', action: 'lock', subject: 'GamePlayer' })
  temporaryLock(@Param('gameId') gameId: string, @Param('userId') userId: string, @Body() dto: GamePlayerTemporaryLockDto, @Req() request: GameAdminRequest) { return this.games.temporaryLockPlayer(gameId, userId, dto, request.user.sub); }

  @Patch('games/:gameId/players/:userId/permanent-ban')
  @UseGuards(GameAccessGuard, GamePermissionGuard)
  @RequirePermission({ code: 'game.players.permanent-ban', action: 'ban', subject: 'GamePlayer' })
  permanentBan(@Param('gameId') gameId: string, @Param('userId') userId: string, @Body() dto: GamePlayerPermanentBanDto, @Req() request: GameAdminRequest) { return this.games.permanentBanPlayer(gameId, userId, dto, request.user.sub); }

  @Patch('games/:gameId/players/:userId/restriction/release')
  @UseGuards(GameAccessGuard, GamePermissionGuard)
  @RequireAnyPermission(
    { code: 'game.players.temporary-lock', action: 'lock', subject: 'GamePlayer' },
    { code: 'game.players.permanent-ban', action: 'ban', subject: 'GamePlayer' },
    { code: 'game.players.moderate', action: 'moderate', subject: 'GamePlayer' },
  )
  releaseRestriction(@Param('gameId') gameId: string, @Param('userId') userId: string, @Body() dto: GamePlayerReleaseRestrictionDto, @Req() request: GameAdminRequest) { return this.games.releasePlayerRestriction(gameId, userId, dto, request.user.sub, request.gameAdmin); }

  @Patch('games/:gameId/players/:userId/chat-restriction')
  @UseGuards(GameAccessGuard, GamePermissionGuard)
  @RequirePermission({ code: 'game.players.chat.moderate', action: 'moderate', subject: 'GamePlayerChat' })
  chatRestriction(@Param('gameId') gameId: string, @Param('userId') userId: string, @Body() dto: GamePlayerChatRestrictionDto, @Req() request: GameAdminRequest) { return this.games.updatePlayerChatRestriction(gameId, userId, dto, request.user.sub); }

  @Patch('games/:gameId/players/:userId/support-note')
  @UseGuards(GameAccessGuard, GamePermissionGuard)
  @RequirePermission({ code: 'game.players.support-note', action: 'support-note', subject: 'GamePlayer' })
  updatePlayerSupportNote(@Param('gameId') gameId: string, @Param('userId') userId: string, @Body() dto: GamePlayerSupportNoteDto, @Req() request: GameAdminRequest) { return this.games.updatePlayerSupportNote(gameId, userId, dto, request.user.sub); }

  @Get('games/:gameId/players/:userId/activity')
  @UseGuards(GameAccessGuard, GamePermissionGuard)
  @RequirePermission({ code: 'game.players.view', action: 'read', subject: 'GamePlayer' })
  playerActivity(@Param('gameId') gameId: string, @Param('userId') userId: string, @Query() query: GamePlayerActivityQueryDto) { return this.games.playerActivity(gameId, userId, query); }

  @Get('games/:gameId/operations')
  @UseGuards(GameAccessGuard, GamePermissionGuard)
  @RequirePermission({ code: 'game.operations.manage', action: 'manage', subject: 'GameOperations' })
  operations(@Param('gameId') gameId: string) { return this.games.operations(gameId); }

  @Patch('games/:gameId/operations/maintenance')
  @UseGuards(GameAccessGuard, GamePermissionGuard)
  @RequirePermission({ code: 'game.operations.manage', action: 'manage', subject: 'GameOperations' })
  updateMaintenance(@Param('gameId') gameId: string, @Body() dto: GameMaintenanceUpdateDto, @Req() request: GameAdminRequest) { return this.games.updateMaintenance(gameId, dto, request.user.sub); }

  @Get('games/:gameId/audit')
  @UseGuards(GameAccessGuard, GamePermissionGuard)
  @RequirePermission({ code: 'game.audit.view', action: 'read', subject: 'GameAudit' })
  audit(@Param('gameId') gameId: string, @Query() query: GameAuditQueryDto) { return this.games.audit(gameId, query); }

  @Get('games/:gameId/support/tickets')
  @UseGuards(GameAccessGuard, GamePermissionGuard)
  @RequirePermission({ code: 'game.support.manage', action: 'manage', subject: 'GameSupport' })
  supportTickets(@Param('gameId') gameId: string, @Query() query: GameSupportTicketsQueryDto) { return this.games.listSupportTickets(gameId, query); }

  @Get('games/:gameId/support/tickets/:ticketNo')
  @UseGuards(GameAccessGuard, GamePermissionGuard)
  @RequirePermission({ code: 'game.support.manage', action: 'manage', subject: 'GameSupport' })
  supportTicket(@Param('gameId') gameId: string, @Param('ticketNo') ticketNo: string) { return this.games.getSupportTicket(gameId, ticketNo); }

  @Get('games/:gameId/support/tickets/:ticketNo/messages')
  @UseGuards(GameAccessGuard, GamePermissionGuard)
  @RequirePermission({ code: 'game.support.manage', action: 'manage', subject: 'GameSupport' })
  supportMessages(@Param('gameId') gameId: string, @Param('ticketNo') ticketNo: string, @Query() query: SupportTicketMessagesQueryDto) { return this.games.getSupportMessages(gameId, ticketNo, query); }

  @Post('games/:gameId/support/tickets/:ticketNo/messages')
  @UseGuards(GameAccessGuard, GamePermissionGuard)
  @RequirePermission({ code: 'game.support.manage', action: 'manage', subject: 'GameSupport' })
  replySupportTicket(@Param('gameId') gameId: string, @Param('ticketNo') ticketNo: string, @Body() dto: CreateSupportMessageDto, @Req() request: GameAdminRequest) { return this.games.replySupportTicket(gameId, ticketNo, dto, request.user.sub); }
}
