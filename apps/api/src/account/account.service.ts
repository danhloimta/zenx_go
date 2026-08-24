import { Injectable } from '@nestjs/common';
import { AccountStatus, OtpPurpose } from '../common/domain';
import * as argon2 from 'argon2';
import { DomainError, ErrorCode } from '../common/errors';
import { normalizeEmail, normalizePhone } from '../common/normalize';
import { PrismaService } from '../database/prisma.service';
import { OtpService } from '../otp/otp.service';
import { ChangeEmailDto, ChangePasswordDto, ChangePhoneDto, UpdateAccountDto } from './dto';

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService, private readonly otp: OtpService) {}

  getMe(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { profile: true, socialIdentities: { select: { provider: true } }, wallet: { select: { balance: true, currency: true } } },
    }).then((user) => ({
      id: user.id, username: user.username, email: user.email, phone: user.phone, status: user.status,
      phoneVerifiedAt: user.phoneVerifiedAt, emailVerifiedAt: user.emailVerifiedAt, profile: user.profile,
      social: { google: user.socialIdentities.some((identity) => identity.provider === 'GOOGLE'), facebook: user.socialIdentities.some((identity) => identity.provider === 'FACEBOOK') },
      wallet: user.wallet,
    }));
  }

  async updateMe(userId: string, dto: UpdateAccountDto) {
    await this.prisma.userProfile.update({ where: { userId }, data: {
      ...(dto.fullName !== undefined ? { fullName: dto.fullName.trim() } : {}),
      ...(dto.dateOfBirth !== undefined ? { dateOfBirth: new Date(dto.dateOfBirth) } : {}),
      ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
      ...(dto.city !== undefined ? { city: dto.city.trim() } : {}),
      ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
    } });
    return this.getMe(userId);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash || !(await argon2.verify(user.passwordHash, dto.currentPassword))) throw new DomainError(ErrorCode.INVALID_CREDENTIALS, 'Current password is invalid', 401);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: await argon2.hash(dto.newPassword) } });
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
    await this.prisma.user.update({ where: { id: userId }, data: { phone: dto.newPhone.trim(), phoneNormalized, phoneVerifiedAt: new Date(), status: AccountStatus.ACTIVE } });
    return { changed: true };
  }
}
