import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import configuration from './configuration';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: Joi.object({
        API_PORT: Joi.number().port().default(4000),
        WEB_ORIGIN: Joi.string().uri().default('http://localhost:3000'),
        DATABASE_URL: Joi.string().optional(),
        JWT_ACCESS_SECRET: Joi.string().min(32).default('development-access-secret-change-me-32'),
        JWT_REFRESH_SECRET: Joi.string().min(32).default('development-refresh-secret-change-me-32'),
        NODE_ENV: Joi.string().valid('development', 'test', 'staging', 'production').default('development'),
        OTP_MOCK_FIXED_CODE: Joi.string().pattern(/^\d{6}$/).when('NODE_ENV', { is: 'test', then: Joi.optional(), otherwise: Joi.forbidden() }),
      }),
    }),
  ],
  exports: [ConfigModule],
})
export class AppConfigModule {}
