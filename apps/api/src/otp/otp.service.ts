import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OtpChannel, OtpPurpose, OtpStatus } from '../common/domain';
import * as argon2 from 'argon2';
import { randomBytes, randomInt } from 'node:crypto';
import { OTP_MAX_ATTEMPTS, OTP_RESEND_SECONDS, OTP_TTL_SECONDS } from '../common/constants';
import { DomainError, ErrorCode } from '../common/errors';
import { normalizeEmail, normalizePhone } from '../common/normalize';
import { PrismaService } from '../database/prisma.service';

export type OtpProvider = { send(input: { destination: string; code: string; purpose: OtpPurpose; requestId: string }): Promise<{ providerMessageId?: string }> };
export interface MailProvider {
  sendOtp(input: { destination: string; code: string; purpose: OtpPurpose; requestId: string }): Promise<void>;
  sendPasswordReset(input: { destination: string; code: string; requestId: string }): Promise<void>;
}

@Injectable()
export class MockOtpProvider implements OtpProvider {
  async send(input: { destination: string; code: string; purpose: OtpPurpose; requestId: string }) {
    if (process.env.NODE_ENV !== 'test') console.info(`[mock-otp] ${input.purpose} ${input.destination}: ${input.code}`);
    return { providerMessageId: `mock-${input.requestId}` };
  }
}

@Injectable()
export class MockMailProvider implements MailProvider {
  async sendOtp(input: { destination: string; code: string; purpose: OtpPurpose; requestId: string }) {
    if (process.env.NODE_ENV !== 'test') console.info(`[mock-mail] ${input.purpose} ${input.destination}: ${input.code}`);
  }
  async sendPasswordReset(input: { destination: string; code: string; requestId: string }) {
    if (process.env.NODE_ENV !== 'test') console.info(`[mock-mail] RESET_PASSWORD ${input.destination}: ${input.code}`);
  }
}

/** Vendor seam for a future Nodemailer/SMTP implementation. */
@Injectable()
export class SmtpMailProvider implements MailProvider {
  async sendOtp(_input: { destination: string; code: string; purpose: OtpPurpose; requestId: string }) {
    throw new Error('SMTP provider is not configured in the MVP skeleton');
  }
  async sendPasswordReset(_input: { destination: string; code: string; requestId: string }) {
    throw new Error('SMTP provider is not configured in the MVP skeleton');
  }
}

@Injectable()
export class OtpService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService, private readonly provider: MockOtpProvider, private readonly mail: MockMailProvider) {}

  async send(input: { channel: OtpChannel; purpose: OtpPurpose | string; destination: string; userId?: string }) {
    const purpose = input.purpose as OtpPurpose;
    const destinationNormalized = input.channel === OtpChannel.EMAIL ? normalizeEmail(input.destination) : normalizePhone(input.destination);
    const latest = await this.prisma.otpRequest.findFirst({ where: { destinationNormalized, purpose, createdAt: { gte: new Date(Date.now() - OTP_RESEND_SECONDS * 1000) }, status: OtpStatus.PENDING }, orderBy: { createdAt: 'desc' } });
    if (latest) throw new DomainError(ErrorCode.OTP_RATE_LIMITED, 'Please wait before requesting another code', 429);
    await this.prisma.otpRequest.updateMany({ where: { destinationNormalized, purpose, status: OtpStatus.PENDING }, data: { status: OtpStatus.EXPIRED } });
    const fixedCode = this.config.get<string>('otpMockFixedCode');
    const code = process.env.NODE_ENV === 'test' && fixedCode ? fixedCode : randomInt(100000, 1000000).toString();
    const request = await this.prisma.otpRequest.create({ data: { userId: input.userId, channel: input.channel, purpose, destination: input.destination, destinationNormalized, codeHash: await argon2.hash(code), expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000), resendAfter: new Date(Date.now() + OTP_RESEND_SECONDS * 1000) } });
    if (input.channel === OtpChannel.EMAIL && purpose === OtpPurpose.RESET_PASSWORD) await this.mail.sendPasswordReset({ destination: input.destination, code, requestId: request.id });
    else if (input.channel === OtpChannel.EMAIL) await this.mail.sendOtp({ destination: input.destination, code, purpose, requestId: request.id });
    else await this.provider.send({ destination: input.destination, code, purpose, requestId: request.id });
    return { expiresIn: OTP_TTL_SECONDS, resendAfter: OTP_RESEND_SECONDS, requestId: request.id };
  }

  async verify(input: { channel: OtpChannel; purpose: OtpPurpose | string; destination: string; code: string }) {
    const purpose = input.purpose as OtpPurpose;
    const destinationNormalized = input.channel === OtpChannel.EMAIL ? normalizeEmail(input.destination) : normalizePhone(input.destination);
    const request = await this.prisma.otpRequest.findFirst({ where: { destinationNormalized, purpose, status: OtpStatus.PENDING }, orderBy: { createdAt: 'desc' } });
    if (!request || request.expiresAt <= new Date()) throw new DomainError(ErrorCode.OTP_EXPIRED, 'OTP has expired', 400);
    if (request.attemptCount >= OTP_MAX_ATTEMPTS) throw new DomainError(ErrorCode.OTP_RATE_LIMITED, 'Too many attempts', 429);
    if (!(await argon2.verify(request.codeHash, input.code))) {
      await this.prisma.otpRequest.update({ where: { id: request.id }, data: { attemptCount: { increment: 1 }, status: request.attemptCount + 1 >= OTP_MAX_ATTEMPTS ? OtpStatus.LOCKED : OtpStatus.PENDING } });
      throw new DomainError(ErrorCode.OTP_INVALID, 'OTP is invalid', 400);
    }
    await this.prisma.otpRequest.update({ where: { id: request.id }, data: { status: OtpStatus.USED, usedAt: new Date() } });
    const rawToken = randomBytes(32).toString('hex');
    await this.prisma.otpVerification.create({ data: { otpRequestId: request.id, tokenHash: await argon2.hash(rawToken), purpose, expiresAt: new Date(Date.now() + 10 * 60 * 1000) } });
    return { verificationToken: rawToken, expiresIn: 600 };
  }

  async consumeVerificationToken(token: string, purpose: OtpPurpose | string, destination?: string) {
    const candidates = await this.prisma.otpVerification.findMany({ where: { purpose: purpose as OtpPurpose, consumedAt: null, expiresAt: { gt: new Date() } }, include: { otpRequest: { select: { destinationNormalized: true } } }, orderBy: { createdAt: 'desc' }, take: 20 });
    for (const candidate of candidates) {
      if (destination && candidate.otpRequest.destinationNormalized !== (purpose === 'RESET_PASSWORD' || purpose === 'CHANGE_EMAIL' ? normalizeEmail(destination) : normalizePhone(destination))) continue;
      if (await argon2.verify(candidate.tokenHash, token)) {
        const consumed = await this.prisma.otpVerification.updateMany({ where: { id: candidate.id, consumedAt: null }, data: { consumedAt: new Date() } });
        if (consumed.count === 1) return candidate;
      }
    }
    throw new DomainError(ErrorCode.VERIFICATION_TOKEN_INVALID, 'Verification token is invalid or expired', 400);
  }
}
