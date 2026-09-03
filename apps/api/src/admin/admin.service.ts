import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { AccountStatus, AdminAuditAction, AdminRole } from '../common/domain';
import { DomainError, ErrorCode } from '../common/errors';
import { normalizeEmail, normalizePhone, normalizeUsername } from '../common/normalize';
import { PrismaService } from '../database/prisma.service';
import { SensitiveProfileCrypto } from '../account/sensitive-profile.service';
import { AdminAuditContext, AdminAuditService } from './admin.audit.service';
import {
  AdminAuditLogsQueryDto,
  AdminProfileUpdateDto,
  AdminReasonDto,
  AdminResetPasswordDto,
  AdminStatusUpdateDto,
  AdminUsersQueryDto,
} from './admin.dto';

const USER_PROFILE_SELECT = {
  fullName: true,
  avatarUrl: true,
  dateOfBirth: true,
  gender: true,
  city: true,
  address: true,
  profileCompletedAt: true,
} as const;

const USER_LIST_INCLUDE = {
  profile: { select: USER_PROFILE_SELECT },
  roles: { select: { role: true } },
} as const;

export type AdminRequestContext = AdminAuditContext;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
    private readonly sensitiveCrypto: SensitiveProfileCrypto,
  ) {}

  async me(actorUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: actorUserId },
      include: { profile: { select: USER_PROFILE_SELECT }, roles: { select: { role: true } } },
    });
    if (
      !user ||
      !user.roles.some(({ role }) => Object.values(AdminRole).includes(role as AdminRole))
    ) {
      throw new DomainError(
        ErrorCode.ADMIN_ACCESS_REQUIRED,
        'Administrator access is required',
        403,
      );
    }
    return this.publicUser(user);
  }

  async dashboard() {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [total, statusCounts, newUsers, recentUsers, recentAudit] = await Promise.all([
      this.prisma.user.count(),
      Promise.all(
        Object.values(AccountStatus).map(
          async (status) => [status, await this.prisma.user.count({ where: { status } })] as const,
        ),
      ),
      this.prisma.user.count({ where: { createdAt: { gte: since } } }),
      this.prisma.user.findMany({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 10,
        include: USER_LIST_INCLUDE,
      }),
      this.prisma.adminAuditLog.findMany({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 10,
        include: { actor: { select: { username: true } } },
      }),
    ]);
    return {
      users: {
        total,
        byStatus: Object.fromEntries(statusCounts),
        registeredLast7Days: newUsers,
      },
      recentUsers: recentUsers.map((user) => this.publicUser(user)),
      recentActivity: recentAudit.map((entry) => this.publicAudit(entry)),
    };
  }

  async listUsers(query: AdminUsersQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();
    const where: Prisma.UserWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? {
            OR: [
              { username: { contains: search } },
              { email: { contains: search } },
              { phone: { contains: search } },
              { profile: { is: { fullName: { contains: search } } } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: USER_LIST_INCLUDE,
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      items: items.map((user) => this.publicUser(user)),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getUser(userId: string) {
    const [user, transactions, auditLogs] = await this.prisma.$transaction([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: { select: USER_PROFILE_SELECT },
          roles: { select: { role: true } },
          socialIdentities: { select: { provider: true, linkedAt: true, lastLoginAt: true } },
          wallet: { select: { currency: true, balance: true, updatedAt: true } },
          sensitiveProfile: {
            select: { citizenIdCiphertext: true, citizenIdLast4: true, securityQuestionCode: true },
          },
        },
      }),
      this.prisma.walletTransaction.findMany({
        where: { userId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 10,
        select: {
          transactionNo: true,
          type: true,
          amount: true,
          balanceBefore: true,
          balanceAfter: true,
          status: true,
          referenceType: true,
          referenceId: true,
          description: true,
          createdAt: true,
          completedAt: true,
          payment: {
            select: {
              paymentNo: true,
              provider: true,
              paymentMethod: true,
              providerTransactionId: true,
              paidAt: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.adminAuditLog.findMany({
        where: { targetType: 'USER', targetId: userId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 20,
        include: { actor: { select: { username: true } } },
      }),
    ]);
    if (!user) throw new DomainError(ErrorCode.ACCOUNT_NOT_FOUND, 'Account not found', 404);
    return {
      ...this.publicUser(user),
      socialIdentities: user.socialIdentities,
      sensitiveProfile: user.sensitiveProfile
        ? {
            identity: {
              configured: Boolean(user.sensitiveProfile.citizenIdCiphertext),
              last4: user.sensitiveProfile.citizenIdLast4,
            },
            security: { configured: Boolean(user.sensitiveProfile.securityQuestionCode) },
          }
        : { identity: { configured: false, last4: null }, security: { configured: false } },
      wallet: user.wallet,
      recentTransactions: transactions.map((transaction) => ({
        ...transaction,
        payment: transaction.payment
          ? {
              ...transaction.payment,
              providerTransactionId: transaction.payment.providerTransactionId
                ? maskProviderTransactionId(transaction.payment.providerTransactionId)
                : null,
            }
          : null,
      })),
      auditLogs: auditLogs.map((entry) => this.publicAudit(entry)),
    };
  }

  async updateProfile(userId: string, dto: AdminProfileUpdateDto, context: AdminRequestContext) {
    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!current) throw new DomainError(ErrorCode.ACCOUNT_NOT_FOUND, 'Account not found', 404);
    this.assertExpectedVersion(current.updatedAt, dto.expectedUpdatedAt);

    const nextUsername = dto.username === undefined ? current.username : dto.username.trim();
    const nextEmail = dto.email === undefined ? current.email : dto.email.trim();
    const nextPhone = dto.phone === undefined ? current.phone : dto.phone;
    const nextPhoneNormalized = nextPhone ? normalizePhone(nextPhone) : null;
    const usernameChanged = nextUsername !== current.username;
    const emailChanged = nextEmail !== current.email;
    const phoneChanged =
      nextPhone !== current.phone || nextPhoneNormalized !== current.phoneNormalized;
    const profileFields = ['fullName', 'dateOfBirth', 'gender', 'city', 'address'].filter(
      (field) => dto[field as keyof AdminProfileUpdateDto] !== undefined,
    );
    if (
      !usernameChanged &&
      !emailChanged &&
      !phoneChanged &&
      profileFields.length === 0 &&
      dto.emailVerified === undefined &&
      dto.phoneVerified === undefined
    ) {
      throw new DomainError(ErrorCode.ADMIN_NO_CHANGES, 'No profile changes were provided', 400);
    }
    if (emailChanged && dto.emailVerified === undefined) {
      throw new DomainError(
        ErrorCode.ADMIN_CONTACT_VERIFICATION_REQUIRED,
        'Choose whether the new email is verified',
        400,
      );
    }
    if (phoneChanged && dto.phoneVerified === undefined) {
      throw new DomainError(
        ErrorCode.ADMIN_CONTACT_VERIFICATION_REQUIRED,
        'Choose whether the new phone is verified',
        400,
      );
    }
    if (nextPhone === null && dto.phoneVerified) {
      throw new DomainError(
        ErrorCode.ADMIN_CONTACT_VERIFICATION_REQUIRED,
        'An empty phone cannot be verified',
        400,
      );
    }

    const [duplicateUsername, duplicateEmail, duplicatePhone] = await Promise.all([
      usernameChanged
        ? this.prisma.user.findFirst({
            where: { usernameNormalized: normalizeUsername(nextUsername), NOT: { id: userId } },
            select: { id: true },
          })
        : null,
      emailChanged
        ? this.prisma.user.findFirst({
            where: { emailNormalized: normalizeEmail(nextEmail), NOT: { id: userId } },
            select: { id: true },
          })
        : null,
      phoneChanged && nextPhoneNormalized
        ? this.prisma.user.findFirst({
            where: { phoneNormalized: nextPhoneNormalized, NOT: { id: userId } },
            select: { id: true },
          })
        : null,
    ]);
    if (duplicateUsername)
      throw new DomainError(ErrorCode.USERNAME_ALREADY_EXISTS, 'Username already exists', 409);
    if (duplicateEmail)
      throw new DomainError(ErrorCode.EMAIL_ALREADY_EXISTS, 'Email already exists', 409);
    if (duplicatePhone)
      throw new DomainError(ErrorCode.PHONE_ALREADY_EXISTS, 'Phone already exists', 409);

    const userData: Prisma.UserUpdateManyMutationInput = {
      ...(usernameChanged
        ? { username: nextUsername, usernameNormalized: normalizeUsername(nextUsername) }
        : {}),
      ...(emailChanged ? { email: nextEmail, emailNormalized: normalizeEmail(nextEmail) } : {}),
      ...(dto.phone !== undefined
        ? { phone: nextPhone, phoneNormalized: nextPhoneNormalized }
        : {}),
      ...(dto.emailVerified !== undefined
        ? { emailVerifiedAt: dto.emailVerified ? new Date() : null }
        : {}),
      ...(dto.phoneVerified !== undefined
        ? { phoneVerifiedAt: dto.phoneVerified ? new Date() : null }
        : {}),
      ...(usernameChanged || emailChanged || phoneChanged ? { authVersion: { increment: 1 } } : {}),
      updatedAt: new Date(),
    };
    const profileData: Prisma.UserProfileUpdateInput = {
      ...(dto.fullName !== undefined ? { fullName: dto.fullName.trim() } : {}),
      ...(dto.dateOfBirth !== undefined
        ? { dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null }
        : {}),
      ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
      ...(dto.city !== undefined ? { city: dto.city } : {}),
      ...(dto.address !== undefined ? { address: dto.address } : {}),
    };
    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({
        where: { id: userId, updatedAt: current.updatedAt },
        data: userData,
      });
      if (updated.count !== 1)
        throw new DomainError(
          ErrorCode.STALE_ADMIN_UPDATE,
          'The account was changed by another operator',
          409,
        );
      if (Object.keys(profileData).length > 0 && current.profile) {
        await tx.userProfile.update({ where: { userId }, data: profileData });
      }
      if (usernameChanged || emailChanged || phoneChanged) {
        await tx.refreshSession.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      await this.audit.record(
        {
          ...context,
          action: AdminAuditAction.PROFILE_UPDATED,
          targetType: 'USER',
          targetId: userId,
          reason: dto.reason,
          metadata: {
            fields: [
              ...profileFields,
              ...(usernameChanged ? ['username'] : []),
              ...(emailChanged ? ['email'] : []),
              ...(phoneChanged ? ['phone'] : []),
            ],
            email: emailChanged ? maskEmail(nextEmail) : undefined,
            phone:
              phoneChanged && nextPhone
                ? maskPhone(nextPhone)
                : nextPhone === null
                  ? null
                  : undefined,
            emailVerified: dto.emailVerified,
            phoneVerified: dto.phoneVerified,
          },
        },
        tx,
      );
    });
    return this.getUser(userId);
  }

  async updateStatus(userId: string, dto: AdminStatusUpdateDto, context: AdminRequestContext) {
    if (userId === context.actorUserId)
      throw new DomainError(
        ErrorCode.ADMIN_SELF_ACTION_FORBIDDEN,
        'An administrator cannot suspend their own account',
        400,
      );
    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { select: { role: true } } },
    });
    if (!current) throw new DomainError(ErrorCode.ACCOUNT_NOT_FOUND, 'Account not found', 404);
    this.assertExpectedVersion(current.updatedAt, dto.expectedUpdatedAt);
    if (current.status !== AccountStatus.ACTIVE && current.status !== AccountStatus.SUSPENDED) {
      throw new DomainError(
        ErrorCode.ADMIN_STATUS_TRANSITION_INVALID,
        'This account status cannot be changed by an administrator',
        400,
      );
    }
    if (current.status === dto.status) return this.getUser(userId);
    await this.prisma.$transaction(async (tx) => {
      if (
        dto.status === AccountStatus.SUSPENDED &&
        current.roles.some(({ role }) => role === AdminRole.SUPER_ADMIN)
      ) {
        const activeAdmins = await tx.user.count({
          where: { status: AccountStatus.ACTIVE, roles: { some: { role: AdminRole.SUPER_ADMIN } } },
        });
        if (activeAdmins <= 1)
          throw new DomainError(
            ErrorCode.LAST_SUPER_ADMIN_PROTECTED,
            'The last active super administrator cannot be suspended',
            400,
          );
      }
      const updated = await tx.user.updateMany({
        where: { id: userId, updatedAt: current.updatedAt },
        data: { status: dto.status, authVersion: { increment: 1 }, updatedAt: new Date() },
      });
      if (updated.count !== 1)
        throw new DomainError(
          ErrorCode.STALE_ADMIN_UPDATE,
          'The account was changed by another operator',
          409,
        );
      await tx.refreshSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await this.audit.record(
        {
          ...context,
          action: AdminAuditAction.STATUS_CHANGED,
          targetType: 'USER',
          targetId: userId,
          reason: dto.reason,
          metadata: { from: current.status, to: dto.status },
        },
        tx,
      );
    });
    return this.getUser(userId);
  }

  async revokeSessions(userId: string, dto: AdminReasonDto, context: AdminRequestContext) {
    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!current) throw new DomainError(ErrorCode.ACCOUNT_NOT_FOUND, 'Account not found', 404);
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { authVersion: { increment: 1 }, updatedAt: new Date() },
      });
      await tx.refreshSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await this.audit.record(
        {
          ...context,
          action: AdminAuditAction.SESSIONS_REVOKED,
          targetType: 'USER',
          targetId: userId,
          reason: dto.reason,
        },
        tx,
      );
    });
    return { revoked: true };
  }

  async resetPassword(userId: string, dto: AdminResetPasswordDto, context: AdminRequestContext) {
    if (dto.temporaryPassword !== dto.temporaryPasswordConfirmation) {
      throw new DomainError(
        ErrorCode.INVALID_CREDENTIALS,
        'Temporary password confirmation does not match',
        400,
      );
    }
    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, updatedAt: true },
    });
    if (!current) throw new DomainError(ErrorCode.ACCOUNT_NOT_FOUND, 'Account not found', 404);
    this.assertExpectedVersion(current.updatedAt, dto.expectedUpdatedAt);
    const passwordHash = await argon2.hash(dto.temporaryPassword);
    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({
        where: { id: userId, updatedAt: current.updatedAt },
        data: {
          passwordHash,
          mustChangePassword: true,
          authVersion: { increment: 1 },
          updatedAt: new Date(),
        },
      });
      if (updated.count !== 1)
        throw new DomainError(
          ErrorCode.STALE_ADMIN_UPDATE,
          'The account was changed by another operator',
          409,
        );
      await tx.refreshSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await this.audit.record(
        {
          ...context,
          action: AdminAuditAction.PASSWORD_RESET,
          targetType: 'USER',
          targetId: userId,
          reason: dto.reason,
          metadata: { temporary: true },
        },
        tx,
      );
    });
    return { reset: true };
  }

  async revealSensitiveProfile(userId: string, reason: string, context: AdminRequestContext) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw new DomainError(ErrorCode.ACCOUNT_NOT_FOUND, 'Account not found', 404);
    const profile = await this.prisma.sensitiveProfile.findUnique({
      where: { userId },
      select: { citizenIdCiphertext: true, citizenIdIv: true, citizenIdAuthTag: true },
    });
    const identity = profile?.citizenIdCiphertext
      ? this.sensitiveCrypto.decrypt({
          ciphertext: profile.citizenIdCiphertext,
          iv: profile.citizenIdIv,
          authTag: profile.citizenIdAuthTag,
        })
      : null;
    await this.audit.record({
      ...context,
      action: AdminAuditAction.SENSITIVE_PROFILE_REVEALED,
      targetType: 'USER',
      targetId: userId,
      reason,
      metadata: { identityConfigured: Boolean(identity) },
    });
    return { identity };
  }

  async listAuditLogs(query: AdminAuditLogsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const createdAt: Prisma.DateTimeFilter = {};
    if (query.from) createdAt.gte = new Date(query.from);
    if (query.to) createdAt.lte = new Date(query.to);
    const where: Prisma.AdminAuditLogWhereInput = {
      ...(query.actorUserId ? { actorUserId: query.actorUserId } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(query.targetId ? { targetId: query.targetId } : {}),
      ...(createdAt.gte || createdAt.lte ? { createdAt } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.adminAuditLog.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { actor: { select: { username: true } } },
      }),
      this.prisma.adminAuditLog.count({ where }),
    ]);
    return {
      items: items.map((item) => this.publicAudit(item)),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  private assertExpectedVersion(current: Date, expected: string) {
    const date = new Date(expected);
    if (Number.isNaN(date.getTime()) || date.getTime() !== current.getTime()) {
      throw new DomainError(
        ErrorCode.STALE_ADMIN_UPDATE,
        'The account was changed by another operator',
        409,
      );
    }
  }

  private publicUser(user: {
    id: string;
    username: string;
    email: string;
    phone: string | null;
    status: string;
    phoneVerifiedAt: Date | null;
    emailVerifiedAt: Date | null;
    mustChangePassword: boolean;
    createdAt: Date;
    updatedAt: Date;
    profile?: {
      fullName: string;
      avatarUrl: string | null;
      dateOfBirth: Date | null;
      gender: string;
      city: string | null;
      address: string | null;
      profileCompletedAt: Date | null;
    } | null;
    roles?: { role: string }[];
    wallet?: { currency: string; balance: bigint; updatedAt: Date } | null;
  }) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      status: user.status,
      emailVerified: Boolean(user.emailVerifiedAt),
      phoneVerified: Boolean(user.phoneVerifiedAt),
      emailVerifiedAt: user.emailVerifiedAt,
      phoneVerifiedAt: user.phoneVerifiedAt,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile: user.profile ?? null,
      roles: user.roles?.map(({ role }) => role) ?? [],
      ...(user.wallet !== undefined ? { wallet: user.wallet } : {}),
    };
  }

  private publicAudit(entry: {
    id: string;
    actorUserId: string;
    action: string;
    targetType: string;
    targetId: string | null;
    reason: string;
    metadata: string;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
    actor?: { username: string };
  }) {
    let metadata: unknown = {};
    try {
      metadata = JSON.parse(entry.metadata);
    } catch {
      metadata = {};
    }
    return {
      id: entry.id,
      actorUserId: entry.actorUserId,
      actorUsername: entry.actor?.username ?? null,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      reason: entry.reason,
      metadata,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      createdAt: entry.createdAt,
    };
  }
}

function maskEmail(value: string) {
  const [local, domain] = value.split('@');
  if (!domain) return '***';
  return `${(local ?? '').slice(0, 1)}***@${domain}`;
}

function maskPhone(value: string) {
  const normalized = normalizePhone(value);
  return normalized.length <= 4
    ? '****'
    : `${'*'.repeat(Math.max(4, normalized.length - 4))}${normalized.slice(-4)}`;
}

function maskProviderTransactionId(value: string) {
  return value.length <= 4
    ? '****'
    : `${'*'.repeat(Math.max(4, value.length - 4))}${value.slice(-4)}`;
}
