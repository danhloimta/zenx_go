import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';
import {
  OtpChannel,
  OtpPurpose,
  SecurityQuestionCode,
  SensitiveChallengeMethod,
} from '../common/domain';
import { DomainError, ErrorCode } from '../common/errors';
import { normalizeEmail, normalizePhone } from '../common/normalize';
import { OtpService } from '../otp/otp.service';
import { PrismaService } from '../database/prisma.service';
import {
  SensitiveIdentityDto,
  SensitiveProfileChallengeDto,
  SensitiveProfileOtpVerifyDto,
  SensitiveProfileUpdateDto,
} from './dto';

const CIPHER_ALGORITHM = 'aes-256-gcm';
const CIPHER_IV_BYTES = 12;
const CIPHER_AAD = Buffer.from('zenx-sensitive-profile-v1', 'utf8');
const SENSITIVE_TOKEN_TTL_SECONDS = 5 * 60;
const MAX_CHALLENGE_ATTEMPTS = 5;
const CHALLENGE_LOCK_MS = 15 * 60 * 1000;

export type CitizenIdentity = { citizenId: string; issuedAt: string; issuedPlace: string };

export type EncryptedCitizenIdentity = {
  ciphertext: string;
  iv: string;
  authTag: string;
  lookupHash: string;
  last4: string;
};

/** Encryption and normalization are isolated so they can be tested without a database. */
@Injectable()
export class SensitiveProfileCrypto {
  private readonly encryptionKey: Buffer;
  private readonly lookupKey: Buffer;

  constructor(config: ConfigService) {
    const encodedKey = config.getOrThrow<string>('sensitiveProfileEncryptionKey');
    this.encryptionKey = Buffer.from(encodedKey, 'base64');
    if (this.encryptionKey.length !== 32) {
      throw new Error('SENSITIVE_PROFILE_ENCRYPTION_KEY must decode to exactly 32 bytes');
    }
    this.lookupKey = createHmac('sha256', this.encryptionKey)
      .update('citizen-id-lookup-v1')
      .digest();
  }

  encrypt(identity: CitizenIdentity): EncryptedCitizenIdentity {
    const iv = randomBytes(CIPHER_IV_BYTES);
    const cipher = createCipheriv(CIPHER_ALGORITHM, this.encryptionKey, iv);
    cipher.setAAD(CIPHER_AAD);
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(identity), 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      lookupHash: this.lookupHash(identity.citizenId),
      last4: identity.citizenId.slice(-4),
    };
  }

  decrypt(input: {
    ciphertext?: string | null;
    iv?: string | null;
    authTag?: string | null;
  }): CitizenIdentity {
    if (!input.ciphertext || !input.iv || !input.authTag) {
      throw new Error('Encrypted citizen identity is incomplete');
    }
    const decipher = createDecipheriv(
      CIPHER_ALGORITHM,
      this.encryptionKey,
      Buffer.from(input.iv, 'base64'),
    );
    decipher.setAAD(CIPHER_AAD);
    decipher.setAuthTag(Buffer.from(input.authTag, 'base64'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(input.ciphertext, 'base64')),
      decipher.final(),
    ]).toString('utf8');
    return JSON.parse(plaintext) as CitizenIdentity;
  }

  lookupHash(citizenId: string) {
    return createHmac('sha256', this.lookupKey).update(citizenId, 'utf8').digest('hex');
  }
}

export function normalizeSecurityAnswer(value: string) {
  return value.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('vi-VN');
}

export function validateCitizenIdentity(identity: SensitiveIdentityDto) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(identity.issuedAt);
  const issuedAt = match
    ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
    : new Date(Number.NaN);
  const validCalendarDate = Boolean(
    match &&
    issuedAt.getUTCFullYear() === Number(match[1]) &&
    issuedAt.getUTCMonth() === Number(match[2]) - 1 &&
    issuedAt.getUTCDate() === Number(match[3]),
  );
  if (!validCalendarDate || issuedAt > new Date()) {
    throw new DomainError(
      ErrorCode.INVALID_SENSITIVE_PROFILE,
      'Citizen ID issue date is invalid',
      400,
    );
  }
  if (!identity.issuedPlace.trim()) {
    throw new DomainError(
      ErrorCode.INVALID_SENSITIVE_PROFILE,
      'Citizen ID issue place is required',
      400,
    );
  }
}

