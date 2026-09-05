import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '../../auth/auth.guard';
import { AdminGuard } from '../admin.guard';
import { RequireAdminRoles } from '../admin-roles.decorator';
import { AdminRole } from '../../common/domain';
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
@UseGuards(AuthGuard, AdminGuard)
@RequireAdminRoles(AdminRole.SUPER_ADMIN)
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

  @Get('dashboard')
  dashboard() {
    return this.finance.dashboard();
  }

  @Get('coin-packages')
  packages(@Query() query: AdminFinancePackagesQueryDto) {
    return this.finance.listPackages(query);
  }

  @Post('coin-packages')
  createPackage(@Body() dto: AdminFinanceCoinPackageCreateDto) {
    return this.finance.createPackage(dto);
  }

  @Patch('coin-packages/:packageId')
  updatePackage(@Param('packageId') packageId: string, @Body() dto: AdminFinanceCoinPackageUpdateDto) {
    return this.finance.updatePackage(packageId, dto);
  }

  @Delete('coin-packages/:packageId')
  deletePackage(@Param('packageId') packageId: string) {
    return this.finance.deletePackage(packageId);
  }

  @Get('payments')
  payments(@Query() query: AdminFinancePaymentsQueryDto) {
    return this.finance.listPayments(query);
  }

  @Get('payments/:paymentNo')
  payment(@Param('paymentNo') paymentNo: string) {
    return this.finance.getPayment(paymentNo);
  }

  @Post('payments/:paymentNo/confirm-success')
  confirmSuccess(@Param('paymentNo') paymentNo: string, @Body() dto: AdminFinanceConfirmPaymentDto) {
    return this.finance.confirmSuccess(paymentNo, dto);
  }

  @Post('payments/:paymentNo/fail')
  fail(@Param('paymentNo') paymentNo: string, @Body() dto: AdminFinancePaymentActionDto) {
    return this.finance.fail(paymentNo, dto);
  }

  @Post('payments/:paymentNo/expire')
  expire(@Param('paymentNo') paymentNo: string, @Body() dto: AdminFinancePaymentActionDto) {
    return this.finance.expire(paymentNo, dto);
  }

  @Post('payments/:paymentNo/cancel')
  cancel(@Param('paymentNo') paymentNo: string, @Body() dto: AdminFinancePaymentActionDto) {
    return this.finance.cancel(paymentNo, dto);
  }

  @Post('payments/:paymentNo/refund')
  refund(@Param('paymentNo') paymentNo: string, @Body() dto: AdminFinancePaymentActionDto) {
    return this.finance.refund(paymentNo, dto);
  }

  @Get('transactions')
  transactions(@Query() query: AdminFinanceTransactionsQueryDto) {
    return this.finance.listTransactions(query);
  }

  @Get('transactions/export')
  async exportTransactions(@Query() query: AdminFinanceTransactionsQueryDto, @Res() response: Response) {
    const csv = await this.finance.exportTransactions(query);
    response
      .status(200)
      .type('text/csv; charset=utf-8')
      .setHeader('Content-Disposition', `attachment; filename="zenx-admin-transactions-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.csv"`)
      .send(csv);
  }

  @Post('users/:userId/wallet/credit')
  creditWallet(@Param('userId') userId: string, @Body() dto: AdminFinanceWalletAdjustmentDto) {
    return this.finance.creditWallet(userId, dto);
  }

  @Post('users/:userId/wallet/debit')
  debitWallet(@Param('userId') userId: string, @Body() dto: AdminFinanceWalletAdjustmentDto) {
    return this.finance.debitWallet(userId, dto);
  }
}
