import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { WalletTransactionStatus, WalletTransactionType } from '../common/domain';
import { randomInt } from 'node:crypto';
import { DomainError, ErrorCode } from '../common/errors';
import { PrismaService } from '../database/prisma.service';

type Tx = Prisma.TransactionClient;

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  getWallet(userId: string) { return this.prisma.wallet.findUniqueOrThrow({ where: { userId }, select: { currency: true, balance: true, updatedAt: true } }); }

  async getTransactions(userId: string, query: { page?: number; pageSize?: number; type?: WalletTransactionType; status?: WalletTransactionStatus }) {
    const page = query.page ?? 1; const pageSize = Math.min(query.pageSize ?? 20, 100);
    const where = { userId, ...(query.type ? { type: query.type } : {}), ...(query.status ? { status: query.status } : {}) };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.walletTransaction.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.walletTransaction.count({ where }),
    ]);
    return { items, page, pageSize, total };
  }

  getTransaction(userId: string, transactionNo: string) { return this.prisma.walletTransaction.findFirstOrThrow({ where: { userId, transactionNo } }); }

  async credit(userId: string, input: { amount: bigint; referenceType: string; referenceId: string; description?: string; idempotencyKey?: string; type?: WalletTransactionType }, prisma = this.prisma) {
    return this.withTransactionRetry(() => prisma.$transaction((tx) => this.creditInTransaction(tx, userId, input), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
  }

  async debit(userId: string, input: { amount: bigint; referenceType: string; referenceId: string; description?: string; idempotencyKey?: string }) {
    return this.withTransactionRetry(() => this.prisma.$transaction(async (tx) => {
      if (input.idempotencyKey) {
        const existing = await tx.walletTransaction.findFirst({ where: { idempotencyKey: input.idempotencyKey } });
        if (existing) return existing;
      }
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new DomainError(ErrorCode.WALLET_NOT_FOUND, 'Wallet not found', 404);
      if (input.amount <= 0n) throw new DomainError(ErrorCode.INSUFFICIENT_BALANCE, 'Amount must be positive', 400);
      if (wallet.balance < input.amount) throw new DomainError(ErrorCode.INSUFFICIENT_BALANCE, 'Insufficient balance', 409);
      const updated = await tx.wallet.updateMany({ where: { id: wallet.id, balance: { gte: input.amount } }, data: { balance: { decrement: input.amount } } });
      if (updated.count !== 1) throw new DomainError(ErrorCode.INSUFFICIENT_BALANCE, 'Insufficient balance', 409);
      return tx.walletTransaction.create({ data: {
        transactionNo: this.transactionNo('DEBIT'), walletId: wallet.id, userId, type: WalletTransactionType.DEBIT,
        amount: input.amount, balanceBefore: wallet.balance, balanceAfter: wallet.balance - input.amount,
        status: WalletTransactionStatus.SUCCESS, referenceType: input.referenceType, referenceId: input.referenceId,
        description: input.description, idempotencyKey: input.idempotencyKey, completedAt: new Date(),
      } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
  }

  async refund(userId: string, input: { amount: bigint; referenceType: string; referenceId: string; description?: string; idempotencyKey?: string }) {
    return this.credit(userId, { ...input, type: WalletTransactionType.REFUND });
  }

  async creditInTransaction(tx: Tx, userId: string, input: { amount: bigint; referenceType: string; referenceId: string; description?: string; idempotencyKey?: string; type?: WalletTransactionType }) {
    if (input.amount <= 0n) throw new DomainError(ErrorCode.DUPLICATE_WALLET_TRANSACTION, 'Amount must be positive', 400);
    if (input.idempotencyKey) {
      const existing = await tx.walletTransaction.findFirst({ where: { idempotencyKey: input.idempotencyKey } });
      if (existing) return existing;
    }
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new DomainError(ErrorCode.WALLET_NOT_FOUND, 'Wallet not found', 404);
    await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: input.amount } } });
    return tx.walletTransaction.create({ data: {
      transactionNo: this.transactionNo(input.type ?? WalletTransactionType.CREDIT), walletId: wallet.id, userId,
      type: input.type ?? WalletTransactionType.CREDIT, amount: input.amount, balanceBefore: wallet.balance,
      balanceAfter: wallet.balance + input.amount, status: WalletTransactionStatus.SUCCESS,
      referenceType: input.referenceType, referenceId: input.referenceId, idempotencyKey: input.idempotencyKey,
      description: input.description, completedAt: new Date(),
    } });
  }

  private transactionNo(prefix: string) { return `ZTX-${prefix}-${Date.now()}-${randomInt(1000, 10000)}`; }

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
