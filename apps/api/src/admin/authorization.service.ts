import { Injectable } from '@nestjs/common';
// CASL 7 publishes ESM declaration entrypoints while this Nest application is compiled as CommonJS.
// Keep the runtime dependency isolated here until the API is migrated to NodeNext modules.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AbilityBuilder, createMongoAbility } = require('@casl/ability') as any;
import { PrismaService } from '../database/prisma.service';

export type AuthorizationAbility = { can(action: string, subject: string): boolean };

export type AuthorizationRole = {
  id: string;
  code: string;
  name: string;
};

export type AuthorizationAccess = {
  roles: AuthorizationRole[];
  permissionCodes: string[];
  abilityRules: Array<{ action: string; subject: string }>;
  ability: AuthorizationAbility;
};

@Injectable()
export class AuthorizationService {
  constructor(private readonly prisma: PrismaService) {}

  async getAccess(userId: string): Promise<AuthorizationAccess> {
    const assignments = await (this.prisma.userRole as any).findMany({
      where: { userId },
      select: {
        role: {
          select: {
            id: true, scopeType: true,
            code: true,
            name: true,
            isActive: true,
            permissions: { select: { permission: { select: { code: true, action: true, subject: true, isActive: true } } } },
          },
        },
      },
    });
    const roles = assignments
      .map(({ role }: any) => ({
        ...role,
        permissions: role.permissions.filter(({ permission }: any) => permission.isActive !== false),
      }))
      .filter((role: any) => role.isActive && (role.scopeType ?? 'PLATFORM') === 'PLATFORM');
    const { can, build } = new AbilityBuilder(createMongoAbility);
    if (roles.some((role: AuthorizationRole) => role.code === 'SUPER_ADMIN')) {
      can('manage', 'all');
      return { roles, permissionCodes: [], abilityRules: [{ action: 'manage', subject: 'all' }], ability: build() };
    }
    const rawRules = roles.flatMap((role: any) =>
      role.permissions.map(({ permission }: any) => permission),
    );
    const rules = Array.from(
      new Map<string, any>(rawRules.map((permission: any) => [`${permission.action}:${permission.subject}`, permission])).values(),
    );
    for (const permission of rules) can(permission.action, permission.subject);
    return {
      roles,
      permissionCodes: Array.from(new Set(rules.map((permission: any) => permission.code))),
      abilityRules: rules.map((permission: any) => ({ action: permission.action, subject: permission.subject })),
      ability: build(),
    };
  }
}
