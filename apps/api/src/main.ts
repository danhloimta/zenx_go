import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import express from 'express';
import { AppModule } from './app.module';
import { ApiErrorFilter } from './common/error.filter';
import { ResponseInterceptor } from './common/response.interceptor';
import { isAllowedWebOrigin } from './common/web-domain';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });
  const config = app.get(ConfigService);
  app.useLogger(app.get(Logger));
  app.use(cookieParser());
  app.use('/uploads', express.static(config.getOrThrow<string>('uploadDir')));
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    credentials: true,
    origin: (requestOrigin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      if (isAllowedWebOrigin(
        requestOrigin,
        config.getOrThrow<string>('baseDomain'),
        config.get<string[]>('allowedWebOrigins') ?? [],
        config.get<boolean>('allowGameSubdomains') ?? true,
      )) {
        callback(null, true);
      } else {
        // Let OriginGuard produce the consistent API 403 response for state-changing requests.
        callback(null, false);
      }
    },
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidUnknownValues: true }));
  app.useGlobalFilters(new ApiErrorFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  const swagger = new DocumentBuilder().setTitle('ZENX GO API').setDescription('ZENX GO Phase 1').setVersion('1.0').addCookieAuth('zenx_access').build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger));
  const host = config.get<string>('nodeEnv') === 'production' ? '127.0.0.1' : '0.0.0.0';
  await app.listen(config.getOrThrow<number>('port'), host);
}

void bootstrap();
