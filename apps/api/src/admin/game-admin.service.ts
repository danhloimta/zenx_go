import { Injectable } from '@nestjs/common';
import { DomainError, ErrorCode } from '../common/errors';
import { PrismaService } from '../database/prisma.service';
import { GamePlayersQueryDto, GamePlayerStatusDto, GamePlayerSupportNoteDto, GamePlayerActivityQueryDto, GameAuditQueryDto, GameMaintenanceUpdateDto } from './game-admin.dto';
import { GameAccessService } from './game-access.service';
import { AdminService } from './admin.service';
import { AdminProfileUpdateDto } from './admin.dto';
import { vietnamCalendarStart, vietnamDaysAgoStart } from './game-metrics';
import { auditRangeEnd } from './game-audit-date-range';

const playerInclude = { user: { select: { id: true, username: true, profile: { select: { fullName: true, avatarUrl: true } } } } } as const;

@Injectable()
export class GameAdminService {
  constructor(private readonly prisma: PrismaService, private readonly access: GameAccessService, private readonly admin: AdminService) {}

  async context(userId: string, subdomain: string) {
    const game = await this.prisma.game.findUnique({ where: { subdomain: subdomain.trim().toLowerCase() }, select: { id: true, code: true, name: true, subdomain: true, logoUrl: true, operationalStatus: true, isPublic: true } });
    if (!game) throw new DomainError(ErrorCode.GAME_NOT_FOUND, 'Game not found', 404);
    const gameAccess = await this.access.getAccess(userId, game.id);
    return { game, roles: gameAccess.roles, abilityRules: gameAccess.abilityRules, isSuperAdmin: gameAccess.isSuperAdmin };
  }

  async dashboard(gameId: string) {
    const now = new Date();
    const day = vietnamCalendarStart(now);
    const sevenDays = vietnamDaysAgoStart(now, 6);
    const thirtyDays = vietnamDaysAgoStart(now, 29);
    const players = this.prisma.gamePlayer as any;
    const [totalPlayers, newToday, new7d, new30d, active7d, active30d, returning, totalLogins, recent] = await Promise.all([
      players.count({ where: { gameId } }), players.count({ where: { gameId, firstLoginAt: { gte: day } } }), players.count({ where: { gameId, firstLoginAt: { gte: sevenDays } } }), players.count({ where: { gameId, firstLoginAt: { gte: thirtyDays } } }), players.count({ where: { gameId, lastLoginAt: { gte: sevenDays } } }), players.count({ where: { gameId, lastLoginAt: { gte: thirtyDays } } }), players.count({ where: { gameId, loginCount: { gt: 1 } } }),
      players.aggregate({ where: { gameId }, _sum: { loginCount: true } }), players.findMany({ where: { gameId }, orderBy: { lastLoginAt: 'desc' }, take: 10, include: playerInclude }),
    ]);
    return { totals: { totalPlayers, newToday, new7d, new30d, active7d, active30d, returning, totalSsoLogins: totalLogins._sum.loginCount ?? 0 }, recentPlayers: recent.map((entry: any) => this.serializeDashboardPlayer(entry)) };
  }

  async listPlayers(gameId: string, query: GamePlayersQueryDto) {
    const players = this.prisma.gamePlayer as any;
    const where: any = { gameId, ...(query.status ? { status: query.status } : {}) };
    if (query.search) where.OR = [{ userId: { contains: query.search } }, { user: { username: { contains: query.search } } }, { user: { profile: { fullName: { contains: query.search } } } }];
    const [total, items] = await Promise.all([players.count({ where }), players.findMany({ where, orderBy: { lastLoginAt: 'desc' }, skip: (query.page - 1) * query.pageSize, take: query.pageSize, include: playerInclude })]);
    return { items: items.map((entry: any) => this.serializePlayer(entry)), total, page: query.page, pageSize: query.pageSize };
  }

  async getPlayer(gameId: string, userId: string) {
    const player = await (this.prisma.gamePlayer as any).findUnique({ where: { userId_gameId: { userId, gameId } }, include: playerInclude });
    if (!player) throw new DomainError(ErrorCode.GAME_PLAYER_NOT_FOUND, 'Game player not found', 404);
    return this.serializePlayer(player);
  }

  async getPlayerProfile(gameId: string, userId: string) {
    const player = await (this.prisma.gamePlayer as any).findUnique({
      where: { userId_gameId: { userId, gameId } },
      select: { id: true, user: { select: { id: true, username: true, email: true, phone: true, emailVerifiedAt: true, phoneVerifiedAt: true, updatedAt: true, profile: { select: { fullName: true, avatarUrl: true, dateOfBirth: true, gender: true, city: true, address: true } } } } },
    });
    if (!player) throw new DomainError(ErrorCode.GAME_PLAYER_NOT_FOUND, 'Game player not found', 404);
    return this.serializePlayerProfile(player.id, player.user);
  }