@Injectable()

export class SensitiveProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otp: OtpService,
    private readonly jwt: JwtService,
    private readonly crypto: SensitiveProfileCrypto,
  ) {}

  async summary(userId: string) {
    const profile = await this.prisma.sensitiveProfile.findUnique({ where: { userId } });
    return this.toSummary(profile);
  }

  async questions() {
    const questions = await this.prisma.securityQuestion.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { code: true, label: true },
    });
    return questions.map((question) => ({
      code: question.code as SecurityQuestionCode,
      label: question.label,
    }));
  }

  async sendOtp(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, phoneVerifiedAt: true, email: true, emailVerifiedAt: true },
    });
    if (!user) throw new DomainError(ErrorCode.ACCOUNT_NOT_FOUND, 'Account not found', 404);

    const channel =
      user.phone && user.phoneVerifiedAt
        ? OtpChannel.SMS
        : user.email && user.emailVerifiedAt
          ? OtpChannel.EMAIL
          : null;
    const destination =
      channel === OtpChannel.SMS ? user.phone : channel === OtpChannel.EMAIL ? user.email : null;
    if (!channel || !destination) {
      throw new DomainError(
        ErrorCode.SENSITIVE_PROFILE_OTP_UNAVAILABLE,
        'Verify a phone number or email before managing sensitive profile data',
        400,
      );
    }

    const result = await this.otp.send({
      channel,
      purpose: OtpPurpose.MANAGE_SENSITIVE_PROFILE,
      destination,
      userId,
    });
    return {
      channel,
      destination: channel === OtpChannel.SMS ? maskPhone(destination) : maskEmail(destination),
      expiresIn: result.expiresIn,
      resendAfter: result.resendAfter,
    };
  }

  async verifyOtp(userId: string, dto: SensitiveProfileOtpVerifyDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, phoneVerifiedAt: true, email: true, emailVerifiedAt: true },
    });
    if (!user) throw new DomainError(ErrorCode.ACCOUNT_NOT_FOUND, 'Account not found', 404);
    const destination =
      dto.channel === OtpChannel.SMS
        ? user.phoneVerifiedAt
          ? user.phone
          : null
        : user.emailVerifiedAt
          ? user.email
          : null;
    if (!destination)
      throw new DomainError(
        ErrorCode.SENSITIVE_PROFILE_OTP_UNAVAILABLE,
        'The selected contact method is not verified',
        400,
      );

    const verification = await this.otp.verify({
      channel: dto.channel,
      purpose: OtpPurpose.MANAGE_SENSITIVE_PROFILE,
      destination,
      code: dto.code,
      userId,
    });
    await this.otp.consumeVerificationToken(
      verification.verificationToken,
      OtpPurpose.MANAGE_SENSITIVE_PROFILE,
      destination,
      userId,
      dto.channel,
    );
    return this.issueAccessToken(userId);
  }

  async challenge(userId: string, dto: SensitiveProfileChallengeDto) {
    const profile = await this.prisma.sensitiveProfile.findUnique({ where: { userId } });
    if (
      !profile ||
      !profile.secretCodeHash ||
      !profile.securityAnswerHash ||
      !profile.securityQuestionCode
    ) {
      throw new DomainError(
        ErrorCode.INVALID_SENSITIVE_CHALLENGE,
        'Sensitive profile challenge is invalid',
        400,
      );
    }
    if (profile.challengeLockedUntil && profile.challengeLockedUntil > new Date()) {
      throw new DomainError(
        ErrorCode.SENSITIVE_CHALLENGE_LOCKED,
        'Sensitive profile verification is temporarily locked',
        429,
      );
    }

    const candidate =
      dto.method === SensitiveChallengeMethod.SECRET_CODE
        ? dto.value
        : normalizeSecurityAnswer(dto.value);
    const hash =
      dto.method === SensitiveChallengeMethod.SECRET_CODE
        ? profile.secretCodeHash
        : profile.securityAnswerHash;
    const valid = await argon2.verify(hash, candidate).catch(() => false);
    if (!valid) {
      const nextAttempts = profile.failedChallengeCount + 1;
      const lockedUntil =
        nextAttempts >= MAX_CHALLENGE_ATTEMPTS ? new Date(Date.now() + CHALLENGE_LOCK_MS) : null;
      await this.prisma.sensitiveProfile.update({
        where: { id: profile.id },
        data: { failedChallengeCount: nextAttempts, challengeLockedUntil: lockedUntil },
      });
      if (lockedUntil)
        throw new DomainError(
          ErrorCode.SENSITIVE_CHALLENGE_LOCKED,
          'Sensitive profile verification is temporarily locked',
          429,
        );
      throw new DomainError(
        ErrorCode.INVALID_SENSITIVE_CHALLENGE,
        'Sensitive profile challenge is invalid',
        400,
      );
    }

    await this.prisma.sensitiveProfile.update({
      where: { id: profile.id },
      data: { failedChallengeCount: 0, challengeLockedUntil: null },
    });
    return this.issueAccessToken(userId, profile.securityVersion);
  }

  async reveal(userId: string, accessToken: string) {
    const profile = await this.authorizeToken(userId, accessToken);
    return {
      identity:
        profile && profile.citizenIdCiphertext
          ? this.crypto.decrypt({
              ciphertext: profile.citizenIdCiphertext,
              iv: profile.citizenIdIv,
              authTag: profile.citizenIdAuthTag,
            })
          : null,
    };
  }

  async update(userId: string, dto: SensitiveProfileUpdateDto) {
    const current = await this.authorizeToken(userId, dto.accessToken);
    const currentIdentity = current?.citizenIdCiphertext
      ? this.crypto.decrypt({
          ciphertext: current.citizenIdCiphertext,
          iv: current.citizenIdIv,
          authTag: current.citizenIdAuthTag,
        })
      : null;
    const nextIdentity = dto.identity === undefined ? currentIdentity : dto.identity;
    const currentSecurity =
      current &&
      current.secretCodeHash &&
      current.securityAnswerHash &&
      current.securityQuestionCode
        ? {
            secretCodeHash: current.secretCodeHash,
            securityAnswerHash: current.securityAnswerHash,
            securityQuestionCode: current.securityQuestionCode,
          }
        : null;

    let nextSecurity = currentSecurity;
    if (dto.security === null) {
      nextSecurity = null;
    } else if (dto.security !== undefined) {
      if (dto.security.secretCode !== dto.security.secretCodeConfirmation) {
        throw new DomainError(
          ErrorCode.INVALID_SENSITIVE_PROFILE,
          'Secret code confirmation does not match',
          400,
        );
      }
      const question = await this.prisma.securityQuestion.findFirst({
        where: { code: dto.security.questionCode, isActive: true },
        select: { code: true },
      });
      if (!question) {
        throw new DomainError(
          ErrorCode.INVALID_SENSITIVE_PROFILE,
          'Security question is unavailable',
          400,
        );
      }
      nextSecurity = {
        secretCodeHash: await argon2.hash(dto.security.secretCode),
        securityAnswerHash: await argon2.hash(normalizeSecurityAnswer(dto.security.answer)),
        securityQuestionCode: dto.security.questionCode,
      };
    }

    if (nextIdentity && !nextSecurity) {
      throw new DomainError(
        ErrorCode.SENSITIVE_SECURITY_REQUIRED,
        'Set the secret code and security question before saving citizen ID',
        400,
      );
    }

    if (!nextIdentity && !nextSecurity) {
      if (current) await this.prisma.sensitiveProfile.delete({ where: { id: current.id } });
      return this.toSummary(null);
    }

    let encryptedIdentity: EncryptedCitizenIdentity | null | undefined;
    if (dto.identity === null) encryptedIdentity = null;
    else if (dto.identity !== undefined) {
      this.validateIdentity(dto.identity);
      encryptedIdentity = this.crypto.encrypt(dto.identity);
      const duplicate = await this.prisma.sensitiveProfile.findFirst({
        where: {
          citizenIdLookupHash: encryptedIdentity.lookupHash,
          ...(current ? { NOT: { userId } } : {}),
        },
        select: { userId: true },
      });
      if (duplicate)
        throw new DomainError(
          ErrorCode.CITIZEN_ID_ALREADY_EXISTS,
          'This citizen ID cannot be used',
          409,
        );
    }

    try {
      const profileData = {
        ...(encryptedIdentity !== undefined
          ? {
              citizenIdCiphertext: encryptedIdentity?.ciphertext ?? null,
              citizenIdIv: encryptedIdentity?.iv ?? null,
              citizenIdAuthTag: encryptedIdentity?.authTag ?? null,
              citizenIdLookupHash: encryptedIdentity?.lookupHash ?? null,
              citizenIdLast4: encryptedIdentity?.last4 ?? null,
            }
          : {}),
        ...(dto.security !== undefined
          ? {
              secretCodeHash: nextSecurity?.secretCodeHash ?? null,
              securityAnswerHash: nextSecurity?.securityAnswerHash ?? null,
              securityQuestionCode: nextSecurity?.securityQuestionCode ?? null,
            }
          : {}),
        failedChallengeCount: 0,
        challengeLockedUntil: null,
      };
      const profile = current
        ? await this.prisma.sensitiveProfile.update({
            where: { id: current.id },
            data: { ...profileData, securityVersion: { increment: 1 } },
          })
        : await this.prisma.sensitiveProfile.create({
            data: { userId, ...profileData, securityVersion: 1 },
          });
      return this.toSummary(profile);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new DomainError(
          ErrorCode.CITIZEN_ID_ALREADY_EXISTS,
          'This citizen ID cannot be used',
          409,
        );
      }
      throw error;
    }
  }

  private validateIdentity(identity: SensitiveIdentityDto) {
    validateCitizenIdentity(identity);
  }


  private toSummary(
    profile: {
      citizenIdCiphertext?: string | null;
      citizenIdLast4?: string | null;
      secretCodeHash?: string | null;
      securityAnswerHash?: string | null;
      securityQuestionCode?: string | null;
    } | null,
  ) {
    return {
      identity: {
        configured: Boolean(profile?.citizenIdCiphertext),
        last4: profile?.citizenIdCiphertext ? (profile.citizenIdLast4 ?? null) : null,
      },
      security: {
        configured: Boolean(
          profile?.secretCodeHash && profile.securityAnswerHash && profile.securityQuestionCode,
        ),
        questionCode: profile?.securityQuestionCode ?? null,
      },
    };
  }

  private async issueAccessToken(userId: string, version?: number) {
    const current =
      version ??
      (
        await this.prisma.sensitiveProfile.findUnique({
          where: { userId },
          select: { securityVersion: true },
        })
      )?.securityVersion ??
      0;
    const accessToken = await this.jwt.signAsync(
      { sub: userId, type: 'sensitive-profile', version: current },
      { expiresIn: SENSITIVE_TOKEN_TTL_SECONDS },
    );
    return { accessToken, expiresIn: SENSITIVE_TOKEN_TTL_SECONDS };
  }

  private async authorizeToken(userId: string, accessToken: string) {
    let payload: { sub?: string; type?: string; version?: number };
    try {
      payload = await this.jwt.verifyAsync(accessToken);
    } catch {
      throw new DomainError(
        ErrorCode.SENSITIVE_ACCESS_TOKEN_INVALID,
        'Sensitive profile access token is invalid or expired',
        401,
      );
    }
    if (
      payload.sub !== userId ||
      payload.type !== 'sensitive-profile' ||
      typeof payload.version !== 'number'
    ) {
      throw new DomainError(
        ErrorCode.SENSITIVE_ACCESS_TOKEN_INVALID,
        'Sensitive profile access token is invalid or expired',
        401,
      );
    }
    const profile = await this.prisma.sensitiveProfile.findUnique({ where: { userId } });
    if ((profile?.securityVersion ?? 0) !== payload.version) {
      throw new DomainError(
        ErrorCode.SENSITIVE_ACCESS_TOKEN_INVALID,
        'Sensitive profile access token is invalid or expired',
        401,
      );
    }
    return profile;
  }
}

function maskPhone(value: string) {
  const normalized = normalizePhone(value);
  return `${normalized.slice(0, 3)}******${normalized.slice(-4)}`;
}

function maskEmail(value: string) {
  const normalized = normalizeEmail(value);
  const [local, domain] = normalized.split('@');
  if (!local || !domain) return '***';
  return `${local.slice(0, 1)}***@${domain}`;
}
