import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AbilityBuilder, createMongoAbility } = require('@casl/ability') as any;
import { DomainError, ErrorCode } from '../common/errors';
import { PrismaService } from '../database/prisma.service';

export type GameAuthorizationAccess = {
  gameId: string;
  roles: Array<{ id: string; code: string; name: string }>;
  abilityRules: Array<{ action: string; subject: string }>;
  ability: { can(action: string, subject: string): boolean };
  isSuperAdmin: boolean;
};

@Injectable()
export class GameAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async getAccess(userId: string, gameId: string): Promise<GameAuthorizationAccess> {
    const platformRoles = await this.prisma.userRole.findMany({ where: { userId }, select: { role: { select: { code: true, isActive: true } } } });
    const { can, build } = new AbilityBuilder(createMongoAbility);
    if (platformRoles.some(({ role }) => role.isActive && role.code === 'SUPER_ADMIN')) {
      can('manage', 'all');
      return { gameId, roles: [{ id: 'SUPER_ADMIN', code: 'SUPER_ADMIN', name: 'Super Admin' }], abilityRules: [{ action: 'manage', subject: 'all' }], ability: build(), isSuperAdmin: true };
    }
    const assignments = await (this.prisma.gameRoleAssignment as any).findMany({
      where: { userId, gameId },
      select: {
        role: {
          select: {
            id: true, code: true, name: true, isActive: true, scopeType: true,
            permissions: { select: { permission: { select: { action: true, subject: true, isActive: true, scopeType: true } } } },
          },
        },
      },
    });
    const roles = assignments.map(({ role }: any) => role).filter((role: any) => role.isActive && role.scopeType === 'GAME');
    if (!roles.length) throw new DomainError(ErrorCode.GAME_ACCESS_REQUIRED, 'Game administrator access is required', 403);
    const rules = Array.from(new Map(roles.flatMap((role: any) => role.permissions.filter(({ permission }: any) => permission.isActive && permission.scopeType === 'GAME').map(({ permission }: any) => [`${permission.action}:${permission.subject}`, permission]))).values()) as any[];
    for (const rule of rules) can(rule.action, rule.subject);
    return { gameId, roles: roles.map(({ id, code, name }: any) => ({ id, code, name })), abilityRules: rules.map((rule) => ({ action: rule.action, subject: rule.subject })), ability: build(), isSuperAdmin: false };
  }
}
