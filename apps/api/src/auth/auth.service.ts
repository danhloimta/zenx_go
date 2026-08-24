import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AccountStatus } from '../common/domain';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { DomainError, ErrorCode } from '../common/errors';
import { normalizeEmail, normalizePhone, normalizeUsername } from '../common/normalize';
import { ACCESS_TTL_SECONDS, REFRESH_TTL_SECONDS } from '../common/constants';
import { PrismaService } from '../database/prisma.service';
import { OtpService } from '../otp/otp.service';
import { LoginDto, RegisterDto, ResetPasswordDto } from './dto';

export type AuthTokens = { accessToken: string; refreshToken: string; user: unknown };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly otp: OtpService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    if (!dto.acceptTerms || !dto.acceptPrivacy) {
      throw new DomainError('INVALID_CREDENTIALS', 'Terms and privacy acceptance are required', 400);
    }
    const usernameNormalized = normalizeUsername(dto.username);
    const emailNormalized = normalizeEmail(dto.email);
    const phoneNormalized = normalizePhone(dto.phone);
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ usernameNormalized }, { emailNormalized }, { phoneNormalized }] },
      select: { usernameNormalized: true, emailNormalized: true, phoneNormalized: true },
    });
    if (existing?.usernameNormalized === usernameNormalized) throw new DomainError(ErrorCode.USERNAME_ALREADY_EXISTS, 'Username already exists', 409);
    if (existing?.emailNormalized === emailNormalized) throw new DomainError(ErrorCode.EMAIL_ALREADY_EXISTS, 'Email already exists', 409);
    if (existing?.phoneNormalized === phoneNormalized) throw new DomainError(ErrorCode.PHONE_ALREADY_EXISTS, 'Phone already exists', 409);
    await this.otp.consumeVerificationToken(dto.verificationToken, 'VERIFY_PHONE', dto.phone);
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        username: dto.username.trim(), usernameNormalized, email: dto.email.trim(), emailNormalized,
        phone: dto.phone.trim(), phoneNormalized, passwordHash, status: AccountStatus.ACTIVE,
        phoneVerifiedAt: new Date(),
        profile: { create: {
          fullName: dto.fullName.trim(), dateOfBirth: new Date(dto.dateOfBirth), gender: dto.gender,
          city: dto.city.trim(), termsVersion: this.config.getOrThrow('termsVersion'),
          privacyVersion: this.config.getOrThrow('privacyVersion'), acceptedAt: new Date(),
        } },
        wallet: { create: { currency: 'ZENX', balance: 0n } },
      },
      include: { profile: true },
    });
    return this.issueTokens(user.id, user.username, user);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const identity = normalizeUsername(dto.username);
    const user = await this.prisma.user.findUnique({ where: { usernameNormalized: identity }, include: { profile: true } });
    if (!user || !user.passwordHash || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new DomainError(ErrorCode.INVALID_CREDENTIALS, 'Invalid username or password', 401);
    }
    if (user.status === AccountStatus.LOCKED) throw new DomainError(ErrorCode.ACCOUNT_LOCKED, 'Account is locked', 403);
    if (user.status === AccountStatus.SUSPENDED) throw new DomainError(ErrorCode.ACCOUNT_SUSPENDED, 'Account is suspended', 403);
    return this.issueTokens(user.id, user.username, user);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: { sub: string; username: string; sid: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, { secret: this.config.getOrThrow('jwtRefreshSecret') });
    } catch {
      throw new DomainError(ErrorCode.INVALID_CREDENTIALS, 'Refresh session is invalid', 401);
    }
    const session = await this.prisma.refreshSession.findUnique({ where: { id: payload.sid }, include: { user: { include: { profile: true } } } });
    if (!session || session.revokedAt || session.expiresAt <= new Date() || !(await argon2.verify(session.tokenHash, refreshToken))) {
      throw new DomainError(ErrorCode.INVALID_CREDENTIALS, 'Refresh session is invalid', 401);
    }
    const claimed = await this.prisma.refreshSession.updateMany({ where: { id: session.id, revokedAt: null }, data: { revokedAt: new Date() } });
    if (claimed.count !== 1) throw new DomainError(ErrorCode.INVALID_CREDENTIALS, 'Refresh session is invalid', 401);
    return this.issueTokens(session.user.id, session.user.username, session.user);
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) return;
    try {
      const payload = await this.jwt.verifyAsync<{ sid: string }>(refreshToken, { secret: this.config.getOrThrow('jwtRefreshSecret'), ignoreExpiration: true });
      await this.prisma.refreshSession.updateMany({ where: { id: payload.sid, revokedAt: null }, data: { revokedAt: new Date() } });
    } catch {
      // Logout is intentionally idempotent.
    }
  }

  async forgotPassword(email: string) {
    const normalized = normalizeEmail(email);
    const user = await this.prisma.user.findUnique({ where: { emailNormalized: normalized } });
    if (user) await this.otp.send({ channel: 'EMAIL', purpose: 'RESET_PASSWORD', destination: user.email, userId: user.id });
    return { accepted: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { emailNormalized: normalizeEmail(dto.email) } });
    if (!user) throw new DomainError(ErrorCode.ACCOUNT_NOT_FOUND, 'Account not found', 404);
    await this.otp.consumeVerificationToken(dto.verificationToken, 'RESET_PASSWORD', dto.email);
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash: await argon2.hash(dto.newPassword) } });
    await this.prisma.refreshSession.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
    return { reset: true };
  }

  private async issueTokens(userId: string, username: string, user: unknown): Promise<AuthTokens> {
    const sid = randomUUID();
    const accessToken = await this.jwt.signAsync({ sub: userId, username, type: 'access' }, { expiresIn: ACCESS_TTL_SECONDS });
    const refreshToken = await this.jwt.signAsync({ sub: userId, username, sid, type: 'refresh' }, { secret: this.config.getOrThrow('jwtRefreshSecret'), expiresIn: REFRESH_TTL_SECONDS });
    await this.prisma.refreshSession.create({ data: { id: sid, userId, tokenHash: await argon2.hash(refreshToken), expiresAt: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000) } });
    const source = user as { id: string; username: string; email?: string; phone?: string; status?: string; profile?: unknown };
    return {
      accessToken,
      refreshToken,
      user: {
        id: source.id,
        username: source.username,
        ...(source.email !== undefined ? { email: source.email } : {}),
        ...(source.phone !== undefined ? { phone: source.phone } : {}),
        ...(source.status !== undefined ? { status: source.status } : {}),
        ...(source.profile !== undefined ? { profile: source.profile } : {}),
      },
    };
  }
}
