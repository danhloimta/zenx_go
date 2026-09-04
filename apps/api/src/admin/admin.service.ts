import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { AccountStatus, AdminRole } from '../common/domain';
import { DomainError, ErrorCode } from '../common/errors';
import { normalizeEmail, normalizePhone, normalizeUsername } from '../common/normalize';
import { PrismaService } from '../database/prisma.service';
import { SensitiveProfileCrypto } from '../account/sensitive-profile.service';
import {
  AdminProfileUpdateDto,
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

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
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
    const [total, statusCounts, newUsers, recentUsers] = await Promise.all([
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
    ]);
    return {
      users: {
        total,
        byStatus: Object.fromEntries(statusCounts),
        registeredLast7Days: newUsers,
      },
      recentUsers: recentUsers.map((user) => this.publicUser(user)),
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
    const [user, transactions] = await this.prisma.$transaction([
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
    };
  }

  async updateProfile(userId: string, dto: AdminProfileUpdateDto) {
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
    });
    return this.getUser(userId);
  }

  async updateStatus(userId: string, dto: AdminStatusUpdateDto, actorUserId: string) {
    if (userId === actorUserId)
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
    });
    return this.getUser(userId);
  }

  async revokeSessions(userId: string) {
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
    });
    return { revoked: true };
  }

  async resetPassword(userId: string, dto: AdminResetPasswordDto) {
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
    });
    return { reset: true };
  }

  async revealSensitiveProfile(userId: string) {
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
    return { identity };
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

}

function maskProviderTransactionId(value: string) {
  return value.length <= 4
    ? '****'
    : `${'*'.repeat(Math.max(4, value.length - 4))}${value.slice(-4)}`;
}
