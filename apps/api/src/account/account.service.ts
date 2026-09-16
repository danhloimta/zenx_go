import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { OtpChannel, OtpPurpose } from '../common/domain';
import * as argon2 from 'argon2';
import { DomainError, ErrorCode } from '../common/errors';
import { normalizeEmail, normalizePhone } from '../common/normalize';
import { PrismaService } from '../database/prisma.service';
import { OtpService } from '../otp/otp.service';
import { AuthSettingsService } from '../auth-settings/auth-settings.service';
import {
  ChangeEmailDto,
  ChangePasswordDto,
  ChangePasswordOtpVerifyDto,
  ChangePhoneOtpVerifyDto,
  ChangePhoneDto,
  CompleteProfileDto,
  UpdateAccountDto,
} from './dto';

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};
type AvatarUpload = { buffer: Buffer; mimetype: string; size?: number };

@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otp: OtpService,
    private readonly config: ConfigService,
    @Optional() private readonly authSettings?: AuthSettingsService,
  ) {}

  getMe(userId: string) {
    return this.prisma.user
      .findUniqueOrThrow({
        where: { id: userId },
        include: {
          profile: true,
          socialIdentities: { select: { provider: true } },
          wallet: { select: { balance: true, currency: true } },
          roles: { select: { role: { select: { code: true } } } },
        },
      })
      .then((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        status: user.status,
        phoneVerifiedAt: user.phoneVerifiedAt,
        emailVerifiedAt: user.emailVerifiedAt,
        mustChangePassword: user.mustChangePassword,
        hasPassword: Boolean(user.passwordHash),
        profile: user.profile,
        social: {
          google: user.socialIdentities.some((identity) => identity.provider === 'GOOGLE'),
          facebook: user.socialIdentities.some((identity) => identity.provider === 'FACEBOOK'),
        },
        wallet: user.wallet,
        roles: user.roles.map(({ role }) => role.code),
      }));
  }


  async updateMe(userId: string, dto: UpdateAccountDto) {
    const currentProfile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: { profileCompletedAt: true },
    });
    await this.prisma.userProfile.update({
      where: { userId },
      data: {
        ...(dto.fullName !== undefined ? { fullName: dto.fullName.trim() } : {}),
        ...(dto.dateOfBirth !== undefined ? { dateOfBirth: new Date(dto.dateOfBirth) } : {}),
        ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
        ...(dto.city !== undefined ? { city: dto.city.trim() } : {}),
        ...(dto.address !== undefined ? { address: dto.address.trim() } : {}),
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
        // The web onboarding form uses the existing profile update contract.
        ...(currentProfile?.profileCompletedAt === null && dto.fullName?.trim()
          ? { profileCompletedAt: new Date() }
          : {}),
      },
    });
    return this.getMe(userId);
  }

  async completeProfile(userId: string, dto: CompleteProfileDto) {
    await this.prisma.userProfile.update({
      where: { userId },
      data: {
        fullName: dto.fullName.trim(),
        ...(dto.dateOfBirth !== undefined ? { dateOfBirth: new Date(dto.dateOfBirth) } : {}),
        ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
        ...(dto.city !== undefined ? { city: dto.city.trim() } : {}),
        ...(dto.address !== undefined ? { address: dto.address.trim() } : {}),
        profileCompletedAt: new Date(),
      },
    });
    return this.getMe(userId);
  }

  async uploadAvatar(userId: string, file?: AvatarUpload) {
    if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
      throw new DomainError(ErrorCode.INVALID_AVATAR, 'Avatar file is required', 400);
    }
    if (file.buffer.length > AVATAR_MAX_BYTES) {
      throw new DomainError(ErrorCode.INVALID_AVATAR, 'Avatar file must be 2 MB or smaller', 400);
    }
    const extension = AVATAR_EXTENSIONS[file.mimetype];
    if (!extension || !this.hasImageSignature(file.buffer, file.mimetype)) {
      throw new DomainError(
        ErrorCode.INVALID_AVATAR,
        'Avatar must be a JPEG, PNG, or WebP image',
        400,
      );
    }

    const uploadRoot = resolve(this.config.get<string>('uploadDir') ?? 'uploads');
    const avatarDirectory = join(uploadRoot, 'avatars');
    const filename = `${randomUUID()}${extension}`;
    const targetPath = join(avatarDirectory, filename);
    const avatarUrl = `/uploads/avatars/${filename}`;
    try {
      await mkdir(avatarDirectory, { recursive: true });
      await writeFile(targetPath, file.buffer, { flag: 'wx' });
    } catch {
      throw new DomainError(ErrorCode.INVALID_AVATAR, 'Avatar could not be stored', 500);
    }

    let previousUrl: string | null | undefined;
    try {
      const profile = await this.prisma.userProfile.findUniqueOrThrow({
        where: { userId },
        select: { avatarUrl: true },
      });
      previousUrl = profile.avatarUrl;
      await this.prisma.userProfile.update({ where: { userId }, data: { avatarUrl } });
    } catch (error) {
      await unlink(targetPath).catch(() => undefined);
      throw error;
    }

    await this.removeLocalAvatar(previousUrl, avatarDirectory);
    return { avatarUrl };
  }

  private async removeLocalAvatar(avatarUrl: string | null | undefined, avatarDirectory: string) {
    if (!avatarUrl || !avatarUrl.startsWith('/uploads/avatars/')) return;
    const filename = basename(avatarUrl);
    if (!filename || filename === '.' || filename === '..') return;
    const candidate = resolve(avatarDirectory, filename);
    const root = resolve(avatarDirectory);
    if (dirname(candidate) !== root || isAbsolute(filename)) return;
    await unlink(candidate).catch(() => undefined);
  }

  private hasImageSignature(buffer: Buffer, mimetype: string) {
    if (mimetype === 'image/jpeg')
      return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    if (mimetype === 'image/png')
      return buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (mimetype === 'image/webp')
      return (
        buffer.length >= 12 &&
        buffer.toString('ascii', 0, 4) === 'RIFF' &&
        buffer.toString('ascii', 8, 12) === 'WEBP'
      );
    return false;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new DomainError(ErrorCode.ACCOUNT_NOT_FOUND, 'Account not found', 404);
    if (user.passwordHash) {
      if (!dto.currentPassword || !(await argon2.verify(user.passwordHash, dto.currentPassword))) {
        throw new DomainError(ErrorCode.INVALID_CREDENTIALS, 'Current password is invalid', 401);
      }
    }
    if (
      user.passwordHash &&
      dto.currentPassword &&
      (await argon2.verify(user.passwordHash, dto.newPassword))
    ) {
      throw new DomainError(
        ErrorCode.PASSWORD_REUSE,
        'New password must be different from the current password',
        400,
      );
    }
    const otpRequired = await this.isOtpRequired();
    let phoneVerifiedAt: Date | undefined;
    if (otpRequired || dto.verificationToken) {
      if (!user.phone) {
        if (otpRequired) {
          throw new DomainError(
            ErrorCode.PASSWORD_CHANGE_OTP_UNAVAILABLE,
            'A phone number is required to change the password with OTP enabled',
            400,
          );
        }
      } else {
        if (!dto.verificationToken) {
          throw new DomainError(
            ErrorCode.VERIFICATION_TOKEN_INVALID,
            'Password change verification is required',
            400,
          );
        }
        try {
          await this.otp.consumeVerificationToken(
            dto.verificationToken,
            OtpPurpose.CHANGE_PASSWORD,
            user.phone,
            userId,
            OtpChannel.SMS,
          );
          if (!user.phoneVerifiedAt) phoneVerifiedAt = new Date();
        } catch (error) {
          if (
            otpRequired ||
            !(error instanceof DomainError) ||
            error.code !== ErrorCode.VERIFICATION_TOKEN_INVALID
          ) {
            throw error;
          }
        }
      }
    }
    const passwordHash = await argon2.hash(dto.newPassword);
    const passwordData = {
      passwordHash,
      mustChangePassword: false,
      ...(user.mustChangePassword ? { authVersion: { increment: 1 } } : {}),
    };
    const originalPhoneNormalized = user.phone ? normalizePhone(user.phone) : undefined;
    await this.prisma.$transaction(async (tx) => {
      if (phoneVerifiedAt && originalPhoneNormalized) {
        const marked = await tx.user.updateMany({
          where: { id: userId, phoneNormalized: originalPhoneNormalized },
          data: { ...passwordData, phoneVerifiedAt },
        });
        if (marked.count === 0) {
          // The phone changed after OTP verification; change only the password
          // and never mark the replacement number as verified.
          await tx.user.update({ where: { id: userId }, data: passwordData });
        }
      } else {
        await tx.user.update({ where: { id: userId }, data: passwordData });
      }
      await tx.refreshSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
    return { changed: true };
  }

  async changeEmail(userId: string, dto: ChangeEmailDto) {
    await this.otp.consumeVerificationToken(
      dto.verificationToken,
      OtpPurpose.CHANGE_EMAIL,
      dto.newEmail,
    );
    const emailNormalized = normalizeEmail(dto.newEmail);
    const duplicate = await this.prisma.user.findFirst({
      where: { emailNormalized, NOT: { id: userId } },
    });
    if (duplicate)
      throw new DomainError(ErrorCode.EMAIL_ALREADY_EXISTS, 'Email already exists', 409);
    await this.prisma.user.update({
      where: { id: userId },
      data: { email: dto.newEmail.trim(), emailNormalized, emailVerifiedAt: new Date() },
    });
    return { changed: true };
  }

  async changePhone(userId: string, dto: ChangePhoneDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });
    if (!user) throw new DomainError(ErrorCode.ACCOUNT_NOT_FOUND, 'Account not found', 404);

    const otpRequired = await this.isOtpRequired();
    const originalPhoneNormalized = user.phone ? normalizePhone(user.phone) : undefined;
    if (otpRequired || dto.verificationToken) {
      if (!user.phone) {
        if (otpRequired) {
          throw new DomainError(
            ErrorCode.PHONE_CHANGE_OTP_UNAVAILABLE,
            'A current phone number is required to change the phone number with OTP enabled',
            400,
          );
        }
      } else if (dto.verificationToken) {
        try {
          await this.otp.consumeVerificationToken(
            dto.verificationToken,
            OtpPurpose.CHANGE_PHONE,
            user.phone,
            userId,
            OtpChannel.SMS,
          );
        } catch (error) {
          if (
            otpRequired ||
            !(error instanceof DomainError) ||
            error.code !== ErrorCode.VERIFICATION_TOKEN_INVALID
          ) {
            throw error;
          }
        }
      }
      if (!dto.verificationToken) {
        if (otpRequired) {
          throw new DomainError(
            ErrorCode.VERIFICATION_TOKEN_INVALID,
            'Phone verification is required to change the phone number',
            400,
          );
        }
      }
    }
    const phoneNormalized = normalizePhone(dto.newPhone);
    const duplicate = await this.prisma.user.findFirst({
      where: { phoneNormalized, NOT: { id: userId } },
    });
    if (duplicate)
      throw new DomainError(ErrorCode.PHONE_ALREADY_EXISTS, 'Phone already exists', 409);

    const data = {
      phone: dto.newPhone.trim(),
      phoneNormalized,
      phoneVerifiedAt: null,
    };
    if (otpRequired && originalPhoneNormalized) {
      const updated = await this.prisma.user.updateMany({
        where: { id: userId, phoneNormalized: originalPhoneNormalized },
        data,
      });
      if (updated.count === 0) {
        throw new DomainError(
          ErrorCode.PHONE_CHANGE_CONFLICT,
          'The current phone number changed before verification completed; request a new OTP',
          409,
        );
      }
    } else {
      await this.prisma.user.update({ where: { id: userId }, data });
    }
    return { changed: true };
  }

  async sendChangePhoneOtp(userId: string) {
    if (!(await this.isOtpRequired())) {
      throw new DomainError(
        ErrorCode.OTP_NOT_REQUIRED,
        'OTP is not required for phone changes',
        400,
      );
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });
    if (!user) throw new DomainError(ErrorCode.ACCOUNT_NOT_FOUND, 'Account not found', 404);
    if (!user.phone) {
      throw new DomainError(
        ErrorCode.PHONE_CHANGE_OTP_UNAVAILABLE,
        'A current phone number is required to change the phone number with OTP enabled',
        400,
      );
    }
    const result = await this.otp.send({
      channel: OtpChannel.SMS,
      purpose: OtpPurpose.CHANGE_PHONE,
      destination: user.phone,
      userId,
    });
    return { ...result, destination: maskPhone(user.phone) };
  }

  async verifyChangePhoneOtp(userId: string, dto: ChangePhoneOtpVerifyDto) {
    if (!(await this.isOtpRequired())) {
      throw new DomainError(
        ErrorCode.OTP_NOT_REQUIRED,
        'OTP is not required for phone changes',
        400,
      );
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });
    if (!user) throw new DomainError(ErrorCode.ACCOUNT_NOT_FOUND, 'Account not found', 404);
    if (!user.phone) {
      throw new DomainError(
        ErrorCode.PHONE_CHANGE_OTP_UNAVAILABLE,
        'A current phone number is required to change the phone number with OTP enabled',
        400,
      );
    }
    return this.otp.verify({
      channel: OtpChannel.SMS,
      purpose: OtpPurpose.CHANGE_PHONE,
      destination: user.phone,
      code: dto.code,
      userId,
    });
  }

  async sendChangePasswordOtp(userId: string) {
    if (!(await this.isOtpRequired())) {
      throw new DomainError(
        ErrorCode.OTP_NOT_REQUIRED,
        'OTP is not required for password changes',
        400,
      );
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });
    if (!user) throw new DomainError(ErrorCode.ACCOUNT_NOT_FOUND, 'Account not found', 404);
    if (!user.phone) {
      throw new DomainError(
        ErrorCode.PASSWORD_CHANGE_OTP_UNAVAILABLE,
        'A phone number is required to change the password with OTP enabled',
        400,
      );
    }
    const result = await this.otp.send({
      channel: OtpChannel.SMS,
      purpose: OtpPurpose.CHANGE_PASSWORD,
      destination: user.phone,
      userId,
    });
    return { ...result, destination: maskPhone(user.phone) };
  }

  async verifyChangePasswordOtp(userId: string, dto: ChangePasswordOtpVerifyDto) {
    if (!(await this.isOtpRequired())) {
      throw new DomainError(
        ErrorCode.OTP_NOT_REQUIRED,
        'OTP is not required for password changes',
        400,
      );
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });
    if (!user) throw new DomainError(ErrorCode.ACCOUNT_NOT_FOUND, 'Account not found', 404);
    if (!user.phone) {
      throw new DomainError(
        ErrorCode.PASSWORD_CHANGE_OTP_UNAVAILABLE,
        'A phone number is required to change the password with OTP enabled',
        400,
      );
    }
    return this.otp.verify({
      channel: OtpChannel.SMS,
      purpose: OtpPurpose.CHANGE_PASSWORD,
      destination: user.phone,
      code: dto.code,
      userId,
    });
  }

  private async isOtpRequired() {
    if (!this.authSettings) return true;
    return this.authSettings.isOtpRequired();
  }
}

function maskPhone(value: string) {
  const normalized = normalizePhone(value);
  return `${normalized.slice(0, 3)}******${normalized.slice(-4)}`;
}
