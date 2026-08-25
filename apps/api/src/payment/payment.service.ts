import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PaymentMethod, PaymentStatus, WalletTransactionType } from '../common/domain';
import { createHash, randomInt } from 'node:crypto';
import { DomainError, ErrorCode } from '../common/errors';
import { PrismaService } from '../database/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CreatePaymentDto } from './dto';
import { MockPaymentProvider, PaymentProvider } from './payment.provider';

@Injectable()
export class PaymentService {
  private readonly provider: PaymentProvider;
  constructor(private readonly prisma: PrismaService, private readonly wallet: WalletService, config: ConfigService, mock: MockPaymentProvider) {
    const providerName = config.get<string>('paymentProvider') ?? 'mock';
    if (providerName !== 'mock') {
      throw new Error(`Unsupported payment provider: ${providerName}`);
    }
    this.provider = mock;
  }

  async listPackages() { return this.prisma.coinPackage.findMany({ where: { status: 'ACTIVE' }, orderBy: { sortOrder: 'asc' } }); }

  async create(userId: string, dto: CreatePaymentDto) {
    const paymentMethod = this.normalizePaymentMethod(dto.paymentMethod);
    const coinPackage = await this.prisma.coinPackage.findFirst({ where: { id: dto.coinPackageId, status: 'ACTIVE' } });
    if (!coinPackage) throw new DomainError(ErrorCode.PAYMENT_NOT_FOUND, 'Coin package not found', 404);
    const idempotencyKey = dto.idempotencyKey?.trim() || undefined;
    if (idempotencyKey) {
      const existing = await this.prisma.payment.findFirst({ where: { userId, idempotencyKey } });
      if (existing) return this.toPublicPayment(existing);
    }
    const paymentNo = `ZPAY-${Date.now()}-${randomInt(1000, 10000)}`;
    let created;
    try {
      created = await this.prisma.payment.create({ data: { paymentNo, userId, coinPackageId: coinPackage.id, amountVnd: coinPackage.priceVnd, coinAmount: coinPackage.coinAmount, provider: 'mock', paymentMethod, idempotencyKey, status: PaymentStatus.CREATED, expiredAt: new Date(Date.now() + 30 * 60 * 1000) } });
    } catch (error) {
      if (idempotencyKey && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await this.prisma.payment.findFirst({ where: { userId, idempotencyKey } });
        if (existing) return this.toPublicPayment(existing);
      }
      throw error;
    }

    let providerPayment;
    try {
      providerPayment = await this.provider.createPayment({ paymentNo, amountVnd: coinPackage.priceVnd, coinAmount: coinPackage.coinAmount, paymentMethod });
      const payment = await this.prisma.payment.update({ where: { id: created.id }, data: {
        providerTransactionId: providerPayment.providerTransactionId,
        providerPayload: JSON.stringify({ qrPayload: providerPayment.qrPayload, displayMetadata: providerPayment.displayMetadata }),
        status: PaymentStatus.PENDING,
      } });
      return this.toPublicPayment(payment, providerPayment.paymentUrl, providerPayment.qrPayload, providerPayment.displayMetadata);
    } catch {
      await this.prisma.payment.updateMany({ where: { id: created.id, status: PaymentStatus.CREATED }, data: { status: PaymentStatus.FAILED } });
      throw new DomainError(ErrorCode.PAYMENT_FAILED, 'The payment provider could not create this payment', 502);
    }
  }

  async get(userId: string, paymentNo: string) {
    await this.expirePaymentIfNeeded(userId, paymentNo);
    const payment = await this.prisma.payment.findFirstOrThrow({ where: { userId, paymentNo } });
    return this.toPublicPayment(payment);
  }