  async updatePlayerProfile(gameId: string, userId: string, dto: AdminProfileUpdateDto, actorUserId: string) {
    const player = await (this.prisma.gamePlayer as any).findUnique({
      where: { userId_gameId: { userId, gameId } },
      select: { id: true, user: { select: { roles: { select: { role: { select: { code: true, isActive: true, scopeType: true } } } }, gameRoleAssignments: { select: { id: true } } } } },
    });
    if (!player) throw new DomainError(ErrorCode.GAME_PLAYER_NOT_FOUND, 'Game player not found', 404);
    const targetHasPlatformRole = (player.user?.roles ?? []).some(({ role }: any) => role.isActive && role.scopeType === 'PLATFORM');
    const targetHasGameRole = (player.user?.gameRoleAssignments ?? []).length > 0;
    const actorRoles = await this.prisma.userRole.findMany({ where: { userId: actorUserId }, select: { role: { select: { code: true, isActive: true } } } });
    const actorIsSuperAdmin = actorRoles.some(({ role }) => role.isActive && role.code === 'SUPER_ADMIN');
    if ((targetHasPlatformRole || targetHasGameRole) && !actorIsSuperAdmin) {
      throw new DomainError(ErrorCode.GAME_PRIVILEGED_PLAYER_PROFILE_PROTECTED, 'Administrator profiles can only be updated by Super Admin', 403);
    }
    const updated = await this.admin.updateProfile(userId, dto, undefined, async (tx, change) => {
      await tx.authorizationAuditLog.create({
        data: {
          actorUserId,
          gameId,
          action: 'GAME_PLAYER_PROFILE_UPDATED',
          targetType: 'GAME_PLAYER',
          targetId: player.id,
          beforeData: JSON.stringify(change.before),
          afterData: JSON.stringify(change.after),
        },
      });
    });
    return this.serializePlayerProfile(player.id, updated);
  }

  async updatePlayerStatus(gameId: string, userId: string, dto: GamePlayerStatusDto, actorUserId: string) {
    const players = this.prisma.gamePlayer as any;
    const current = await players.findUnique({ where: { userId_gameId: { userId, gameId } }, include: playerInclude });
    if (!current) throw new DomainError(ErrorCode.GAME_PLAYER_NOT_FOUND, 'Game player not found', 404);
    if (current.updatedAt.getTime() !== new Date(dto.expectedUpdatedAt).getTime()) throw new DomainError(ErrorCode.STALE_GAME_PLAYER_UPDATE, 'Game player was changed by another operator', 409);
    const updated = await this.prisma.$transaction(async (tx) => {
      const txPlayers = tx.gamePlayer as any;
      const now = new Date();
      const write = await txPlayers.updateMany({ where: { id: current.id, updatedAt: current.updatedAt }, data: dto.status === 'BLOCKED' ? { status: 'BLOCKED', blockedAt: now, blockedByUserId: actorUserId, blockReason: dto.reason, updatedAt: now } : { status: 'ACTIVE', blockedAt: null, blockedByUserId: null, blockReason: null, updatedAt: now } });
      if (write.count !== 1) throw new DomainError(ErrorCode.STALE_GAME_PLAYER_UPDATE, 'Game player was changed by another operator', 409);
      const next = await txPlayers.findUniqueOrThrow({ where: { id: current.id }, include: playerInclude });
      await tx.authorizationAuditLog.create({ data: { actorUserId, gameId, action: dto.status === 'BLOCKED' ? 'GAME_PLAYER_BLOCKED' : 'GAME_PLAYER_UNBLOCKED', targetType: 'GAME_PLAYER', targetId: current.id, beforeData: JSON.stringify(this.serializePlayerForModerationAudit(current)), afterData: JSON.stringify(this.serializePlayerForModerationAudit(next)), reason: dto.reason } });
      return next;
    });
    return this.serializePlayer(updated);
  }

