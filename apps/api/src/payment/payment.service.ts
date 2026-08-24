import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus, WalletTransactionType } from '../common/domain';
import { Prisma } from '@prisma/client';
import { randomInt } from 'node:crypto';
import { DomainError, ErrorCode } from '../common/errors';
import { PrismaService } from '../database/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CreatePaymentDto } from './dto';
import { MockPaymentProvider, PaymentProvider } from './payment.provider';

@Injectable()
export class PaymentService {
  private readonly provider: PaymentProvider;
  constructor(private readonly prisma: PrismaService, private readonly wallet: WalletService, config: ConfigService, mock: MockPaymentProvider) {
    this.provider = config.get('paymentProvider') === 'mock' ? mock : mock;
  }

  async listPackages() { return this.prisma.coinPackage.findMany({ where: { status: 'ACTIVE' }, orderBy: { sortOrder: 'asc' } }); }

  async create(userId: string, dto: CreatePaymentDto) {
    const coinPackage = await this.prisma.coinPackage.findFirst({ where: { id: dto.coinPackageId, status: 'ACTIVE' } });
    if (!coinPackage) throw new DomainError(ErrorCode.PAYMENT_NOT_FOUND, 'Coin package not found', 404);
    const paymentNo = `ZPAY-${Date.now()}-${randomInt(1000, 10000)}`;
    const created = await this.prisma.payment.create({ data: { paymentNo, userId, coinPackageId: coinPackage.id, amountVnd: coinPackage.priceVnd, coinAmount: coinPackage.coinAmount, provider: 'mock', paymentMethod: dto.paymentMethod, status: PaymentStatus.CREATED, expiredAt: new Date(Date.now() + 30 * 60 * 1000) } });
    const providerPayment = await this.provider.createPayment({ paymentNo, amountVnd: coinPackage.priceVnd, coinAmount: coinPackage.coinAmount, paymentMethod: dto.paymentMethod });
    const payment = await this.prisma.payment.update({ where: { id: created.id }, data: { providerTransactionId: providerPayment.providerTransactionId, status: PaymentStatus.PENDING } });
    return { ...payment, paymentUrl: providerPayment.paymentUrl };
  }

  get(userId: string, paymentNo: string) { return this.prisma.payment.findFirstOrThrow({ where: { userId, paymentNo } }); }
  list(userId: string) { return this.prisma.payment.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 100 }); }

  async callback(rawBody: string, signature: string, payload: Record<string, unknown>) {
    let verified;
    try { verified = await this.provider.verifyCallback({ rawBody, signature, payload }); }
    catch { throw new DomainError(ErrorCode.INVALID_PAYMENT_CALLBACK, 'Invalid payment callback', 400); }
    return this.withTransactionRetry(() => this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { paymentNo: verified.paymentNo } });
      if (!payment) throw new DomainError(ErrorCode.PAYMENT_NOT_FOUND, 'Payment not found', 404);
      if (payment.providerTransactionId && payment.providerTransactionId !== verified.providerTransactionId) {
        throw new DomainError(ErrorCode.INVALID_PAYMENT_CALLBACK, 'Payment provider transaction does not match', 400);
      }
      if (payment.status === PaymentStatus.SUCCESS || payment.status === PaymentStatus.FAILED || payment.status === PaymentStatus.EXPIRED) return payment;
      const status = verified.status === 'SUCCESS' ? PaymentStatus.SUCCESS : verified.status === 'FAILED' ? PaymentStatus.FAILED : PaymentStatus.EXPIRED;
      const updated = await tx.payment.update({ where: { id: payment.id }, data: { status, paidAt: status === PaymentStatus.SUCCESS ? new Date() : undefined } });
      if (status === PaymentStatus.SUCCESS) {
        const transaction = await this.wallet.creditInTransaction(tx, payment.userId, { amount: payment.coinAmount, type: WalletTransactionType.TOPUP, referenceType: 'PAYMENT', referenceId: payment.id, idempotencyKey: `payment:${payment.id}`, description: `Top up ${payment.paymentNo}` });
        await tx.walletTransaction.update({ where: { id: transaction.id }, data: { paymentId: payment.id } });
      }
      return updated;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
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