  async list(userId: string) {
    await this.prisma.payment.updateMany({
      where: { userId, status: { in: [PaymentStatus.CREATED, PaymentStatus.PENDING] }, expiredAt: { lte: new Date() } },
      data: { status: PaymentStatus.EXPIRED },
    });
    const payments = await this.prisma.payment.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 100 });
    return payments.map((payment) => this.toPublicPayment(payment));
  }

  async mockComplete(userId: string, paymentNo: string) {
    const payment = await this.prisma.payment.findFirstOrThrow({ where: { userId, paymentNo } });
    if (!payment.providerTransactionId) throw new DomainError(ErrorCode.PAYMENT_FAILED, 'Payment provider transaction is not ready', 409);
    const payload = { providerTransactionId: payment.providerTransactionId, paymentNo: payment.paymentNo, status: 'SUCCESS' };
    const rawBody = JSON.stringify(payload);
    return this.callback(rawBody, createHash('sha256').update(rawBody).digest('hex'), payload);
  }

  private normalizePaymentMethod(value: string): PaymentMethod {
    if (value === 'QR') return PaymentMethod.VIETQR;
    if (value === 'REDIRECT') return PaymentMethod.CARD;
    if (Object.values(PaymentMethod).includes(value as PaymentMethod)) return value as PaymentMethod;
    throw new DomainError(ErrorCode.INVALID_PAYMENT_METHOD, 'Unsupported payment method', 400);
  }

  private toPublicPayment(payment: {
    providerPayload: string | null;
    paymentNo: string;
    [key: string]: unknown;
  }, paymentUrl?: string, qrPayload?: string, displayMetadata?: Record<string, unknown>) {
    let payload: { qrPayload?: string; displayMetadata?: Record<string, unknown> } = {};
    if (payment.providerPayload) {
      try { payload = JSON.parse(payment.providerPayload) as typeof payload; } catch { payload = {}; }
    }
    const { id: _id, userId: _userId, coinPackageId: _coinPackageId, updatedAt: _updatedAt, idempotencyKey: _idempotencyKey, providerPayload, ...safePayment } = payment;
    void _id;
    void _userId;
    void _coinPackageId;
    void _updatedAt;
    void _idempotencyKey;
    void providerPayload;
    const isMockProvider = safePayment.provider === 'mock';
    return {
      ...safePayment,
      // A mock provider has no external checkout page. Returning its internal
      // placeholder URL made the UI navigate to a guaranteed 404 route.
      paymentUrl: isMockProvider ? null : paymentUrl ?? null,
      qrPayload: qrPayload ?? payload.qrPayload ?? null,
      displayMetadata: displayMetadata ?? payload.displayMetadata ?? this.provider.getDisplayMetadata(this.normalizePaymentMethod(String(safePayment.paymentMethod))),
    };
  }

  async callback(rawBody: string, signature: string, payload: Record<string, unknown>) {
    let verified;
    try { verified = await this.provider.verifyCallback({ rawBody, signature, payload }); }
    catch { throw new DomainError(ErrorCode.INVALID_PAYMENT_CALLBACK, 'Invalid payment callback', 400); }
    const payment = await this.withTransactionRetry(() => this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { paymentNo: verified.paymentNo } });
      if (!payment) throw new DomainError(ErrorCode.PAYMENT_NOT_FOUND, 'Payment not found', 404);
      if (payment.providerTransactionId && payment.providerTransactionId !== verified.providerTransactionId) {
        throw new DomainError(ErrorCode.INVALID_PAYMENT_CALLBACK, 'Payment provider transaction does not match', 400);
      }
      if (payment.status === PaymentStatus.SUCCESS || payment.status === PaymentStatus.FAILED || payment.status === PaymentStatus.EXPIRED) return payment;
      if (payment.expiredAt && payment.expiredAt <= new Date()) {
        await tx.payment.updateMany({
          where: { id: payment.id, status: { in: [PaymentStatus.CREATED, PaymentStatus.PENDING] } },
          data: { status: PaymentStatus.EXPIRED },
        });
        return tx.payment.findUniqueOrThrow({ where: { id: payment.id } });
      }
      const status = verified.status === 'SUCCESS' ? PaymentStatus.SUCCESS : verified.status === 'FAILED' ? PaymentStatus.FAILED : PaymentStatus.EXPIRED;
      const claimed = await tx.payment.updateMany({
        where: {
          id: payment.id,
          status: { in: [PaymentStatus.CREATED, PaymentStatus.PENDING] },
          ...(payment.providerTransactionId ? { providerTransactionId: verified.providerTransactionId } : {}),
        },
        data: { status, paidAt: status === PaymentStatus.SUCCESS ? new Date() : undefined },
      });
      if (claimed.count !== 1) return tx.payment.findUniqueOrThrow({ where: { id: payment.id } });
      if (status === PaymentStatus.SUCCESS) {
        const transaction = await this.wallet.creditInTransaction(tx, payment.userId, { amount: payment.coinAmount, type: WalletTransactionType.TOPUP, referenceType: 'PAYMENT', referenceId: payment.id, idempotencyKey: `payment:${payment.id}`, description: `Top up ${payment.paymentNo}` });
        await tx.walletTransaction.update({ where: { id: transaction.id }, data: { paymentId: payment.id } });
      }
      return tx.payment.findUniqueOrThrow({ where: { id: payment.id } });
    }));
    return this.toPublicPayment(payment);
  }

  private async withTransactionRetry<T>(operation: () => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (code !== 'P2034' || attempt === 2) throw error;
        await new Promise((resolve) => setTimeout(resolve, 25 * (attempt + 1)));
      }
    }
    throw new Error('Transaction retry exhausted');
  }

  private async expirePaymentIfNeeded(userId: string, paymentNo: string) {
    await this.prisma.payment.updateMany({
      where: { userId, paymentNo, status: { in: [PaymentStatus.CREATED, PaymentStatus.PENDING] }, expiredAt: { lte: new Date() } },
      data: { status: PaymentStatus.EXPIRED },
    });
  }
}
