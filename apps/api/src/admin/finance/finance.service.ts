import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CoinPackageStatus,
  PaymentStatus,
  WalletTransactionStatus,
  WalletTransactionType,
} from '../../common/domain';
import { DomainError, ErrorCode } from '../../common/errors';
import { PrismaService } from '../../database/prisma.service';
import { WalletService } from '../../wallet/wallet.service';
import {
  AdminFinanceCoinPackageCreateDto,
  AdminFinanceCoinPackageUpdateDto,
  AdminFinanceConfirmPaymentDto,
  AdminFinancePackagesQueryDto,
  AdminFinancePaymentActionDto,
  AdminFinancePaymentsQueryDto,
  AdminFinanceTransactionsQueryDto,
  AdminFinanceWalletAdjustmentDto,
} from './finance.dto';

const PAYMENT_STATUSES = Object.values(PaymentStatus);

type PaymentAction = 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'CANCELLED';

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
  ) {}

  async dashboard() {
    const [statusEntries, successful, refunded, pending, packageCounts, ledger] = await Promise.all([
      Promise.all(PAYMENT_STATUSES.map(async (status) => [status, await this.prisma.payment.count({ where: { status } })] as const)),
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.SUCCESS },
        _count: { _all: true },
        _sum: { amountVnd: true, coinAmount: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.REFUNDED },
        _count: { _all: true },
        _sum: { amountVnd: true, coinAmount: true },
      }),
      this.prisma.payment.findFirst({
        where: { status: { in: [PaymentStatus.CREATED, PaymentStatus.PENDING] } },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        select: { paymentNo: true, status: true, createdAt: true },
      }),
      Promise.all([
        this.prisma.coinPackage.count({ where: { status: CoinPackageStatus.ACTIVE } }),
        this.prisma.coinPackage.count({ where: { status: CoinPackageStatus.INACTIVE } }),
      ]),
      this.prisma.walletTransaction.aggregate({
        where: { status: WalletTransactionStatus.SUCCESS },
        _sum: { amount: true },
      }),
    ]);

    return {
      payments: {
        total: statusEntries.reduce((sum, [, count]) => sum + count, 0),
        byStatus: Object.fromEntries(statusEntries),
        successful: {
          count: successful._count._all,
          amountVnd: successful._sum.amountVnd ?? 0n,
          coinAmount: successful._sum.coinAmount ?? 0n,
        },
        refunded: {
          count: refunded._count._all,
          amountVnd: refunded._sum.amountVnd ?? 0n,
          coinAmount: refunded._sum.coinAmount ?? 0n,
        },
        oldestPending: pending,
      },
      packages: { active: packageCounts[0], inactive: packageCounts[1] },
      ledger: { successfulTransactionAmount: ledger._sum.amount ?? 0n },
    };
  }

  async listPackages(query: AdminFinancePackagesQueryDto = {}) {
    const packages = await this.prisma.coinPackage.findMany({
      where: query.status ? { status: query.status } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }, { code: 'asc' }],
    });
    return packages.map((item) => this.publicPackage(item));
  }

  async createPackage(dto: AdminFinanceCoinPackageCreateDto) {
    const priceVnd = this.positiveAmount(dto.priceVnd);
    const coinAmount = this.positiveAmount(dto.coinAmount);
    try {
      const item = await this.prisma.coinPackage.create({
        data: {
          code: dto.code.trim().toUpperCase(),
          name: dto.name.trim(),
          priceVnd,
          coinAmount,
          status: dto.status,
          sortOrder: dto.sortOrder,
        },
      });
      return this.publicPackage(item);
    } catch (error) {
      if (this.isPrismaCode(error, 'P2002')) {
        throw new DomainError(ErrorCode.COIN_PACKAGE_CODE_EXISTS, 'Coin package code already exists', 409);
      }
      throw error;
    }
  }

  async updatePackage(packageId: string, dto: AdminFinanceCoinPackageUpdateDto) {
    const current = await this.prisma.coinPackage.findUnique({ where: { id: packageId } });
    if (!current) throw new DomainError(ErrorCode.COIN_PACKAGE_NOT_FOUND, 'Coin package not found', 404);
    this.assertExpectedVersion(current.updatedAt, dto.expectedUpdatedAt);

    const data: Prisma.CoinPackageUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.priceVnd !== undefined) data.priceVnd = this.positiveAmount(dto.priceVnd);
    if (dto.coinAmount !== undefined) data.coinAmount = this.positiveAmount(dto.coinAmount);
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    if (Object.keys(data).length === 0) return this.publicPackage(current);

    const updated = await this.prisma.coinPackage.updateMany({
      where: { id: packageId, updatedAt: new Date(dto.expectedUpdatedAt) },
      data,
    });
    if (updated.count !== 1) throw new DomainError(ErrorCode.FINANCE_STALE_UPDATE, 'Coin package was changed by another admin', 409);
    return this.publicPackage(await this.prisma.coinPackage.findUniqueOrThrow({ where: { id: packageId } }));
  }

  async deletePackage(packageId: string) {
    try {
      await this.prisma.$transaction(async (tx) => {
        const item = await tx.coinPackage.findUnique({ where: { id: packageId } });
        if (!item) throw new DomainError(ErrorCode.COIN_PACKAGE_NOT_FOUND, 'Coin package not found', 404);
        if (item.status !== CoinPackageStatus.INACTIVE) {
          throw new DomainError(ErrorCode.COIN_PACKAGE_MUST_BE_INACTIVE, 'Deactivate the coin package before deleting it', 409);
        }
        const paymentCount = await tx.payment.count({ where: { coinPackageId: packageId } });
        if (paymentCount > 0) {
          throw new DomainError(ErrorCode.COIN_PACKAGE_IN_USE, 'Coin package has payment history and cannot be deleted', 409);
        }
        await tx.coinPackage.delete({ where: { id: packageId } });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (this.isPrismaCode(error, 'P2003')) {
        throw new DomainError(ErrorCode.COIN_PACKAGE_IN_USE, 'Coin package has payment history and cannot be deleted', 409);
      }
      throw error;
    }
    return { deleted: true, id: packageId };
  }

  async listPayments(query: AdminFinancePaymentsQueryDto = {} as AdminFinancePaymentsQueryDto) {
    const where = this.paymentWhere(query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const [items, total, statusEntries] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { id: true, username: true, email: true, phone: true, profile: { select: { fullName: true } } } },
          coinPackage: { select: { id: true, code: true, name: true } },
        },
      }),
      this.prisma.payment.count({ where }),
      Promise.all(PAYMENT_STATUSES.map(async (status) => [status, await this.prisma.payment.count({ where: { ...where, status } })] as const)),
    ]);
    return {
      items: items.map((item) => this.publicPayment(item, false)),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      statusCounts: Object.fromEntries(statusEntries),
    };
  }

  async getPayment(paymentNo: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { paymentNo },
      include: {
        user: { select: { id: true, username: true, email: true, phone: true, status: true, profile: { select: { fullName: true, avatarUrl: true } } } },
        coinPackage: true,
      },
    });
    if (!payment) throw new DomainError(ErrorCode.PAYMENT_NOT_FOUND, 'Payment not found', 404);
    const transactions = await this.prisma.walletTransaction.findMany({
      where: { OR: [{ paymentId: payment.id }, { referenceType: 'PAYMENT_REFUND', referenceId: payment.id }] },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    return {
      ...this.publicPayment(payment, true),
      walletTransactions: transactions.map((item) => this.publicTransaction(item)),
    };
  }

  async listTransactions(query: AdminFinanceTransactionsQueryDto = {} as AdminFinanceTransactionsQueryDto) {
    const where = this.transactionWhere(query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const [items, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { id: true, username: true, email: true, profile: { select: { fullName: true } } } },
          payment: { select: { paymentNo: true, provider: true, paymentMethod: true, providerTransactionId: true, status: true, paidAt: true } },
        },
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);
    return { items: items.map((item) => this.publicTransaction(item)), page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
  }

  async exportTransactions(query: AdminFinanceTransactionsQueryDto = {} as AdminFinanceTransactionsQueryDto) {
    const where = this.transactionWhere(query);
    const total = await this.prisma.walletTransaction.count({ where });
    if (total > 10_000) throw new DomainError(ErrorCode.EXPORT_LIMIT_EXCEEDED, 'The export contains more than 10,000 transactions. Narrow the filters and try again.', 413);
    const items = await this.prisma.walletTransaction.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: { user: { select: { username: true, email: true } }, payment: { select: { paymentNo: true, providerTransactionId: true } } },
    });
    const headers = ['createdAt', 'transactionNo', 'username', 'email', 'type', 'amount', 'balanceBefore', 'balanceAfter', 'status', 'referenceType', 'referenceId', 'paymentNo', 'providerTransactionId', 'description'];
    const rows = items.map((item) => [
      item.createdAt.toISOString(), item.transactionNo, item.user.username, item.user.email, item.type,
      item.amount.toString(), item.balanceBefore.toString(), item.balanceAfter.toString(), item.status,
      item.referenceType, item.referenceId, item.payment?.paymentNo ?? '', item.payment?.providerTransactionId ? this.maskProviderTransactionId(item.payment.providerTransactionId) : '', item.description ?? '',
    ]);
    return `\uFEFF${[headers, ...rows].map((row) => row.map((value) => this.csvCell(value)).join(',')).join('\r\n')}\r\n`;
  }

  async confirmSuccess(paymentNo: string, dto: AdminFinanceConfirmPaymentDto) {
    try {
      await this.transitionPayment(paymentNo, 'SUCCESS', dto);
    } catch (error) {
      if (this.isPrismaCode(error, 'P2002')) {
        throw new DomainError(ErrorCode.FINANCE_PROVIDER_TRANSACTION_EXISTS, 'Provider transaction ID is already linked to another payment', 409);
      }
      throw error;
    }
    return this.getPayment(paymentNo);
  }

  async fail(paymentNo: string, dto: AdminFinancePaymentActionDto) {
    await this.transitionPayment(paymentNo, 'FAILED', dto);
    return this.getPayment(paymentNo);
  }

  async expire(paymentNo: string, dto: AdminFinancePaymentActionDto) {
    await this.transitionPayment(paymentNo, 'EXPIRED', dto);
    return this.getPayment(paymentNo);
  }

  async cancel(paymentNo: string, dto: AdminFinancePaymentActionDto) {
    await this.transitionPayment(paymentNo, 'CANCELLED', dto);
    return this.getPayment(paymentNo);
  }

  async refund(paymentNo: string, dto: AdminFinancePaymentActionDto) {
    await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { paymentNo } });
      if (!payment) throw new DomainError(ErrorCode.PAYMENT_NOT_FOUND, 'Payment not found', 404);
      if (payment.status === PaymentStatus.REFUNDED) return;
      if (payment.status !== PaymentStatus.SUCCESS) throw new DomainError(ErrorCode.FINANCE_PAYMENT_TRANSITION_INVALID, 'Only successful payments can be refunded', 409);
      this.assertExpectedVersion(payment.updatedAt, dto.expectedUpdatedAt);
      const transaction = await this.wallet.debitInTransaction(tx, payment.userId, {
        amount: payment.coinAmount,
        referenceType: 'PAYMENT_REFUND',
        referenceId: payment.id,
        idempotencyKey: `payment:${payment.id}:refund`,
        description: `Refund ${payment.paymentNo}`,
      });
      const updated = await tx.payment.updateMany({
        where: { id: payment.id, status: PaymentStatus.SUCCESS, updatedAt: new Date(dto.expectedUpdatedAt) },
        data: { status: PaymentStatus.REFUNDED },
      });
      if (updated.count !== 1) throw new DomainError(ErrorCode.FINANCE_STALE_UPDATE, 'Payment was changed by another admin', 409);
      // paymentId is intentionally left null: the original TOPUP transaction
      // already owns the payment relation. The refund is linked by reference.
      void transaction;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return this.getPayment(paymentNo);
  }

  async creditWallet(userId: string, dto: AdminFinanceWalletAdjustmentDto) {
    await this.assertUserExists(userId);
    const amount = this.positiveAmount(dto.amount);
    return this.wallet.credit(userId, {
      amount,
      type: WalletTransactionType.CREDIT,
      referenceType: 'ADMIN_ADJUSTMENT',
      referenceId: dto.clientRequestId,
      idempotencyKey: `admin:${dto.clientRequestId}`,
      description: dto.note || 'Admin wallet credit',
    });
  }

  async debitWallet(userId: string, dto: AdminFinanceWalletAdjustmentDto) {
    await this.assertUserExists(userId);
    const amount = this.positiveAmount(dto.amount);
    return this.wallet.debit(userId, {
      amount,
      referenceType: 'ADMIN_ADJUSTMENT',
      referenceId: dto.clientRequestId,
      idempotencyKey: `admin:${dto.clientRequestId}`,
      description: dto.note || 'Admin wallet debit',
    });
  }

  private async transitionPayment(paymentNo: string, target: PaymentAction, dto: AdminFinancePaymentActionDto | AdminFinanceConfirmPaymentDto) {
    await this.prisma.$transaction(async (tx) => {
      const current = await tx.payment.findUnique({ where: { paymentNo } });
      if (!current) throw new DomainError(ErrorCode.PAYMENT_NOT_FOUND, 'Payment not found', 404);
      if (current.status === target) return;

      const allowed: Record<PaymentAction, PaymentStatus[]> = {
        SUCCESS: [PaymentStatus.CREATED, PaymentStatus.PENDING, PaymentStatus.EXPIRED, PaymentStatus.FAILED],
        FAILED: [PaymentStatus.CREATED, PaymentStatus.PENDING],
        EXPIRED: [PaymentStatus.CREATED, PaymentStatus.PENDING],
        CANCELLED: [PaymentStatus.CREATED, PaymentStatus.PENDING],
      };
      if (!allowed[target].includes(current.status as PaymentStatus)) {
        throw new DomainError(ErrorCode.FINANCE_PAYMENT_TRANSITION_INVALID, `Payment cannot transition from ${current.status} to ${target}`, 409);
      }
      this.assertExpectedVersion(current.updatedAt, dto.expectedUpdatedAt);

      const data: Prisma.PaymentUpdateInput = { status: target };
      if (target === 'SUCCESS') {
        const confirm = dto as AdminFinanceConfirmPaymentDto;
        const providerTransactionId = confirm.providerTransactionId?.trim() || current.providerTransactionId;
        if (!providerTransactionId) throw new DomainError(ErrorCode.FINANCE_PROVIDER_TRANSACTION_EXISTS, 'Provider transaction ID is required to confirm payment', 400);
        const owner = await tx.payment.findFirst({ where: { providerTransactionId, id: { not: current.id } }, select: { paymentNo: true } });
        if (owner) throw new DomainError(ErrorCode.FINANCE_PROVIDER_TRANSACTION_EXISTS, 'Provider transaction ID is already linked to another payment', 409);
        data.providerTransactionId = providerTransactionId;
        data.paidAt = confirm.paidAt ? new Date(confirm.paidAt) : new Date();
      }

      const updated = await tx.payment.updateMany({ where: { id: current.id, status: current.status, updatedAt: new Date(dto.expectedUpdatedAt) }, data });
      if (updated.count !== 1) throw new DomainError(ErrorCode.FINANCE_STALE_UPDATE, 'Payment was changed by another admin', 409);
      if (target === 'SUCCESS') {
        const transaction = await this.wallet.creditInTransaction(tx, current.userId, {
          amount: current.coinAmount,
          type: WalletTransactionType.TOPUP,
          referenceType: 'PAYMENT',
          referenceId: current.id,
          idempotencyKey: `payment:${current.id}`,
          description: `Top up ${current.paymentNo}`,
        });
        await tx.walletTransaction.updateMany({ where: { id: transaction.id, paymentId: null }, data: { paymentId: current.id } });
      }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  private async assertUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw new DomainError(ErrorCode.ACCOUNT_NOT_FOUND, 'Account not found', 404);
  }

  private paymentWhere(query: AdminFinancePaymentsQueryDto): Prisma.PaymentWhereInput {
    let statusFilter: Prisma.PaymentWhereInput['status'] = undefined;
    if (query.status) {
      const parts = query.status.split(',').map((s) => s.trim()).filter(Boolean);
      const validStatuses = parts.filter((p) => PAYMENT_STATUSES.includes(p as PaymentStatus)) as PaymentStatus[];
      if (validStatuses.length === 1) {
        statusFilter = validStatuses[0];
      } else if (validStatuses.length > 1) {
        statusFilter = { in: validStatuses };
      }
    }

    const where: Prisma.PaymentWhereInput = {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(query.provider ? { provider: { contains: query.provider.trim() } } : {}),
      ...(query.paymentMethod ? { paymentMethod: query.paymentMethod } : {}),
    };
    this.applyDateFilter(where, query.from, query.to);
    const search = query.search?.trim();
    if (search) {
      where.OR = [
        { paymentNo: { contains: search } },
        { providerTransactionId: { contains: search } },
        { user: { username: { contains: search } } },
        { user: { email: { contains: search } } },
        { user: { phone: { contains: search } } },
        { user: { profile: { is: { fullName: { contains: search } } } } },
      ];
    }
    return where;
  }

  private transactionWhere(query: AdminFinanceTransactionsQueryDto): Prisma.WalletTransactionWhereInput {
    const where: Prisma.WalletTransactionWhereInput = {
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    this.applyDateFilter(where, query.from, query.to);
    const search = query.search?.trim();
    if (search) {
      where.OR = [
        { transactionNo: { contains: search } },
        { referenceId: { contains: search } },
        { description: { contains: search } },
        { user: { username: { contains: search } } },
        { user: { email: { contains: search } } },
        { payment: { paymentNo: { contains: search } } },
      ];
    }
    return where;
  }

  private applyDateFilter(where: Prisma.PaymentWhereInput | Prisma.WalletTransactionWhereInput, from?: string, to?: string) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (from) createdAt.gte = this.parseDateBoundary(from, false);
    if (to) createdAt.lte = this.parseDateBoundary(to, true);
    if (createdAt.gte && createdAt.lte && createdAt.gte > createdAt.lte) throw new DomainError(ErrorCode.INVALID_TRANSACTION_FILTER, 'The transaction date range is invalid', 400);
    if (createdAt.gte || createdAt.lte) where.createdAt = createdAt;
  }

  private parseDateBoundary(value: string, end: boolean) {
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    const date = dateOnly
      ? new Date(`${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}T${end ? '23:59:59.999' : '00:00:00.000'}+07:00`)
      : new Date(value);
    if (Number.isNaN(date.getTime())) throw new DomainError(ErrorCode.INVALID_TRANSACTION_FILTER, 'The transaction date range is invalid', 400);
    return date;
  }

  private publicPackage(item: { id: string; code: string; name: string; priceVnd: bigint; coinAmount: bigint; status: string; sortOrder: number; createdAt: Date; updatedAt: Date }) {
    return item;
  }

  private publicPayment(payment: any, detail: boolean) {
    const user = payment.user ? {
      id: payment.user.id,
      username: payment.user.username,
      email: payment.user.email,
      phone: payment.user.phone,
      ...(payment.user.status ? { status: payment.user.status } : {}),
      profile: payment.user.profile,
    } : undefined;
    return {
      paymentNo: payment.paymentNo,
      status: payment.status,
      provider: payment.provider,
      amountVnd: payment.amountVnd,
      coinAmount: payment.coinAmount,
      paymentMethod: payment.paymentMethod,
      providerTransactionId: payment.providerTransactionId ? (detail ? payment.providerTransactionId : this.maskProviderTransactionId(payment.providerTransactionId)) : null,
      createdAt: payment.createdAt,
      paidAt: payment.paidAt,
      expiredAt: payment.expiredAt,
      updatedAt: payment.updatedAt,
      ...(user ? { user } : {}),
      ...(payment.coinPackage ? { coinPackage: payment.coinPackage } : {}),
      ...(detail ? { providerPayload: this.safeProviderPayload(payment.providerPayload) } : {}),
    };
  }

  private publicTransaction(item: any) {
    return {
      transactionNo: item.transactionNo,
      userId: item.userId,
      user: item.user,
      type: item.type,
      amount: item.amount,
      balanceBefore: item.balanceBefore,
      balanceAfter: item.balanceAfter,
      status: item.status,
      referenceType: item.referenceType,
      referenceId: item.referenceId,
      description: item.description,
      createdAt: item.createdAt,
      completedAt: item.completedAt,
      payment: item.payment ? {
        ...item.payment,
        providerTransactionId: item.payment.providerTransactionId ? this.maskProviderTransactionId(item.payment.providerTransactionId) : null,
      } : null,
    };
  }

  private safeProviderPayload(value: string | null) {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value) as Record<string, unknown>;
      const metadata = parsed.displayMetadata;
      return {
        ...(typeof parsed.qrPayload === 'string' ? { qrPayload: parsed.qrPayload } : {}),
        ...(typeof parsed.qrImageUrl === 'string' ? { qrImageUrl: parsed.qrImageUrl } : {}),
        ...(metadata && typeof metadata === 'object' ? { displayMetadata: metadata } : {}),
        ...(parsed.webhook && typeof parsed.webhook === 'object' ? { webhook: parsed.webhook } : {}),
      };
    } catch {
      return null;
    }
  }

  private maskProviderTransactionId(value: string) {
    return value.length <= 4 ? '****' : `${'*'.repeat(Math.max(4, value.length - 4))}${value.slice(-4)}`;
  }

  private positiveAmount(value: string) {
    try {
      const amount = BigInt(value.trim());
      if (amount <= 0n) throw new Error('non-positive');
      return amount;
    } catch {
      throw new DomainError(ErrorCode.FINANCE_INVALID_AMOUNT, 'Amount must be a positive integer', 400);
    }
  }

  private assertExpectedVersion(current: Date, expected: string) {
    const expectedDate = new Date(expected);
    if (Number.isNaN(expectedDate.getTime()) || current.getTime() !== expectedDate.getTime()) {
      throw new DomainError(ErrorCode.FINANCE_STALE_UPDATE, 'The resource was changed by another admin', 409);
    }
  }

  private csvCell(value: unknown) {
    const text = String(value ?? '');
    const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  }

  private isPrismaCode(error: unknown, code: string) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
  }
}
