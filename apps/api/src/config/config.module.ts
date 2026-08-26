import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import configuration from './configuration';

const optionalOAuthString = () => Joi.string().trim().empty('').optional();
const optionalOAuthUri = () => Joi.string().trim().uri().empty('').optional();

export const appConfigValidationSchema = Joi.object({
  API_PORT: Joi.number().port().default(4000),
  WEB_ORIGIN: Joi.string().uri().default('http://localhost:3000'),
  DATABASE_URL: Joi.string().optional(),
  JWT_ACCESS_SECRET: Joi.string().min(32).default('development-access-secret-change-me-32'),
  JWT_REFRESH_SECRET: Joi.string().min(32).default('development-refresh-secret-change-me-32'),
  NODE_ENV: Joi.string().valid('development', 'test', 'staging', 'production').default('development'),
  DEMO_MODE: Joi.boolean().default(false),
  OTP_MOCK_FIXED_CODE: Joi.string().pattern(/^\d{6}$/).empty('').optional(),
  PAYMENT_PROVIDER: Joi.string().valid('mock', 'sepay').default('mock'),
  SEPAY_BANK_ACCOUNT: Joi.string().trim().empty('').when('PAYMENT_PROVIDER', { is: 'sepay', then: Joi.required(), otherwise: Joi.optional() }),
  SEPAY_BANK_CODE: Joi.string().trim().empty('').when('PAYMENT_PROVIDER', { is: 'sepay', then: Joi.required(), otherwise: Joi.optional() }),
  SEPAY_ACCOUNT_HOLDER: Joi.string().trim().empty('').when('PAYMENT_PROVIDER', { is: 'sepay', then: Joi.required(), otherwise: Joi.optional() }),
  SEPAY_WEBHOOK_SECRET: Joi.string().min(16).empty('').when('PAYMENT_PROVIDER', { is: 'sepay', then: Joi.required(), otherwise: Joi.optional() }),
  SEPAY_TRANSFER_PREFIX: Joi.string().pattern(/^[A-Z0-9]+$/).min(2).max(5).default('ZENX'),
  SEPAY_QR_BASE_URL: Joi.string().uri().default('https://vietqr.app/img'),
  UPLOAD_DIR: Joi.string().default('uploads'),
  RATE_LIMIT_TTL_MS: Joi.number().integer().positive().default(60_000),
  RATE_LIMIT_MAX: Joi.number().integer().positive().default(30),
  OAUTH_STATE_SECRET: Joi.string().trim().min(32).empty('').default('development-refresh-secret-change-me-32'),
  GOOGLE_CLIENT_ID: optionalOAuthString(),
  GOOGLE_CLIENT_SECRET: optionalOAuthString(),
  GOOGLE_REDIRECT_URI: optionalOAuthUri(),
  GOOGLE_AUTHORIZATION_URL: optionalOAuthUri(),
  GOOGLE_TOKEN_URL: optionalOAuthUri(),
  GOOGLE_USERINFO_URL: optionalOAuthUri(),
  FACEBOOK_CLIENT_ID: optionalOAuthString(),
  FACEBOOK_CLIENT_SECRET: optionalOAuthString(),
  FACEBOOK_REDIRECT_URI: optionalOAuthUri(),
  FACEBOOK_AUTHORIZATION_URL: optionalOAuthUri(),
  FACEBOOK_TOKEN_URL: optionalOAuthUri(),
  FACEBOOK_USERINFO_URL: optionalOAuthUri(),
});

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: appConfigValidationSchema,
    }),
  ],
  exports: [ConfigModule],
})
export class AppConfigModule {}
