import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '../../auth/auth.guard';
import { AdminGuard } from '../admin.guard';
import { PermissionGuard } from '../permission.guard';
import { RequirePermission } from '../permission.decorator';
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
import { FinanceService } from './finance.service';

@Controller('admin/finance')
@UseGuards(AuthGuard, AdminGuard, PermissionGuard)
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

  @Get('dashboard')
  @RequirePermission({ code: 'finance.dashboard.view', action: 'read', subject: 'FinanceDashboard' })
  dashboard() {
    return this.finance.dashboard();
  }

  @Get('coin-packages')
  @RequirePermission({ code: 'finance.packages.manage', action: 'manage', subject: 'CoinPackage' })
  packages(@Query() query: AdminFinancePackagesQueryDto) {
    return this.finance.listPackages(query);
  }

  @Post('coin-packages')
  @RequirePermission({ code: 'finance.packages.manage', action: 'manage', subject: 'CoinPackage' })
  createPackage(@Body() dto: AdminFinanceCoinPackageCreateDto) {
    return this.finance.createPackage(dto);
  }

  @Patch('coin-packages/:packageId')
  @RequirePermission({ code: 'finance.packages.manage', action: 'manage', subject: 'CoinPackage' })
  updatePackage(@Param('packageId') packageId: string, @Body() dto: AdminFinanceCoinPackageUpdateDto) {
    return this.finance.updatePackage(packageId, dto);
  }

  @Delete('coin-packages/:packageId')
  @RequirePermission({ code: 'finance.packages.manage', action: 'manage', subject: 'CoinPackage' })
  deletePackage(@Param('packageId') packageId: string) {
    return this.finance.deletePackage(packageId);
  }

  @Get('payments')
  @RequirePermission({ code: 'finance.payments.view', action: 'read', subject: 'Payment' })
  payments(@Query() query: AdminFinancePaymentsQueryDto) {
    return this.finance.listPayments(query);
  }

  @Get('payments/:paymentNo')
  @RequirePermission({ code: 'finance.payments.view', action: 'read', subject: 'Payment' })
  payment(@Param('paymentNo') paymentNo: string) {
    return this.finance.getPayment(paymentNo);
  }

  @Post('payments/:paymentNo/confirm-success')
  @RequirePermission({ code: 'finance.payments.process', action: 'process', subject: 'Payment' })
  confirmSuccess(@Param('paymentNo') paymentNo: string, @Body() dto: AdminFinanceConfirmPaymentDto) {
    return this.finance.confirmSuccess(paymentNo, dto);
  }

  @Post('payments/:paymentNo/fail')
  @RequirePermission({ code: 'finance.payments.process', action: 'process', subject: 'Payment' })
  fail(@Param('paymentNo') paymentNo: string, @Body() dto: AdminFinancePaymentActionDto) {
    return this.finance.fail(paymentNo, dto);
  }

  @Post('payments/:paymentNo/expire')
  @RequirePermission({ code: 'finance.payments.process', action: 'process', subject: 'Payment' })
  expire(@Param('paymentNo') paymentNo: string, @Body() dto: AdminFinancePaymentActionDto) {
    return this.finance.expire(paymentNo, dto);
  }

  @Post('payments/:paymentNo/cancel')
  @RequirePermission({ code: 'finance.payments.process', action: 'process', subject: 'Payment' })
  cancel(@Param('paymentNo') paymentNo: string, @Body() dto: AdminFinancePaymentActionDto) {
    return this.finance.cancel(paymentNo, dto);
  }

  @Post('payments/:paymentNo/refund')
  @RequirePermission({ code: 'finance.payments.refund', action: 'refund', subject: 'Payment' })
  refund(@Param('paymentNo') paymentNo: string, @Body() dto: AdminFinancePaymentActionDto) {
    return this.finance.refund(paymentNo, dto);
  }

  @Get('transactions')
  @RequirePermission({ code: 'finance.transactions.view', action: 'read', subject: 'WalletTransaction' })
  transactions(@Query() query: AdminFinanceTransactionsQueryDto) {
    return this.finance.listTransactions(query);
  }

  @Get('transactions/export')
  @RequirePermission({ code: 'finance.transactions.export', action: 'export', subject: 'WalletTransaction' })
  async exportTransactions(@Query() query: AdminFinanceTransactionsQueryDto, @Res() response: Response) {
    const csv = await this.finance.exportTransactions(query);
    response
      .status(200)
      .type('text/csv; charset=utf-8')
      .setHeader('Content-Disposition', `attachment; filename="zenx-admin-transactions-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.csv"`)
      .send(csv);
  }

  @Post('users/:userId/wallet/credit')
  @RequirePermission({ code: 'finance.wallet.adjust', action: 'adjust', subject: 'Wallet' })
  creditWallet(@Param('userId') userId: string, @Body() dto: AdminFinanceWalletAdjustmentDto) {
    return this.finance.creditWallet(userId, dto);
  }

  @Post('users/:userId/wallet/debit')
  @RequirePermission({ code: 'finance.wallet.adjust', action: 'adjust', subject: 'Wallet' })
  debitWallet(@Param('userId') userId: string, @Body() dto: AdminFinanceWalletAdjustmentDto) {
    return this.finance.debitWallet(userId, dto);
  }
}