  async updatePlayerSupportNote(gameId: string, userId: string, dto: GamePlayerSupportNoteDto, actorUserId: string) {
    const players = this.prisma.gamePlayer as any;
    const current = await players.findUnique({ where: { userId_gameId: { userId, gameId } }, include: playerInclude });
    if (!current) throw new DomainError(ErrorCode.GAME_PLAYER_NOT_FOUND, 'Game player not found', 404);
    if (current.updatedAt.getTime() !== new Date(dto.expectedUpdatedAt).getTime()) throw new DomainError(ErrorCode.STALE_GAME_PLAYER_UPDATE, 'Game player was changed by another operator', 409);
    const supportNote = typeof dto.note === 'string' && dto.note.trim() ? dto.note.trim() : null;
    const updated = await this.prisma.$transaction(async (tx) => {
      const txPlayers = tx.gamePlayer as any;
      const now = new Date();
      const write = await txPlayers.updateMany({ where: { id: current.id, updatedAt: current.updatedAt }, data: { supportNote, updatedAt: now } });
      if (write.count !== 1) throw new DomainError(ErrorCode.STALE_GAME_PLAYER_UPDATE, 'Game player was changed by another operator', 409);
      const next = await txPlayers.findUniqueOrThrow({ where: { id: current.id }, include: playerInclude });
      await tx.authorizationAuditLog.create({ data: { actorUserId, gameId, action: 'GAME_PLAYER_SUPPORT_NOTE_UPDATED', targetType: 'GAME_PLAYER', targetId: current.id, beforeData: JSON.stringify({ supportNote: current.supportNote ?? null }), afterData: JSON.stringify({ supportNote }), reason: null } });
      return next;
    });
    return this.serializePlayer(updated);
  }

