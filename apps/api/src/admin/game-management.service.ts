import * as argon2 from 'argon2';
import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { DomainError, ErrorCode } from '../common/errors';
import { PrismaService } from '../database/prisma.service';
import { GameAdminsUpdateDto, GameSsoClientUpdateDto } from './game-admin.dto';

const gameRoleSelect = { id: true, code: true, name: true, description: true } as const;

@Injectable()
export class GameManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async listAdmins(gameId: string) {
    await this.requireGame(gameId);
    const assignments = await (this.prisma.gameRoleAssignment as any).findMany({
      where: { gameId }, orderBy: [{ assignedAt: 'desc' }],
      include: { user: { select: { id: true, username: true, profile: { select: { fullName: true, avatarUrl: true } } } }, role: { select: gameRoleSelect }, assignedBy: { select: { id: true, username: true } } },
    });
    return assignments.map((entry: any) => ({ id: entry.id, user: entry.user, role: entry.role, assignedAt: entry.assignedAt, assignedBy: entry.assignedBy }));
  }

  async replaceAdmins(gameId: string, userId: string, dto: GameAdminsUpdateDto, actorUserId: string) {
    await this.requireGame(gameId);
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, status: true } });
    if (!user || user.status === 'DELETED') throw new DomainError(ErrorCode.ACCOUNT_NOT_FOUND, 'User not found', 404);
    const roleIds = [...new Set(dto.roleIds)];
    const roles = roleIds.length ? await this.prisma.role.findMany({ where: { id: { in: roleIds }, isActive: true, scopeType: 'GAME' }, select: gameRoleSelect }) : [];
    if (roles.length !== roleIds.length) throw new DomainError(ErrorCode.GAME_ROLE_INVALID, 'One or more game roles are invalid', 400);
    return this.prisma.$transaction(async (tx) => {
      const before = await (tx.gameRoleAssignment as any).findMany({ where: { gameId, userId }, include: { role: { select: gameRoleSelect } } });
      await (tx.gameRoleAssignment as any).deleteMany({ where: { gameId, userId } });
      if (roleIds.length) await (tx.gameRoleAssignment as any).createMany({ data: roleIds.map((roleId) => ({ userId, gameId, roleId, assignedByUserId: actorUserId })) });
      await tx.authorizationAuditLog.create({ data: { actorUserId, gameId, action: 'GAME_ADMIN_ROLES_REPLACED', targetType: 'USER', targetId: userId, beforeData: JSON.stringify(before.map((entry: any) => entry.role)), afterData: JSON.stringify(roles), reason: dto.reason } });
      return { userId, roles };
    });
  }

  async getSsoClient(gameId: string) {
    await this.requireGame(gameId);
    const client = await (this.prisma.gameSsoClient as any).findUnique({ where: { gameId } });
    return client ? this.serializeClient(client) : null;
  }

  async updateSsoClient(gameId: string, dto: GameSsoClientUpdateDto, actorUserId: string) {
    await this.requireGame(gameId);
    this.assertRedirectUri(dto.redirectUri);
    const current = await (this.prisma.gameSsoClient as any).findUnique({ where: { gameId } });
    if (current) {
      const updated = await (this.prisma.gameSsoClient as any).update({ where: { gameId }, data: { redirectUri: dto.redirectUri, isActive: dto.isActive } });
      await this.auditGame(actorUserId, gameId, 'GAME_SSO_CLIENT_UPDATED', 'GAME', gameId, this.serializeClient(current), this.serializeClient(updated));
      return this.serializeClient(updated);
    }
    const rawSecret = randomBytes(32).toString('base64url');
    const created = await (this.prisma.gameSsoClient as any).create({ data: { gameId, clientId: `zenx-${randomBytes(12).toString('hex')}`, clientSecretHash: await argon2.hash(rawSecret), redirectUri: dto.redirectUri, isActive: dto.isActive } });
    await this.auditGame(actorUserId, gameId, 'GAME_SSO_CLIENT_CREATED', 'GAME', gameId, null, this.serializeClient(created));
    return { ...this.serializeClient(created), clientSecret: rawSecret };
  }

  async rotateSsoSecret(gameId: string, actorUserId: string) {
    const current = await (this.prisma.gameSsoClient as any).findUnique({ where: { gameId } });
    if (!current) throw new DomainError(ErrorCode.GAME_SSO_CLIENT_NOT_FOUND, 'Game SSO client not found', 404);
    const rawSecret = randomBytes(32).toString('base64url');
    const updated = await (this.prisma.gameSsoClient as any).update({ where: { gameId }, data: { clientSecretHash: await argon2.hash(rawSecret) } });
    await this.auditGame(actorUserId, gameId, 'GAME_SSO_SECRET_ROTATED', 'GAME', gameId, null, null);
    return { ...this.serializeClient(updated), clientSecret: rawSecret };
  }

  private async requireGame(gameId: string) {
    const game = await this.prisma.game.findUnique({ where: { id: gameId }, select: { id: true } });
    if (!game) throw new DomainError(ErrorCode.GAME_NOT_FOUND, 'Game not found', 404);
  }
  private assertRedirectUri(value: string) {
    let url: URL;
    try { url = new URL(value); } catch { throw new DomainError(ErrorCode.GAME_SSO_CLIENT_INVALID, 'Invalid redirect URI', 400); }
    const local = url.hostname === 'localhost' || url.hostname.endsWith('.localhost') || url.hostname === 'lvh.me' || url.hostname.endsWith('.lvh.me');
    if ((process.env.NODE_ENV === 'production' && url.protocol !== 'https:') || (!local && url.protocol !== 'https:') || url.username || url.password || url.hash) throw new DomainError(ErrorCode.GAME_SSO_CLIENT_INVALID, 'Redirect URI must use HTTPS', 400);
  }
  private serializeClient(client: any) { return { id: client.id, clientId: client.clientId, redirectUri: client.redirectUri, isActive: client.isActive, createdAt: client.createdAt, updatedAt: client.updatedAt }; }
  private auditGame(actorUserId: string, gameId: string, action: string, targetType: string, targetId: string, beforeData: unknown, afterData: unknown) { return this.prisma.authorizationAuditLog.create({ data: { actorUserId, gameId, action, targetType, targetId, beforeData: beforeData ? JSON.stringify(beforeData) : null, afterData: afterData ? JSON.stringify(afterData) : null } }); }
}
