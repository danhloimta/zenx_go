import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { OtpModule } from './otp/otp.module';
import { AccountModule } from './account/account.module';
import { SocialModule } from './social/social.module';
import { WalletModule } from './wallet/wallet.module';
import { PaymentModule } from './payment/payment.module';
import { OriginGuard } from './common/origin.guard';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (request) => request.headers['x-request-id']?.toString() ?? randomUUID(),
        redact: ['req.headers.authorization', 'req.headers.cookie', 'req.headers["x-sepay-signature"]', 'res.headers["set-cookie"]'],
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [{
        ttl: config.get<number>('rateLimitTtlMs') ?? 60_000,
        limit: config.get<number>('rateLimitMax') ?? 30,
      }],
    }),
    HealthModule,
    AuthModule,
    OtpModule,
    SocialModule,
    AccountModule,
    WalletModule,
    PaymentModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }, { provide: APP_GUARD, useClass: OriginGuard }],
})
export class AppModule {}