  async playerActivity(gameId: string, userId: string, query: GamePlayerActivityQueryDto) {
    const player = await (this.prisma.gamePlayer as any).findUnique({ where: { userId_gameId: { userId, gameId } }, select: { id: true } });
    if (!player) throw new DomainError(ErrorCode.GAME_PLAYER_NOT_FOUND, 'Game player not found', 404);
    const where: any = { gameId, targetType: 'GAME_PLAYER', targetId: player.id, action: { in: ['GAME_PLAYER_BLOCKED', 'GAME_PLAYER_UNBLOCKED', 'GAME_PLAYER_SUPPORT_NOTE_UPDATED'] } };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.authorizationAuditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (query.page - 1) * query.pageSize, take: query.pageSize, include: { actor: { select: { id: true, username: true, profile: { select: { fullName: true } } } } } }),
      this.prisma.authorizationAuditLog.count({ where }),
    ]);
    return { items: items.map((entry) => ({ id: entry.id, action: entry.action, targetType: entry.targetType, targetId: entry.targetId, reason: entry.reason, beforeData: this.data(entry.beforeData), afterData: this.data(entry.afterData), actor: entry.actor ? { id: entry.actor.id, username: entry.actor.username, displayName: entry.actor.profile?.fullName ?? entry.actor.username } : null, createdAt: entry.createdAt })), page: query.page, pageSize: query.pageSize, total };
  }

  async operations(gameId: string) {
    const game = await this.prisma.game.findUnique({ where: { id: gameId }, select: { id: true, operationalStatus: true, maintenanceMessage: true, maintenanceEndsAt: true, updatedAt: true } });
    if (!game) throw new DomainError(ErrorCode.GAME_NOT_FOUND, 'Game not found', 404);
    return this.serializeOperations(game);
  }

  async updateMaintenance(gameId: string, dto: GameMaintenanceUpdateDto, actorUserId: string) {
    const current = await this.prisma.game.findUnique({ where: { id: gameId }, select: { id: true, operationalStatus: true, maintenanceMessage: true, maintenanceEndsAt: true, updatedAt: true } });
    if (!current) throw new DomainError(ErrorCode.GAME_NOT_FOUND, 'Game not found', 404);
    if (['DEGRADED', 'UNAVAILABLE'].includes(current.operationalStatus)) throw new DomainError(ErrorCode.GAME_OPERATION_STATUS_LOCKED, 'Game operational status is managed by platform', 409);
    if (!['AVAILABLE', 'MAINTENANCE'].includes(current.operationalStatus)) throw new DomainError(ErrorCode.GAME_OPERATION_STATUS_LOCKED, 'Game operational status is managed by platform', 409);
    if (current.updatedAt.getTime() !== new Date(dto.expectedUpdatedAt).getTime()) throw new DomainError(ErrorCode.STALE_GAME_OPERATION_UPDATE, 'Game operations were changed by another operator', 409);
    const expectedEndsAt = dto.enabled && dto.expectedEndsAt ? new Date(dto.expectedEndsAt) : null;
    if (expectedEndsAt && expectedEndsAt <= new Date()) throw new DomainError(ErrorCode.GAME_CONFIG_INVALID, 'Maintenance end time must be in the future', 400);
    const message = dto.enabled ? dto.message?.trim() ?? null : null;
    if (dto.enabled && (!message || message.length < 3 || message.length > 500)) throw new DomainError(ErrorCode.GAME_CONFIG_INVALID, 'Maintenance message must be 3 to 500 characters', 400);
    const now = new Date();
    const data = dto.enabled
      ? { operationalStatus: 'MAINTENANCE', maintenanceMessage: message, maintenanceEndsAt: expectedEndsAt, updatedAt: now }
      : { operationalStatus: 'AVAILABLE', maintenanceMessage: null, maintenanceEndsAt: null, updatedAt: now };
    const action = !dto.enabled ? 'GAME_MAINTENANCE_DISABLED' : current.operationalStatus === 'MAINTENANCE' ? 'GAME_MAINTENANCE_UPDATED' : 'GAME_MAINTENANCE_ENABLED';
    const updated = await this.prisma.$transaction(async (tx) => {
      const write = await tx.game.updateMany({ where: { id: gameId, updatedAt: current.updatedAt }, data });
      if (write.count !== 1) throw new DomainError(ErrorCode.STALE_GAME_OPERATION_UPDATE, 'Game operations were changed by another operator', 409);
      const next = await tx.game.findUniqueOrThrow({ where: { id: gameId }, select: { id: true, operationalStatus: true, maintenanceMessage: true, maintenanceEndsAt: true, updatedAt: true } });
      await tx.authorizationAuditLog.create({ data: { actorUserId, gameId, action, targetType: 'GAME', targetId: gameId, beforeData: JSON.stringify(this.serializeMaintenanceAudit(current)), afterData: JSON.stringify(this.serializeMaintenanceAudit(next)), reason: dto.reason } });
      return next;
    });
    return this.serializeOperations(updated);
  }

  async audit(gameId: string, query: GameAuditQueryDto) {
    const where: any = { gameId, ...(query.action ? { action: query.action } : {}), ...(query.actorUserId ? { actorUserId: query.actorUserId } : {}) };
    if (query.from || query.to) where.createdAt = { ...(query.from ? { gte: new Date(query.from) } : {}), ...(query.to ? { lte: auditRangeEnd(query.to) } : {}) };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.authorizationAuditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (query.page - 1) * query.pageSize, take: query.pageSize, include: { actor: { select: { id: true, username: true, profile: { select: { fullName: true } } } } } }),
      this.prisma.authorizationAuditLog.count({ where }),
    ]);
    return { items: items.map((entry) => ({ id: entry.id, action: entry.action, targetType: entry.targetType, targetId: entry.targetId, reason: entry.reason, beforeData: this.data(entry.beforeData), afterData: this.data(entry.afterData), actor: entry.actor ? { id: entry.actor.id, username: entry.actor.username, displayName: entry.actor.profile?.fullName ?? entry.actor.username } : null, createdAt: entry.createdAt })), page: query.page, pageSize: query.pageSize, total };
  }

  private serializePlayer(entry: any) {
    return { id: entry.id, userId: entry.userId, user: entry.user, status: entry.status, firstLoginAt: entry.firstLoginAt, lastLoginAt: entry.lastLoginAt, loginCount: entry.loginCount, blockedAt: entry.blockedAt, blockReason: entry.blockReason, supportNote: entry.supportNote ?? null, updatedAt: entry.updatedAt };
  }
  private serializePlayerProfile(playerId: string, user: any) {
    return {
      playerId,
      userId: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone ?? null,
      emailVerified: user.emailVerified ?? Boolean(user.emailVerifiedAt),
      phoneVerified: user.phoneVerified ?? Boolean(user.phoneVerifiedAt),
      profile: user.profile ? { fullName: user.profile.fullName, avatarUrl: user.profile.avatarUrl ?? null, dateOfBirth: user.profile.dateOfBirth, gender: user.profile.gender, city: user.profile.city, address: user.profile.address } : null,
      updatedAt: user.updatedAt,
    };
  }
  private serializeDashboardPlayer(entry: any) {
    return { id: entry.id, userId: entry.userId, user: entry.user, firstLoginAt: entry.firstLoginAt, lastLoginAt: entry.lastLoginAt, loginCount: entry.loginCount, updatedAt: entry.updatedAt };
  }
  private serializePlayerForModerationAudit(entry: any) {
    const player = this.serializePlayer(entry);
    delete player.supportNote;
    return player;
  }
  private serializeOperations(game: any) { return { operationalStatus: game.operationalStatus, maintenanceMessage: game.maintenanceMessage ?? null, maintenanceEndsAt: game.maintenanceEndsAt ?? null, updatedAt: game.updatedAt }; }
  private serializeMaintenanceAudit(game: any) { return { operationalStatus: game.operationalStatus, maintenanceMessage: game.maintenanceMessage ?? null, maintenanceEndsAt: game.maintenanceEndsAt ? new Date(game.maintenanceEndsAt).toISOString() : null }; }
  private data(value: string | null) { try { return value ? JSON.parse(value) : null; } catch { return null; } }
}
