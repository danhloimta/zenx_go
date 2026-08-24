import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { WalletTransactionsQueryDto } from './dto';
import { WalletService } from './wallet.service';

@Controller('wallet')
@UseGuards(AuthGuard)
export class WalletController {
  constructor(private readonly wallet: WalletService) {}
  @Get() get(@Req() request: AuthenticatedRequest) { return this.wallet.getWallet(request.user.sub); }
  @Get('transactions') list(@Req() request: AuthenticatedRequest, @Query() query: WalletTransactionsQueryDto) { return this.wallet.getTransactions(request.user.sub, query); }
  @Get('transactions/:transactionNo') detail(@Req() request: AuthenticatedRequest, @Param('transactionNo') transactionNo: string) { return this.wallet.getTransaction(request.user.sub, transactionNo); }
}
