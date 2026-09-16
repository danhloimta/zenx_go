import * as argon2 from 'argon2';
import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { DomainError, ErrorCode } from '../common/errors';
import { PrismaService } from '../database/prisma.service';

const codeHash = (value: string) => createHash('sha256').update(value).digest('hex');

@Injectable()
export class GameSsoService {
  constructor(private readonly prisma: PrismaService) {}

  async authorize(userId: string, clientId: string, redirectUri: string) {
    const client = await (this.prisma.gameSsoClient as any).findUnique({ where: { clientId }, include: { game: { select: { id: true, code: true, isPublic: true } } } });
    if (!client || !client.isActive || !client.game.isPublic || client.redirectUri !== redirectUri) throw new DomainError(ErrorCode.GAME_SSO_CLIENT_INVALID, 'Invalid game SSO client', 400);
    const player = await (this.prisma.gamePlayer as any).findUnique({ where: { userId_gameId: { userId, gameId: client.gameId } }, select: { status: true } });
    if (player?.status === 'BLOCKED') throw new DomainError(ErrorCode.GAME_PLAYER_BLOCKED, 'Player is blocked for this game', 403);
    const rawCode = randomBytes(32).toString('base64url');
    const now = new Date();
    await (this.prisma.gameSsoAuthorizationCode as any).upsert({
      where: { userId_clientId: { userId, clientId: client.id } },
      update: { codeHash: codeHash(rawCode), gameId: client.gameId, redirectUri, expiresAt: new Date(now.getTime() + 60_000), createdAt: now },
      create: { codeHash: codeHash(rawCode), clientId: client.id, userId, gameId: client.gameId, redirectUri, expiresAt: new Date(now.getTime() + 60_000) },
    });
    return rawCode;
  }

  async exchange(header: string | undefined, code: string, redirectUri: string) {
    const credentials = this.parseBasic(header);
    const client = await (this.prisma.gameSsoClient as any).findUnique({ where: { clientId: credentials.clientId } });
    if (!client || !client.isActive || !(await argon2.verify(client.clientSecretHash, credentials.secret).catch(() => false))) throw this.invalidCode();
    return this.prisma.$transaction(async (tx) => {
      const stored = await (tx.gameSsoAuthorizationCode as any).findUnique({ where: { codeHash: codeHash(code) }, include: { game: { select: { id: true, code: true, isPublic: true } }, user: { select: { id: true, username: true, status: true, profile: { select: { fullName: true } } } } } });
      if (!stored || stored.clientId !== client.id || stored.redirectUri !== redirectUri || stored.expiresAt <= new Date() || !stored.game.isPublic || ['LOCKED', 'SUSPENDED', 'DELETED'].includes(stored.user.status)) throw this.invalidCode();
      const existing = await (tx.gamePlayer as any).findUnique({ where: { userId_gameId: { userId: stored.userId, gameId: stored.gameId } }, select: { status: true } });
      if (existing?.status === 'BLOCKED') throw new DomainError(ErrorCode.GAME_PLAYER_BLOCKED, 'Player is blocked for this game', 403);
      const consumed = await (tx.gameSsoAuthorizationCode as any).deleteMany({ where: { id: stored.id } });
      if (consumed.count !== 1) throw this.invalidCode();
      const loginAt = new Date();
      await (tx.gamePlayer as any).upsert({ where: { userId_gameId: { userId: stored.userId, gameId: stored.gameId } }, create: { userId: stored.userId, gameId: stored.gameId, firstLoginAt: loginAt, lastLoginAt: loginAt, loginCount: 1 }, update: { lastLoginAt: loginAt, loginCount: { increment: 1 } } });
      return { user: { id: stored.user.id, username: stored.user.username, displayName: stored.user.profile?.fullName ?? stored.user.username }, game: { id: stored.game.id, code: stored.game.code }, loginAt };
    });
  }

  private parseBasic(value: string | undefined) {
    if (!value?.startsWith('Basic ')) throw this.invalidCode();
    try {
      const raw = Buffer.from(value.slice(6), 'base64').toString('utf8');
      const index = raw.indexOf(':');
      if (index <= 0 || !raw.slice(index + 1)) throw new Error();
      return { clientId: raw.slice(0, index), secret: raw.slice(index + 1) };
    } catch { throw this.invalidCode(); }
  }
  private invalidCode() { return new DomainError(ErrorCode.GAME_SSO_CODE_INVALID, 'Invalid authorization code', 400); }
}
