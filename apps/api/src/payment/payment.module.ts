import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentController } from './payment.controller';
import { SepayWebhookController } from './sepay-webhook.controller';
import { MockPaymentProvider, SepayPaymentProvider } from './payment.provider';
import { PaymentService } from './payment.service';
import { PAYMENT_PROVIDER } from './payment.tokens';
import { ConfigService } from '@nestjs/config';
import { SepayWebhookAuthGuard, SepayWebhookExceptionFilter } from './sepay-webhook.guard';

@Module({
  imports: [AuthModule, WalletModule],
  controllers: [PaymentController, SepayWebhookController],
  providers: [
    MockPaymentProvider,
    SepayPaymentProvider,
    SepayWebhookAuthGuard,
    SepayWebhookExceptionFilter,
    {
      provide: PAYMENT_PROVIDER,
      inject: [ConfigService, MockPaymentProvider, SepayPaymentProvider],
      useFactory: (config: ConfigService, mock: MockPaymentProvider, sepay: SepayPaymentProvider) => {
        const providerName = config.get<string>('paymentProvider') ?? 'mock';
        return providerName === 'sepay' ? sepay : mock;
      },
    },
    PaymentService,
  ],
})
export class PaymentModule {}
