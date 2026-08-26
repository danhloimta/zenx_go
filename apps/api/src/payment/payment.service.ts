import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { createHash, randomBytes, randomInt } from 'node:crypto';
import { PaymentMethod, PaymentStatus, WalletTransactionType } from '../common/domain';
import { DomainError, ErrorCode } from '../common/errors';
import { PrismaService } from '../database/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CreatePaymentDto } from './dto';
import {
  MockPaymentProvider,
  PaymentProvider,
  SepayPaymentProvider,
  SepayWebhookPayload,
  VerifiedPaymentCallback,
} from './payment.provider';
import { PAYMENT_PROVIDER } from './payment.tokens';

type StoredProviderPayload = {
  qrPayload?: string;
  qrImageUrl?: string | null;
  displayMetadata?: Record<string, unknown>;
  webhook?: Record<string, unknown>;
};

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly providerName: string;
  private readonly transferPrefix: string;
  private readonly nodeEnv: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
    private readonly mock: MockPaymentProvider,
    private readonly sepay: SepayPaymentProvider,
    config: ConfigService,
  ) {
    this.providerName = provider.name;
    this.transferPrefix = config.get<string>('sepay.transferPrefix') ?? 'ZENX';
    this.nodeEnv = config.get<string>('nodeEnv') ?? process.env.NODE_ENV ?? 'development';
  }

  async listPackages() {
    return this.prisma.coinPackage.findMany({ where: { status: 'ACTIVE' }, orderBy: { sortOrder: 'asc' } });
  }

  getConfig() {
    return {
      provider: this.providerName,
      methods: this.providerName === 'sepay' ? [PaymentMethod.VIETQR] : Object.values(PaymentMethod),
      isDemo: this.providerName === 'mock',
      allowMockCompletion: this.providerName === 'mock' && this.nodeEnv !== 'production',
    };
  }

  async create(userId: string, dto: CreatePaymentDto) {
    const paymentMethod = this.normalizePaymentMethod(dto.paymentMethod);
    if (this.providerName === 'sepay' && paymentMethod !== PaymentMethod.VIETQR) {
      throw new DomainError(ErrorCode.INVALID_PAYMENT_METHOD, 'SePay supports VietQR payments only', 400);
    }
    const coinPackage = await this.prisma.coinPackage.findFirst({ where: { id: dto.coinPackageId, status: 'ACTIVE' } });
    if (!coinPackage) throw new DomainError(ErrorCode.PAYMENT_NOT_FOUND, 'Coin package not found', 404);
    const idempotencyKey = dto.idempotencyKey?.trim() || undefined;
    const created = await this.findOrCreatePayment(userId, coinPackage, paymentMethod, idempotencyKey);
    if (created.status !== PaymentStatus.CREATED) return this.toPublicPayment(created);

    try {
      const createdMethod = this.normalizePaymentMethod(created.paymentMethod);
      const providerPayment = await this.provider.createPayment({ paymentNo: created.paymentNo, amountVnd: created.amountVnd, coinAmount: created.coinAmount, paymentMethod: createdMethod });
      const providerPayload: StoredProviderPayload = {
        qrPayload: providerPayment.qrPayload,
        qrImageUrl: providerPayment.qrImageUrl,
        displayMetadata: providerPayment.displayMetadata,
      };
      await this.prisma.payment.updateMany({
        where: { id: created.id, status: PaymentStatus.CREATED },
        data: {
          providerTransactionId: providerPayment.providerTransactionId,
          providerPayload: JSON.stringify(providerPayload),
          status: PaymentStatus.PENDING,
        },
      });
      const payment = await this.prisma.payment.findUniqueOrThrow({ where: { id: created.id } });
      return this.toPublicPayment(payment, providerPayment.paymentUrl, providerPayment.qrPayload, providerPayment.qrImageUrl, providerPayment.displayMetadata);
    } catch {
      const failed = await this.prisma.payment.updateMany({ where: { id: created.id, status: PaymentStatus.CREATED }, data: { status: PaymentStatus.FAILED } });
      if (failed.count === 0) return this.toPublicPayment(await this.prisma.payment.findUniqueOrThrow({ where: { id: created.id } }));
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
    if (this.providerName !== 'mock' || this.nodeEnv === 'production') {
      throw new DomainError(ErrorCode.INVALID_PAYMENT_METHOD, 'Mock payment completion is disabled', 400);
    }
    const payment = await this.prisma.payment.findFirstOrThrow({ where: { userId, paymentNo } });
    if (!payment.providerTransactionId) throw new DomainError(ErrorCode.PAYMENT_FAILED, 'Payment provider transaction is not ready', 409);
    const payload = { providerTransactionId: payment.providerTransactionId, paymentNo: payment.paymentNo, status: 'SUCCESS' };
    const rawBody = JSON.stringify(payload);
    return this.callback(rawBody, createHash('sha256').update(rawBody).digest('hex'), payload);
  }

  async callback(rawBody: string, signature: string, payload: Record<string, unknown>) {
    if (this.providerName !== 'mock') throw new DomainError(ErrorCode.INVALID_PAYMENT_CALLBACK, 'The configured payment provider does not accept mock callbacks', 400);
    let verified: VerifiedPaymentCallback;
    try {
      verified = await this.mock.verifyCallback({ rawBody, signature, payload });
    } catch {
      throw new DomainError(ErrorCode.INVALID_PAYMENT_CALLBACK, 'Invalid payment callback', 400);
    }
    const payment = await this.processVerifiedCallback(verified, false);
    return this.toPublicPayment(payment);
  }

  async handleSepayWebhook(payload: SepayWebhookPayload) {
    const paymentNo = typeof payload.code === 'string' ? payload.code.trim() : '';
    const payment = paymentNo ? await this.prisma.payment.findUnique({ where: { paymentNo } }) : null;
    const amount = this.integerAmount(payload.transferAmount);
    const expectedProviderTransactionId = String(payload.id);
    const warning = (reason: string, details: Record<string, unknown> = {}) => {
      this.logger.warn(JSON.stringify({ event: 'sepay_webhook_ignored', reason, providerTransactionId: expectedProviderTransactionId, paymentNo: paymentNo || undefined, ...details }));
    };

    if (!payment) {
      warning('UNKNOWN_PAYMENT');
      return;
    }
    if (payment.provider !== 'sepay') {
      warning('PAYMENT_PROVIDER_MISMATCH', { paymentProvider: payment.provider });
      return;
    }
    if (payload.transferType !== 'in') {
      warning('OUTGOING_TRANSACTION', { transferType: payload.transferType });
      return;
    }
    if (payload.accountNumber !== this.sepay.getDisplayMetadata(PaymentMethod.VIETQR).bankAccount) {
      warning('WRONG_ACCOUNT', { accountNumber: payload.accountNumber });
      return;
    }
    if (amount === null || amount !== payment.amountVnd) {
      warning('AMOUNT_MISMATCH', { transferAmount: payload.transferAmount, expectedAmount: payment.amountVnd.toString() });
      return;
    }
    if (payment.providerTransactionId && payment.providerTransactionId !== expectedProviderTransactionId) {
      warning('PROVIDER_TRANSACTION_CONFLICT', { existingProviderTransactionId: payment.providerTransactionId });
      return;
    }
    if (new Set<PaymentStatus>([PaymentStatus.SUCCESS, PaymentStatus.FAILED, PaymentStatus.CANCELLED, PaymentStatus.REFUNDED]).has(payment.status as PaymentStatus)) {
      warning(payment.status === PaymentStatus.SUCCESS ? 'PAYMENT_ALREADY_COMPLETED' : 'PAYMENT_TERMINAL', { paymentStatus: payment.status });
      return;
    }

    const paidAt = this.parseSepayDate(payload.transactionDate);
    const sanitizedPayload = this.sanitizeSepayPayload(payload);
    const verified: VerifiedPaymentCallback = { providerTransactionId: expectedProviderTransactionId, paymentNo, status: 'SUCCESS', paidAt };
    let updated;
    try {
      updated = await this.processVerifiedCallback(verified, true, sanitizedPayload);
    } catch (error) {
      if (error instanceof DomainError && error.code === ErrorCode.INVALID_PAYMENT_CALLBACK) {
        warning('PROVIDER_TRANSACTION_CONFLICT');
        return;
      }
      if (this.isPrismaCode(error, 'P2002')) {
        const owner = await this.prisma.payment.findFirst({ where: { providerTransactionId: expectedProviderTransactionId }, select: { paymentNo: true, status: true } });
        if (owner) {
          warning(owner.paymentNo === paymentNo ? 'PAYMENT_ALREADY_COMPLETED' : 'PROVIDER_TRANSACTION_CONFLICT', { ownerPaymentNo: owner.paymentNo, ownerStatus: owner.status });
          return;
        }
      }
      throw error;
    }
    this.logger.log(JSON.stringify({ event: 'sepay_payment_success', paymentNo: updated.paymentNo, providerTransactionId: expectedProviderTransactionId, amount: amount.toString() }));
  }

  private async processVerifiedCallback(verified: VerifiedPaymentCallback, allowExpired: boolean, webhookPayload?: Record<string, unknown>) {
    return this.withTransactionRetry(() => this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { paymentNo: verified.paymentNo } });
      if (!payment) throw new DomainError(ErrorCode.PAYMENT_NOT_FOUND, 'Payment not found', 404);
      if (payment.providerTransactionId && payment.providerTransactionId !== verified.providerTransactionId) {
        throw new DomainError(ErrorCode.INVALID_PAYMENT_CALLBACK, 'Payment provider transaction does not match', 400);
      }

      const terminalStatuses = allowExpired
        ? new Set<PaymentStatus>([PaymentStatus.SUCCESS, PaymentStatus.FAILED, PaymentStatus.CANCELLED, PaymentStatus.REFUNDED])
        : new Set<PaymentStatus>([PaymentStatus.SUCCESS, PaymentStatus.FAILED, PaymentStatus.EXPIRED, PaymentStatus.CANCELLED, PaymentStatus.REFUNDED]);
      if (terminalStatuses.has(payment.status as PaymentStatus)) return payment;
      if (!allowExpired && payment.expiredAt && payment.expiredAt <= new Date()) {
        await tx.payment.updateMany({ where: { id: payment.id, status: { in: [PaymentStatus.CREATED, PaymentStatus.PENDING] } }, data: { status: PaymentStatus.EXPIRED } });
        return tx.payment.findUniqueOrThrow({ where: { id: payment.id } });
      }

      const status = verified.status === 'SUCCESS' ? PaymentStatus.SUCCESS : verified.status === 'FAILED' ? PaymentStatus.FAILED : PaymentStatus.EXPIRED;
      const eligibleStatuses = allowExpired
        ? [PaymentStatus.CREATED, PaymentStatus.PENDING, PaymentStatus.EXPIRED]
        : [PaymentStatus.CREATED, PaymentStatus.PENDING];
      const claimed = await tx.payment.updateMany({
        where: {
          id: payment.id,
          status: { in: eligibleStatuses },
          ...(payment.providerTransactionId ? { providerTransactionId: verified.providerTransactionId } : { providerTransactionId: null }),
        },
        data: {
          status,
          providerTransactionId: verified.providerTransactionId,
          paidAt: status === PaymentStatus.SUCCESS ? verified.paidAt ?? new Date() : undefined,
          ...(webhookPayload ? { providerPayload: this.mergeProviderPayload(payment.providerPayload, webhookPayload) } : {}),
        },
      });
      if (claimed.count !== 1) return tx.payment.findUniqueOrThrow({ where: { id: payment.id } });
      if (status === PaymentStatus.SUCCESS) {
        const transaction = await this.wallet.creditInTransaction(tx, payment.userId, { amount: payment.coinAmount, type: WalletTransactionType.TOPUP, referenceType: 'PAYMENT', referenceId: payment.id, idempotencyKey: `payment:${payment.id}`, description: `Top up ${payment.paymentNo}` });
        await tx.walletTransaction.update({ where: { id: transaction.id }, data: { paymentId: payment.id } });
      }
      return tx.payment.findUniqueOrThrow({ where: { id: payment.id } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
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
  }, paymentUrl?: string | null, qrPayload?: string, qrImageUrl?: string | null, displayMetadata?: Record<string, unknown>) {
    let payload: StoredProviderPayload = {};
    if (payment.providerPayload) {
      try { payload = JSON.parse(payment.providerPayload) as StoredProviderPayload; } catch { payload = {}; }
    }
    const { id: _id, userId: _userId, coinPackageId: _coinPackageId, updatedAt: _updatedAt, idempotencyKey: _idempotencyKey, providerPayload, ...safePayment } = payment;
    void _id;
    void _userId;
    void _coinPackageId;
    void _updatedAt;
    void _idempotencyKey;
    void providerPayload;
    const isMockProvider = safePayment.provider === 'mock';
    const provider = safePayment.provider === 'sepay' ? this.sepay : this.mock;
    return {
      ...safePayment,
      paymentUrl: isMockProvider ? null : paymentUrl ?? null,
      qrPayload: qrPayload ?? payload.qrPayload ?? null,
      qrImageUrl: qrImageUrl ?? payload.qrImageUrl ?? null,
      displayMetadata: displayMetadata ?? payload.displayMetadata ?? provider.getDisplayMetadata(this.normalizePaymentMethod(String(safePayment.paymentMethod))),
    };
  }

  private async findOrCreatePayment(
    userId: string,
    coinPackage: { id: string; priceVnd: bigint; coinAmount: bigint },
    paymentMethod: PaymentMethod,
    idempotencyKey?: string,
  ) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.withTransactionRetry(() => this.prisma.$transaction(async (tx) => {
          if (idempotencyKey) {
            const existing = await tx.payment.findFirst({ where: { userId, idempotencyKey } });
            if (existing) return existing;
          }
          return tx.payment.create({
            data: {
              paymentNo: this.paymentNo(),
              userId,
              coinPackageId: coinPackage.id,
              amountVnd: coinPackage.priceVnd,
              coinAmount: coinPackage.coinAmount,
              provider: this.providerName,
              paymentMethod,
              idempotencyKey,
              status: PaymentStatus.CREATED,
              expiredAt: new Date(Date.now() + 30 * 60 * 1000),
            },
          });
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
      } catch (error) {
        if (!this.isPrismaCode(error, 'P2002') || attempt === 2) throw error;
      }
    }
    throw new DomainError(ErrorCode.PAYMENT_FAILED, 'The payment could not be created', 500);
  }

  private paymentNo() {
    if (this.providerName !== 'sepay') return `ZPAY-${Date.now()}-${randomInt(1000, 10000)}`;
    return `${this.transferPrefix}${randomBytes(6).toString('hex').toUpperCase()}`;
  }

  private integerAmount(value: number | string) {
    const normalized = typeof value === 'number' ? (Number.isSafeInteger(value) ? BigInt(value) : null) : /^\d+$/.test(value.trim()) ? BigInt(value.trim()) : null;
    return normalized;
  }

  private parseSepayDate(value: string) {
    const normalized = value.trim().replace(' ', 'T');
    const date = new Date(/(?:Z|[+-]\d{2}:?\d{2})$/.test(normalized) ? normalized : `${normalized}+07:00`);
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }

  private sanitizeSepayPayload(payload: SepayWebhookPayload): Record<string, unknown> {
    return {
      webhook: {
        id: String(payload.id),
        gateway: payload.gateway,
        transactionDate: payload.transactionDate,
        accountNumber: payload.accountNumber,
        subAccount: payload.subAccount ?? null,
        code: payload.code ?? null,
        transferType: payload.transferType,
        transferAmount: String(payload.transferAmount),
        referenceCode: payload.referenceCode ?? null,
      },
    };
  }

  private mergeProviderPayload(existing: string | null, webhook: Record<string, unknown>) {
    let current: StoredProviderPayload = {};
    if (existing) {
      try { current = JSON.parse(existing) as StoredProviderPayload; } catch { current = {}; }
    }
    return JSON.stringify({ ...current, ...webhook });
  }

  private isPrismaCode(error: unknown, code: string) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
  }

  private async expirePaymentIfNeeded(userId: string, paymentNo: string) {
    await this.prisma.payment.updateMany({
      where: { userId, paymentNo, status: { in: [PaymentStatus.CREATED, PaymentStatus.PENDING] }, expiredAt: { lte: new Date() } },
      data: { status: PaymentStatus.EXPIRED },
    });
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
}
