import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { WalletModule } from '../../wallet/wallet.module';
import { AdminGuard } from '../admin.guard';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

@Module({
  imports: [AuthModule, WalletModule],
  controllers: [FinanceController],
  providers: [FinanceService, AdminGuard],
})
export class FinanceModule {}
