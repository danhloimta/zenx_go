import { Controller, Get, Param, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { WalletTransactionsQueryDto } from './dto';
import { WalletService } from './wallet.service';

@Controller('wallet')
@UseGuards(AuthGuard)
export class WalletController {
  constructor(private readonly wallet: WalletService) {}
  @Get() get(@Req() request: AuthenticatedRequest) { return this.wallet.getWallet(request.user.sub); }
  @Get('transactions') list(@Req() request: AuthenticatedRequest, @Query() query: WalletTransactionsQueryDto) { return this.wallet.getTransactions(request.user.sub, query); }
  @Get('transactions/export')
  async export(@Req() request: AuthenticatedRequest, @Query() query: WalletTransactionsQueryDto, @Res() response: Response) {
    const csv = await this.wallet.exportTransactions(request.user.sub, query);
    response
      .status(200)
      .type('text/csv; charset=utf-8')
      .setHeader('Content-Disposition', `attachment; filename="zenx-transactions-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.csv"`)
      .send(csv);
  }
  @Get('transactions/:transactionNo') detail(@Req() request: AuthenticatedRequest, @Param('transactionNo') transactionNo: string) { return this.wallet.getTransaction(request.user.sub, transactionNo); }
}
