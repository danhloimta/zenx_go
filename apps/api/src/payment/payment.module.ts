import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentController } from './payment.controller';
import { MockPaymentProvider } from './payment.provider';
import { PaymentService } from './payment.service';

@Module({ imports: [AuthModule, WalletModule], controllers: [PaymentController], providers: [PaymentService, MockPaymentProvider] })
export class PaymentModule {}
