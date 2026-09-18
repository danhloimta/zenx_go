import { Injectable } from '@nestjs/common';
import { DomainError, ErrorCode } from '../common/errors';
import { PrismaService } from '../database/prisma.service';
import { GamePlayersQueryDto, GamePlayerStatusDto, GamePlayerTemporaryLockDto, GamePlayerPermanentBanDto, GamePlayerReleaseRestrictionDto, GamePlayerChatRestrictionDto, GamePlayerSupportNoteDto, GamePlayerActivityQueryDto, GameAuditQueryDto, GameMaintenanceUpdateDto, GameSupportTicketsQueryDto } from './game-admin.dto';
import { GameAccessService, GameAuthorizationAccess } from './game-access.service';
import { AdminService } from './admin.service';
import { AdminProfileUpdateDto } from './admin.dto';
import { vietnamCalendarStart, vietnamDaysAgoStart } from './game-metrics';
import { auditRangeEnd } from './game-audit-date-range';
import { CreateSupportMessageDto, SupportTicketMessagesQueryDto } from '../support/dto';
import { SupportMessageAuthorType, SupportMessageVisibility, SupportTicketStatus } from '../common/domain';

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
    await this.expireTemporaryLocks(gameId);
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
    await this.expireTemporaryLocks(gameId);
    const filters: any[] = [];
    if (query.status === 'BLOCKED') filters.push({ OR: [{ status: 'TEMPORARILY_BLOCKED' }, { status: 'PERMANENTLY_BANNED' }, { status: 'BLOCKED' }] });
    else if (query.status) filters.push({ status: query.status });
    if (query.search) filters.push({ OR: [{ userId: { contains: query.search } }, { user: { username: { contains: query.search } } }, { user: { profile: { fullName: { contains: query.search } } } }] });
    const where: any = { gameId, ...(filters.length ? { AND: filters } : {}) };
    const [total, items] = await Promise.all([players.count({ where }), players.findMany({ where, orderBy: { lastLoginAt: 'desc' }, skip: (query.page - 1) * query.pageSize, take: query.pageSize, include: playerInclude })]);
    return { items: items.map((entry: any) => this.serializePlayer(entry)), total, page: query.page, pageSize: query.pageSize };
  }

  async getPlayer(gameId: string, userId: string) {
    await this.expireTemporaryLocks(gameId);
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

  async temporaryLockPlayer(gameId: string, userId: string, dto: GamePlayerTemporaryLockDto, actorUserId: string) {
    const current = await this.findPlayerForModeration(gameId, userId);
    this.assertExpectedPlayerVersion(current, dto.expectedUpdatedAt);
    const expiresAt = new Date(dto.expiresAt);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
      throw new DomainError(ErrorCode.GAME_PLAYER_RESTRICTION_INVALID, 'Temporary lock expiry must be in the future', 400);
    }
    if (current.status === 'PERMANENTLY_BANNED' || current.status === 'BLOCKED') {
      throw new DomainError(ErrorCode.GAME_PLAYER_PERMANENTLY_BANNED, 'A permanently banned player cannot be temporarily locked', 409);
    }
    return this.writePlayerRestriction(gameId, current, {
      status: 'TEMPORARILY_BLOCKED', blockedUntil: expiresAt, actorUserId, reason: dto.reason,
      action: 'GAME_PLAYER_TEMPORARILY_BLOCKED',
    });
  }

  async permanentBanPlayer(gameId: string, userId: string, dto: GamePlayerPermanentBanDto, actorUserId: string) {
    const current = await this.findPlayerForModeration(gameId, userId);
    this.assertExpectedPlayerVersion(current, dto.expectedUpdatedAt);
    return this.writePlayerRestriction(gameId, current, {
      status: 'PERMANENTLY_BANNED', blockedUntil: null, actorUserId, reason: dto.reason,
      action: 'GAME_PLAYER_PERMANENTLY_BANNED',
    });
  }

  async releasePlayerRestriction(gameId: string, userId: string, dto: GamePlayerReleaseRestrictionDto, actorUserId: string, access: GameAuthorizationAccess) {
    const current = await this.findPlayerForModeration(gameId, userId);
    this.assertExpectedPlayerVersion(current, dto.expectedUpdatedAt);
    const isPermanent = current.status === 'PERMANENTLY_BANNED' || current.status === 'BLOCKED';
    const isTemporary = current.status === 'TEMPORARILY_BLOCKED';
    if (!isPermanent && !isTemporary) throw new DomainError(ErrorCode.GAME_PLAYER_RESTRICTION_INVALID, 'Player has no active restriction', 409);
    const canRelease = access.isSuperAdmin || (isPermanent ? access.ability.can('ban', 'GamePlayer') : access.ability.can('lock', 'GamePlayer'));
    if (!canRelease) throw new DomainError(ErrorCode.GAME_PERMISSION_REQUIRED, 'Permission for this restriction is required', 403);
    return this.writePlayerRestriction(gameId, current, {
      status: 'ACTIVE', blockedUntil: null, actorUserId, reason: dto.reason,
      action: isPermanent ? 'GAME_PLAYER_PERMANENT_BAN_RELEASED' : 'GAME_PLAYER_TEMPORARY_LOCK_RELEASED',
    });
  }

  async updatePlayerChatRestriction(gameId: string, userId: string, dto: GamePlayerChatRestrictionDto, actorUserId: string) {
    const current = await this.findPlayerForModeration(gameId, userId);
    this.assertExpectedPlayerVersion(current, dto.expectedUpdatedAt);
    const now = new Date();
    const data = dto.locked
      ? { chatBlocked: true, chatBlockedAt: now, chatBlockedByUserId: actorUserId, chatBlockReason: dto.reason, updatedAt: now }
      : { chatBlocked: false, chatBlockedAt: null, chatBlockedByUserId: null, chatBlockReason: null, updatedAt: now };
    const action = dto.locked ? 'GAME_PLAYER_CHAT_BLOCKED' : 'GAME_PLAYER_CHAT_UNBLOCKED';
    const updated = await this.prisma.$transaction(async (tx) => {
      const write = await (tx.gamePlayer as any).updateMany({ where: { id: current.id, updatedAt: current.updatedAt }, data });
      if (write.count !== 1) throw new DomainError(ErrorCode.STALE_GAME_PLAYER_UPDATE, 'Game player was changed by another operator', 409);
      const next = await (tx.gamePlayer as any).findUniqueOrThrow({ where: { id: current.id }, include: playerInclude });
      await tx.authorizationAuditLog.create({ data: { actorUserId, gameId, action, targetType: 'GAME_PLAYER', targetId: current.id, beforeData: JSON.stringify(this.serializePlayerForModerationAudit(current)), afterData: JSON.stringify(this.serializePlayerForModerationAudit(next)), reason: dto.reason } });
      return next;
    });
    return this.serializePlayer(updated);
  }

  private async findPlayerForModeration(gameId: string, userId: string) {
    await this.expireTemporaryLocks(gameId);
    const current = await (this.prisma.gamePlayer as any).findUnique({ where: { userId_gameId: { userId, gameId } }, include: playerInclude });
    if (!current) throw new DomainError(ErrorCode.GAME_PLAYER_NOT_FOUND, 'Game player not found', 404);
    return current;
  }

  private async expireTemporaryLocks(gameId: string) {
    const players = this.prisma.gamePlayer as any;
    if (typeof players.updateMany !== 'function') return;
    await players.updateMany({ where: { gameId, status: 'TEMPORARILY_BLOCKED', blockedUntil: { lte: new Date() } }, data: { status: 'ACTIVE', blockedAt: null, blockedUntil: null, blockedByUserId: null, blockReason: null, updatedAt: new Date() } });
  }

  private assertExpectedPlayerVersion(current: any, expectedUpdatedAt: string) {
    if (current.updatedAt.getTime() !== new Date(expectedUpdatedAt).getTime()) throw new DomainError(ErrorCode.STALE_GAME_PLAYER_UPDATE, 'Game player was changed by another operator', 409);
  }

  private async writePlayerRestriction(gameId: string, current: any, input: { status: string; blockedUntil: Date | null; actorUserId: string; reason: string; action: string }) {
    const now = new Date();
    const data = input.status === 'ACTIVE'
      ? { status: 'ACTIVE', blockedAt: null, blockedUntil: null, blockedByUserId: null, blockReason: null, updatedAt: now }
      : { status: input.status, blockedAt: now, blockedUntil: input.blockedUntil, blockedByUserId: input.actorUserId, blockReason: input.reason, updatedAt: now };
    const updated = await this.prisma.$transaction(async (tx) => {
      const write = await (tx.gamePlayer as any).updateMany({ where: { id: current.id, updatedAt: current.updatedAt }, data });
      if (write.count !== 1) throw new DomainError(ErrorCode.STALE_GAME_PLAYER_UPDATE, 'Game player was changed by another operator', 409);
      const next = await (tx.gamePlayer as any).findUniqueOrThrow({ where: { id: current.id }, include: playerInclude });
      await tx.authorizationAuditLog.create({ data: { actorUserId: input.actorUserId, gameId, action: input.action, targetType: 'GAME_PLAYER', targetId: current.id, beforeData: JSON.stringify(this.serializePlayerForModerationAudit(current)), afterData: JSON.stringify(this.serializePlayerForModerationAudit(next)), reason: input.reason } });
      return next;
    });
    return this.serializePlayer(updated);
  }

  async updatePlayerStatus(gameId: string, userId: string, dto: GamePlayerStatusDto, actorUserId: string) {
    const players = this.prisma.gamePlayer as any;
    const current = await players.findUnique({ where: { userId_gameId: { userId, gameId } }, include: playerInclude });
    if (!current) throw new DomainError(ErrorCode.GAME_PLAYER_NOT_FOUND, 'Game player not found', 404);
    if (current.updatedAt.getTime() !== new Date(dto.expectedUpdatedAt).getTime()) throw new DomainError(ErrorCode.STALE_GAME_PLAYER_UPDATE, 'Game player was changed by another operator', 409);
    const updated = await this.prisma.$transaction(async (tx) => {
      const txPlayers = tx.gamePlayer as any;
      const now = new Date();
      const write = await txPlayers.updateMany({ where: { id: current.id, updatedAt: current.updatedAt }, data: dto.status === 'BLOCKED' ? { status: 'BLOCKED', blockedAt: now, blockedUntil: null, blockedByUserId: actorUserId, blockReason: dto.reason, updatedAt: now } : { status: 'ACTIVE', blockedAt: null, blockedUntil: null, blockedByUserId: null, blockReason: null, updatedAt: now } });
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
    await this.expireTemporaryLocks(gameId);
    const player = await (this.prisma.gamePlayer as any).findUnique({ where: { userId_gameId: { userId, gameId } }, select: { id: true } });
    if (!player) throw new DomainError(ErrorCode.GAME_PLAYER_NOT_FOUND, 'Game player not found', 404);
    const base = { gameId, targetType: 'GAME_PLAYER', targetId: player.id };
    const legacyWhere: any = { ...base, action: { in: ['GAME_PLAYER_BLOCKED', 'GAME_PLAYER_UNBLOCKED', 'GAME_PLAYER_SUPPORT_NOTE_UPDATED'] } };
    const newerWhere: any = { ...base, action: { in: [
      'GAME_PLAYER_TEMPORARILY_BLOCKED', 'GAME_PLAYER_PERMANENTLY_BANNED',
      'GAME_PLAYER_TEMPORARY_LOCK_RELEASED', 'GAME_PLAYER_PERMANENT_BAN_RELEASED',
      'GAME_PLAYER_CHAT_BLOCKED', 'GAME_PLAYER_CHAT_UNBLOCKED',
    ] } };
    const select = { actor: { select: { id: true, username: true, profile: { select: { fullName: true } } } } };
    const [legacyItems, legacyTotal] = await this.prisma.$transaction([
      this.prisma.authorizationAuditLog.findMany({ where: legacyWhere, orderBy: { createdAt: 'desc' }, skip: (query.page - 1) * query.pageSize, take: query.pageSize, include: select }),
      this.prisma.authorizationAuditLog.count({ where: legacyWhere }),
    ]);
    const [newItems, newTotal] = await this.prisma.$transaction([
      this.prisma.authorizationAuditLog.findMany({ where: newerWhere, orderBy: { createdAt: 'desc' }, skip: (query.page - 1) * query.pageSize, take: query.pageSize, include: select }),
      this.prisma.authorizationAuditLog.count({ where: newerWhere }),
    ]);
    const seen = new Set<string>();
    const items = [...legacyItems, ...newItems].filter((entry) => !seen.has(entry.id) && seen.add(entry.id)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, query.pageSize);
    const total = legacyTotal + newTotal - (legacyItems.length + newItems.length - seen.size);
    return { items: items.map((entry) => ({ id: entry.id, action: entry.action, targetType: entry.targetType, targetId: entry.targetId, reason: entry.reason, beforeData: this.data(entry.beforeData), afterData: this.data(entry.afterData), actor: entry.actor ? { id: entry.actor.id, username: entry.actor.username, displayName: entry.actor.profile?.fullName ?? entry.actor.username } : null, createdAt: entry.createdAt })), page: query.page, pageSize: query.pageSize, total: Math.max(0, total) };
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

  async listSupportTickets(gameId: string, query: GameSupportTicketsQueryDto) {
    const search = query.search?.trim();
    const where: any = {
      gameId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(search
        ? {
            OR: [
              { ticketNo: { contains: search } },
              { subject: { contains: search } },
              { user: { is: { username: { contains: search } } } },
              { user: { is: { email: { contains: search } } } },
              { user: { is: { phone: { contains: search } } } },
              { user: { is: { profile: { is: { fullName: { contains: search } } } } } },
            ],
          }
        : {}),
    };

    const [items, total, unassignedCount, ...statusCounts] = await this.prisma.$transaction([
      this.prisma.supportTicket.findMany({
        where,
        orderBy: [{ lastActivityAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: this.supportTicketSelect(),
      }),
      this.prisma.supportTicket.count({ where }),
      this.prisma.supportTicket.count({
        where: { gameId, assigneeUserId: null, status: { not: SupportTicketStatus.CLOSED } },
      }),
      this.prisma.supportTicket.count({ where: { gameId, status: SupportTicketStatus.NEW } }),
      this.prisma.supportTicket.count({ where: { gameId, status: SupportTicketStatus.IN_PROGRESS } }),
      this.prisma.supportTicket.count({ where: { gameId, status: SupportTicketStatus.WAITING_USER } }),
      this.prisma.supportTicket.count({ where: { gameId, status: SupportTicketStatus.RESOLVED } }),
      this.prisma.supportTicket.count({ where: { gameId, status: SupportTicketStatus.CLOSED } }),
    ]);

    const byStatus: Record<string, number> = {
      [SupportTicketStatus.NEW]: statusCounts[0],
      [SupportTicketStatus.IN_PROGRESS]: statusCounts[1],
      [SupportTicketStatus.WAITING_USER]: statusCounts[2],
      [SupportTicketStatus.RESOLVED]: statusCounts[3],
      [SupportTicketStatus.CLOSED]: statusCounts[4],
    };

    return {
      items: items.map((ticket) => this.serializeSupportTicket(ticket)),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
      stats: {
        byStatus,
        unassigned: unassignedCount,
      },
    };
  }

  async getSupportTicket(gameId: string, ticketNo: string) {
    const ticket = await this.prisma.supportTicket.findFirst({ where: { gameId, ticketNo: ticketNo.trim() }, select: this.supportTicketSelect() });
    if (!ticket) throw new DomainError(ErrorCode.SUPPORT_TICKET_NOT_FOUND, 'Support ticket not found', 404);
    return this.serializeSupportTicket(ticket);
  }

  async getSupportMessages(gameId: string, ticketNo: string, query: SupportTicketMessagesQueryDto) {
    const ticket = await this.prisma.supportTicket.findFirst({ where: { gameId, ticketNo: ticketNo.trim() }, select: { id: true } });
    if (!ticket) throw new DomainError(ErrorCode.SUPPORT_TICKET_NOT_FOUND, 'Support ticket not found', 404);
    const where = { ticketId: ticket.id, visibility: SupportMessageVisibility.PUBLIC };
    const [items, total] = await this.prisma.$transaction([this.prisma.supportTicketMessage.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize, select: { id: true, authorType: true, visibility: true, body: true, createdAt: true, author: { select: { username: true, profile: { select: { fullName: true } } } } } }), this.prisma.supportTicketMessage.count({ where })]);
    return { items: items.map((message) => ({ ...message, author: { username: message.author.username, fullName: message.author.profile?.fullName ?? null } })), page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) };
  }

  async replySupportTicket(gameId: string, ticketNo: string, dto: CreateSupportMessageDto, actorUserId: string) {
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.supportTicket.findFirst({ where: { gameId, ticketNo: ticketNo.trim() }, select: { id: true, status: true } });
      if (!ticket) throw new DomainError(ErrorCode.SUPPORT_TICKET_NOT_FOUND, 'Support ticket not found', 404);
      if (ticket.status === SupportTicketStatus.CLOSED) throw new DomainError(ErrorCode.SUPPORT_TICKET_CLOSED, 'This ticket is closed', 409);
      const message = await tx.supportTicketMessage.create({ data: { ticketId: ticket.id, authorUserId: actorUserId, authorType: SupportMessageAuthorType.STAFF, visibility: SupportMessageVisibility.PUBLIC, body: dto.body }, select: { id: true, authorType: true, visibility: true, body: true, createdAt: true, author: { select: { username: true, profile: { select: { fullName: true } } } } } });
      await tx.supportTicket.update({ where: { id: ticket.id }, data: { lastActivityAt: now, lastStaffReplyAt: now, status: SupportTicketStatus.WAITING_USER } });
      return { ...message, author: { username: message.author.username, fullName: message.author.profile?.fullName ?? null } };
    });
  }

  private serializePlayer(entry: any) {
    const expiredTemporary = entry.status === 'TEMPORARILY_BLOCKED' && entry.blockedUntil && new Date(entry.blockedUntil) <= new Date();
    return { id: entry.id, userId: entry.userId, user: entry.user, status: expiredTemporary ? 'ACTIVE' : entry.status, firstLoginAt: entry.firstLoginAt, lastLoginAt: entry.lastLoginAt, loginCount: entry.loginCount, blockedAt: entry.blockedAt, blockedUntil: expiredTemporary ? null : entry.blockedUntil ?? null, blockedByUserId: entry.blockedByUserId ?? null, blockReason: entry.blockReason, chatBlocked: Boolean(entry.chatBlocked), chatBlockedAt: entry.chatBlockedAt ?? null, chatBlockedByUserId: entry.chatBlockedByUserId ?? null, chatBlockReason: entry.chatBlockReason ?? null, supportNote: entry.supportNote ?? null, updatedAt: entry.updatedAt };
  }
  private supportTicketSelect() {
    return {
      id: true,
      ticketNo: true,
      subject: true,
      description: true,
      status: true,
      priority: true,
      lastActivityAt: true,
      lastCustomerMessageAt: true,
      lastStaffReplyAt: true,
      createdAt: true,
      updatedAt: true,
      category: { select: { id: true, code: true, name: true } },
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          phone: true,
          profile: { select: { fullName: true, avatarUrl: true } },
        },
      },
      assignee: {
        select: {
          id: true,
          username: true,
          profile: { select: { fullName: true } },
        },
      },
    } as const;
  }
  private serializeSupportTicket(ticket: any) {
    return {
      ...ticket,
      user: {
        id: ticket.user.id,
        username: ticket.user.username,
        email: ticket.user.email,
        phone: ticket.user.phone,
        fullName: ticket.user.profile?.fullName ?? null,
        avatarUrl: ticket.user.profile?.avatarUrl ?? null,
        profile: ticket.user.profile ?? null,
      },
      assignee: ticket.assignee
        ? {
            id: ticket.assignee.id,
            username: ticket.assignee.username,
            fullName: ticket.assignee.profile?.fullName ?? null,
          }
        : null,
    };
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
