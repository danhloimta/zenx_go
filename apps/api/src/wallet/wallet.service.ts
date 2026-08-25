import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { WalletTransactionStatus, WalletTransactionType } from '../common/domain';
import { randomInt } from 'node:crypto';
import { DomainError, ErrorCode } from '../common/errors';
import { PrismaService } from '../database/prisma.service';

type Tx = Prisma.TransactionClient;

const TRANSACTION_PAYMENT_SELECT = {
  paymentNo: true,
  provider: true,
  paymentMethod: true,
  providerTransactionId: true,
  paidAt: true,
  status: true,
} as const;

type TransactionFilters = {
  page?: number;
  pageSize?: number;
  type?: WalletTransactionType;
  status?: WalletTransactionStatus;
  from?: string;
  to?: string;
  search?: string;
};

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  getWallet(userId: string) { return this.prisma.wallet.findUniqueOrThrow({ where: { userId }, select: { currency: true, balance: true, updatedAt: true } }); }

  async getTransactions(userId: string, query: TransactionFilters) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = this.transactionWhere(userId, query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.walletTransaction.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * pageSize, take: pageSize, include: { payment: { select: TRANSACTION_PAYMENT_SELECT } } }),
      this.prisma.walletTransaction.count({ where }),
    ]);
    return { items: items.map((item) => this.publicTransaction(item)), page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
  }

  async getTransaction(userId: string, transactionNo: string) {
    const item = await this.prisma.walletTransaction.findFirstOrThrow({
      where: { userId, transactionNo },
      include: { payment: { select: TRANSACTION_PAYMENT_SELECT } },
    });
    return this.publicTransaction(item);
  }

  async exportTransactions(userId: string, query: TransactionFilters) {
    const where = this.transactionWhere(userId, query);
    const total = await this.prisma.walletTransaction.count({ where });
    if (total > 10_000) {
      throw new DomainError(ErrorCode.EXPORT_LIMIT_EXCEEDED, 'The export contains more than 10,000 transactions. Narrow the filters and try again.', 413);
    }
    const items = await this.prisma.walletTransaction.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    const headers = ['createdAt', 'transactionNo', 'type', 'description', 'amount', 'balanceBefore', 'balanceAfter', 'status'];
    const rows = items.map((item) => [
      item.createdAt.toISOString(),
      item.transactionNo,
      item.type,
      item.description ?? '',
      item.amount.toString(),
      item.balanceBefore.toString(),
      item.balanceAfter.toString(),
      item.status,
    ]);
    return `\uFEFF${[headers, ...rows].map((row) => row.map((value) => this.csvCell(value)).join(',')).join('\r\n')}\r\n`;
  }

  async credit(userId: string, input: { amount: bigint; referenceType: string; referenceId: string; description?: string; idempotencyKey?: string; type?: WalletTransactionType }, prisma = this.prisma) {
    return this.withTransactionRetry(() => prisma.$transaction((tx) => this.creditInTransaction(tx, userId, input), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
  }

  async debit(userId: string, input: { amount: bigint; referenceType: string; referenceId: string; description?: string; idempotencyKey?: string }) {
    return this.withTransactionRetry(() => this.prisma.$transaction(async (tx) => {
      if (input.idempotencyKey) {
        const existing = await tx.walletTransaction.findFirst({ where: { userId, idempotencyKey: input.idempotencyKey } });
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
      const existing = await tx.walletTransaction.findFirst({ where: { userId, idempotencyKey: input.idempotencyKey } });
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

  private transactionWhere(userId: string, query: TransactionFilters): Prisma.WalletTransactionWhereInput {
    const where: Prisma.WalletTransactionWhereInput = {
      userId,
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const createdAt: Prisma.DateTimeFilter = {};
    if (query.from) createdAt.gte = this.parseDateBoundary(query.from, false);
    if (query.to) createdAt.lte = this.parseDateBoundary(query.to, true);
    if (createdAt.gte && createdAt.lte && createdAt.gte > createdAt.lte) {
      throw new DomainError(ErrorCode.INVALID_TRANSACTION_FILTER, 'The transaction date range is invalid', 400);
    }
    if (createdAt.gte || createdAt.lte) where.createdAt = createdAt;
    const search = query.search?.trim();
    if (search) {
      where.OR = [
        { transactionNo: { contains: search } },
        { description: { contains: search } },
        { referenceId: { contains: search } },
      ];
    }
    return where;
  }

  private parseDateBoundary(value: string, end: boolean) {
    // Date-only filters are calendar dates in the configured application timezone (UTC+07).
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (dateOnly) {
      const [, year, month, day] = dateOnly;
      const date = new Date(`${year}-${month}-${day}T${end ? '23:59:59.999' : '00:00:00.000'}+07:00`);
      if (Number.isNaN(date.getTime())) throw new DomainError(ErrorCode.INVALID_TRANSACTION_FILTER, 'The transaction date range is invalid', 400);
      return date;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new DomainError(ErrorCode.INVALID_TRANSACTION_FILTER, 'The transaction date range is invalid', 400);
    return date;
  }

  private csvCell(value: string) {
    const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
    return `"${safe.replace(/"/g, '""')}"`;
  }

  private publicTransaction<T extends {
    id?: unknown;
    walletId?: unknown;
    userId?: unknown;
    paymentId?: unknown;
    idempotencyKey?: unknown;
    payment?: { providerTransactionId: string | null } | null;
  }>(item: T) {
    const { id: _id, walletId: _walletId, userId: _userId, paymentId: _paymentId, idempotencyKey: _idempotencyKey, ...safeItem } = item;
    void _id;
    void _walletId;
    void _userId;
    void _paymentId;
    void _idempotencyKey;
    if (!safeItem.payment?.providerTransactionId) return safeItem;
    return {
      ...safeItem,
      payment: {
        ...safeItem.payment,
        providerTransactionId: this.maskProviderTransactionId(safeItem.payment.providerTransactionId),
      },
    };
  }

  private maskProviderTransactionId(value: string) {
    return value.length <= 4 ? '****' : `${'*'.repeat(Math.max(4, value.length - 4))}${value.slice(-4)}`;
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
