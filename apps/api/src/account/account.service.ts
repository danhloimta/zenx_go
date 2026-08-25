import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { OtpPurpose } from '../common/domain';
import * as argon2 from 'argon2';
import { DomainError, ErrorCode } from '../common/errors';
import { normalizeEmail, normalizePhone } from '../common/normalize';
import { PrismaService } from '../database/prisma.service';
import { OtpService } from '../otp/otp.service';
import { ChangeEmailDto, ChangePasswordDto, ChangePhoneDto, CompleteProfileDto, UpdateAccountDto } from './dto';

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_EXTENSIONS: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
type AvatarUpload = { buffer: Buffer; mimetype: string; size?: number };

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService, private readonly otp: OtpService, private readonly config: ConfigService) {}

  getMe(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { profile: true, socialIdentities: { select: { provider: true } }, wallet: { select: { balance: true, currency: true } } },
    }).then((user) => ({
      id: user.id, username: user.username, email: user.email, phone: user.phone, status: user.status,
      phoneVerifiedAt: user.phoneVerifiedAt, emailVerifiedAt: user.emailVerifiedAt,
      hasPassword: Boolean(user.passwordHash), profile: user.profile,
      social: { google: user.socialIdentities.some((identity) => identity.provider === 'GOOGLE'), facebook: user.socialIdentities.some((identity) => identity.provider === 'FACEBOOK') },
      wallet: user.wallet,
    }));
  }

  async updateMe(userId: string, dto: UpdateAccountDto) {
    const currentProfile = await this.prisma.userProfile.findUnique({ where: { userId }, select: { profileCompletedAt: true } });
    await this.prisma.userProfile.update({ where: { userId }, data: {
      ...(dto.fullName !== undefined ? { fullName: dto.fullName.trim() } : {}),
      ...(dto.dateOfBirth !== undefined ? { dateOfBirth: new Date(dto.dateOfBirth) } : {}),
      ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
      ...(dto.city !== undefined ? { city: dto.city.trim() } : {}),
      ...(dto.address !== undefined ? { address: dto.address.trim() } : {}),
      ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
      // The web onboarding form uses the existing profile update contract.
      ...(currentProfile?.profileCompletedAt === null && dto.fullName?.trim() ? { profileCompletedAt: new Date() } : {}),
    } });
    return this.getMe(userId);
  }

  async completeProfile(userId: string, dto: CompleteProfileDto) {
    await this.prisma.userProfile.update({ where: { userId }, data: {
      fullName: dto.fullName.trim(),
      ...(dto.dateOfBirth !== undefined ? { dateOfBirth: new Date(dto.dateOfBirth) } : {}),
      ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
      ...(dto.city !== undefined ? { city: dto.city.trim() } : {}),
      ...(dto.address !== undefined ? { address: dto.address.trim() } : {}),
      profileCompletedAt: new Date(),
    } });
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
      throw new DomainError(ErrorCode.INVALID_AVATAR, 'Avatar must be a JPEG, PNG, or WebP image', 400);
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
      const profile = await this.prisma.userProfile.findUniqueOrThrow({ where: { userId }, select: { avatarUrl: true } });
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
    if (mimetype === 'image/jpeg') return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    if (mimetype === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (mimetype === 'image/webp') return buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
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
    if (user.passwordHash && dto.currentPassword && (await argon2.verify(user.passwordHash, dto.newPassword))) {
      throw new DomainError(ErrorCode.PASSWORD_REUSE, 'New password must be different from the current password', 400);
    }
    const passwordHash = await argon2.hash(dto.newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      this.prisma.refreshSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);
    return { changed: true };
  }

  async changeEmail(userId: string, dto: ChangeEmailDto) {
    await this.otp.consumeVerificationToken(dto.verificationToken, OtpPurpose.CHANGE_EMAIL, dto.newEmail);
    const emailNormalized = normalizeEmail(dto.newEmail);
    const duplicate = await this.prisma.user.findFirst({ where: { emailNormalized, NOT: { id: userId } } });
    if (duplicate) throw new DomainError(ErrorCode.EMAIL_ALREADY_EXISTS, 'Email already exists', 409);
    await this.prisma.user.update({ where: { id: userId }, data: { email: dto.newEmail.trim(), emailNormalized, emailVerifiedAt: new Date() } });
    return { changed: true };
  }

  async changePhone(userId: string, dto: ChangePhoneDto) {
    await this.otp.consumeVerificationToken(dto.verificationToken, OtpPurpose.CHANGE_PHONE, dto.newPhone);
    const phoneNormalized = normalizePhone(dto.newPhone);
    const duplicate = await this.prisma.user.findFirst({ where: { phoneNormalized, NOT: { id: userId } } });
    if (duplicate) throw new DomainError(ErrorCode.PHONE_ALREADY_EXISTS, 'Phone already exists', 409);
    await this.prisma.user.update({ where: { id: userId }, data: { phone: dto.newPhone.trim(), phoneNormalized, phoneVerifiedAt: new Date() } });
    return { changed: true };
  }
}
