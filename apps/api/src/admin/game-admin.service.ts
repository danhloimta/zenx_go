import { Injectable } from '@nestjs/common';
import { DomainError, ErrorCode } from '../common/errors';
import { PrismaService } from '../database/prisma.service';
import { GamePlayersQueryDto, GamePlayerStatusDto } from './game-admin.dto';
import { GameAccessService } from './game-access.service';

const playerInclude = { user: { select: { id: true, username: true, profile: { select: { fullName: true, avatarUrl: true } } } } } as const;

@Injectable()
export class GameAdminService {
  constructor(private readonly prisma: PrismaService, private readonly access: GameAccessService) {}

  async context(userId: string, subdomain: string) {
    const game = await this.prisma.game.findUnique({ where: { subdomain: subdomain.trim().toLowerCase() }, select: { id: true, code: true, name: true, subdomain: true, logoUrl: true, operationalStatus: true, isPublic: true } });
    if (!game) throw new DomainError(ErrorCode.GAME_NOT_FOUND, 'Game not found', 404);
    const gameAccess = await this.access.getAccess(userId, game.id);
    return { game, roles: gameAccess.roles, abilityRules: gameAccess.abilityRules, isSuperAdmin: gameAccess.isSuperAdmin };
  }

  async dashboard(gameId: string) {
    const now = new Date();
    const day = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDays = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDays = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const players = this.prisma.gamePlayer as any;
    const [totalPlayers, newToday, new7d, new30d, active7d, active30d, returning, totalLogins, recent] = await Promise.all([
      players.count({ where: { gameId } }), players.count({ where: { gameId, firstLoginAt: { gte: day } } }), players.count({ where: { gameId, firstLoginAt: { gte: sevenDays } } }), players.count({ where: { gameId, firstLoginAt: { gte: thirtyDays } } }), players.count({ where: { gameId, lastLoginAt: { gte: sevenDays } } }), players.count({ where: { gameId, lastLoginAt: { gte: thirtyDays } } }), players.count({ where: { gameId, loginCount: { gt: 1 } } }),
      players.aggregate({ where: { gameId }, _sum: { loginCount: true } }), players.findMany({ where: { gameId }, orderBy: { lastLoginAt: 'desc' }, take: 10, include: playerInclude }),
    ]);
    return { totals: { totalPlayers, newToday, new7d, new30d, active7d, active30d, returning, totalSsoLogins: totalLogins._sum.loginCount ?? 0 }, recentPlayers: recent.map((entry: any) => this.serializePlayer(entry)) };
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

  async updatePlayerStatus(gameId: string, userId: string, dto: GamePlayerStatusDto, actorUserId: string) {
    const players = this.prisma.gamePlayer as any;
    const current = await players.findUnique({ where: { userId_gameId: { userId, gameId } }, include: playerInclude });
    if (!current) throw new DomainError(ErrorCode.GAME_PLAYER_NOT_FOUND, 'Game player not found', 404);
    if (current.updatedAt.getTime() !== new Date(dto.expectedUpdatedAt).getTime()) throw new DomainError(ErrorCode.STALE_GAME_PLAYER_UPDATE, 'Game player was changed by another operator', 409);
    const now = new Date();
    const write = await players.updateMany({ where: { id: current.id, updatedAt: current.updatedAt }, data: dto.status === 'BLOCKED' ? { status: 'BLOCKED', blockedAt: now, blockedByUserId: actorUserId, blockReason: dto.reason, updatedAt: now } : { status: 'ACTIVE', blockedAt: null, blockedByUserId: null, blockReason: null, updatedAt: now } });
    if (write.count !== 1) throw new DomainError(ErrorCode.STALE_GAME_PLAYER_UPDATE, 'Game player was changed by another operator', 409);
    const updated = await players.findUniqueOrThrow({ where: { id: current.id }, include: playerInclude });
    await this.prisma.authorizationAuditLog.create({ data: { actorUserId, gameId, action: dto.status === 'BLOCKED' ? 'GAME_PLAYER_BLOCKED' : 'GAME_PLAYER_UNBLOCKED', targetType: 'GAME_PLAYER', targetId: current.id, beforeData: JSON.stringify(this.serializePlayer(current)), afterData: JSON.stringify(this.serializePlayer(updated)), reason: dto.reason } });
    return this.serializePlayer(updated);
  }

  private serializePlayer(entry: any) {
    return { id: entry.id, userId: entry.userId, user: entry.user, status: entry.status, firstLoginAt: entry.firstLoginAt, lastLoginAt: entry.lastLoginAt, loginCount: entry.loginCount, blockedAt: entry.blockedAt, blockReason: entry.blockReason, updatedAt: entry.updatedAt };
  }
}
