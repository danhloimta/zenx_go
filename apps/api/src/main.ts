import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ApiErrorFilter } from './common/error.filter';
import { ResponseInterceptor } from './common/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });
  const config = app.get(ConfigService);
  app.useLogger(app.get(Logger));
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: config.getOrThrow<string>('webOrigin'), credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidUnknownValues: true }));
  app.useGlobalFilters(new ApiErrorFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  const swagger = new DocumentBuilder().setTitle('ZENX GO API').setDescription('ZENX GO Phase 1').setVersion('1.0').addCookieAuth('zenx_access').build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger));
  await app.listen(config.getOrThrow<number>('port'), '0.0.0.0');
}

void bootstrap();
