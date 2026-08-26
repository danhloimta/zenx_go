import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { createHmac } from 'node:crypto';
import request = require('supertest');
import { ApiErrorFilter } from '../../src/common/error.filter';
import { ResponseInterceptor } from '../../src/common/response.interceptor';
import { PrismaService } from '../../src/database/prisma.service';

jest.setTimeout(30_000);

describe('SePay VietQR integration', () => {
  const originalEnv = { ...process.env };
  const webhookSecret = 'sepay-integration-webhook-secret';
  const bankAccount = '0123456789';
  let app: INestApplication;
  let prisma: PrismaService;
  let cookies = '';
  let userId = '';
  let payment: Record<string, any>;
  let selectedPackage: Record<string, any>;

  beforeAll(async () => {
    Object.assign(process.env, {
      PAYMENT_PROVIDER: 'sepay',
      SEPAY_BANK_ACCOUNT: bankAccount,
      SEPAY_BANK_CODE: 'Vietcombank',
      SEPAY_ACCOUNT_HOLDER: 'ZENX GO',
      SEPAY_WEBHOOK_SECRET: webhookSecret,
      SEPAY_TRANSFER_PREFIX: 'ZENX',
      SEPAY_QR_BASE_URL: 'https://vietqr.app/img',
    });
    const { AppModule } = await import('../../src/app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ rawBody: true });
    const config = app.get(ConfigService);
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1');
    app.enableCors({ origin: config.getOrThrow<string>('webOrigin'), credentials: true });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidUnknownValues: true }));
    app.useGlobalFilters(new ApiErrorFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
    prisma = app.get(PrismaService);

    const suffix = Date.now().toString();
    const phone = `+849${suffix.slice(-8)}`;
    const sent = await api().post('/otp/send').send({ channel: 'SMS', purpose: 'VERIFY_PHONE', destination: phone });
    expect(sent.status).toBe(201);
    const verified = await api().post('/otp/verify').send({ channel: 'SMS', purpose: 'VERIFY_PHONE', destination: phone, code: process.env.OTP_MOCK_FIXED_CODE ?? '123456' });
    const registered = await api().post('/auth/register').send({
      username: `sepay${suffix.slice(-8)}`,
      email: `sepay-${suffix}@example.com`,
      phone,
      password: 'Password123!',
      verificationToken: verified.body.data.verificationToken,
      acceptTerms: true,
      acceptPrivacy: true,
    });
    expect(registered.status).toBe(201);
    userId = registered.body.data.user.id;
    cookies = cookieHeader(registered);
    selectedPackage = (await api().get('/coin-packages')).body.data[0];
  });

  afterAll(async () => {
    await app.close();
    for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key];
    Object.assign(process.env, originalEnv);
  });

  it('creates only VietQR payments and returns runtime payment capabilities', async () => {
    const config = await api().get('/payment-config');
    expect(config.body.data).toEqual({ provider: 'sepay', methods: ['VIETQR'], isDemo: false, allowMockCompletion: false });

    const rejected = await api().post('/payments').set('Cookie', cookies).send({ coinPackageId: selectedPackage.id, paymentMethod: 'MOMO' });
    expect(rejected.status).toBe(400);
    expect(rejected.body.error.code).toBe('INVALID_PAYMENT_METHOD');

    const idempotencyKey = `sepay-create-${Date.now()}`;
    const input = { coinPackageId: selectedPackage.id, paymentMethod: 'VIETQR', idempotencyKey };
    const [first, second] = await Promise.all([
      api().post('/payments').set('Cookie', cookies).send(input),
      api().post('/payments').set('Cookie', cookies).send(input),
    ]);
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body.data.paymentNo).toBe(first.body.data.paymentNo);
    expect(first.body.data).toMatchObject({ provider: 'sepay', paymentMethod: 'VIETQR', status: 'PENDING', providerTransactionId: null });
    expect(first.body.data.paymentNo).toMatch(/^ZENX[0-9A-F]{12}$/);
    const qr = new URL(first.body.data.qrImageUrl);
    expect(qr.searchParams.get('acc')).toBe(bankAccount);
    expect(qr.searchParams.get('amount')).toBe(String(selectedPackage.priceVnd));
    expect(qr.searchParams.get('des')).toBe(first.body.data.paymentNo);
    payment = first.body.data;
    await expect(prisma.payment.count({ where: { userId, idempotencyKey } })).resolves.toBe(1);
  });

  it('authenticates before DTO validation and acknowledges signed business mismatches without crediting', async () => {
    const unauthenticated = await request(app.getHttpServer()).post('/api/v1/webhooks/sepay').set('Content-Type', 'application/json').send({});
    expect(unauthenticated.status).toBe(401);
    expect(unauthenticated.body).toEqual({ success: false });

    const base = webhookPayload(payment.paymentNo, `mismatch-${Date.now()}`);
    for (const payload of [
      { ...base, code: 'ZENX000000000000' },
      { ...base, accountNumber: '9999999999' },
      { ...base, transferAmount: Number(payment.amountVnd) + 1 },
      { ...base, transferType: 'out' },
    ]) {
      const response = await postWebhook(payload);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    }
    await expect(prisma.payment.findUniqueOrThrow({ where: { paymentNo: payment.paymentNo } })).resolves.toMatchObject({ status: 'PENDING', providerTransactionId: null });
    await expect(prisma.walletTransaction.count({ where: { userId, type: 'TOPUP' } })).resolves.toBe(0);
  });

  it('credits an expired payment once for concurrent and repeated webhooks', async () => {
    await prisma.payment.update({ where: { paymentNo: payment.paymentNo }, data: { status: 'EXPIRED', expiredAt: new Date(Date.now() - 1_000) } });
    const payload = webhookPayload(payment.paymentNo, `sepay-tx-${Date.now()}`);
    const [first, second] = await Promise.all([postWebhook(payload), postWebhook(payload)]);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.body).toEqual({ success: true });
    const stored = await prisma.payment.findUniqueOrThrow({ where: { paymentNo: payment.paymentNo } });
    expect(stored).toMatchObject({ status: 'SUCCESS', providerTransactionId: String(payload.id) });
    expect(stored.paidAt).toBeTruthy();
    await expect(prisma.walletTransaction.count({ where: { userId, paymentId: stored.id, type: 'TOPUP' } })).resolves.toBe(1);
    await expect(prisma.wallet.findUniqueOrThrow({ where: { userId } })).resolves.toMatchObject({ balance: BigInt(selectedPackage.coinAmount) });

    const repeated = await postWebhook(payload);
    expect(repeated.status).toBe(200);
    await expect(prisma.walletTransaction.count({ where: { userId, paymentId: stored.id, type: 'TOPUP' } })).resolves.toBe(1);
  });

  it('does not reuse one SePay transaction or reopen terminal payments', async () => {
    const secondPayment = (await api().post('/payments').set('Cookie', cookies).send({ coinPackageId: selectedPackage.id, paymentMethod: 'VIETQR' })).body.data;
    const reused = webhookPayload(secondPayment.paymentNo, (await prisma.payment.findUniqueOrThrow({ where: { paymentNo: payment.paymentNo } })).providerTransactionId!);
    expect((await postWebhook(reused)).body).toEqual({ success: true });
    await expect(prisma.payment.findUniqueOrThrow({ where: { paymentNo: secondPayment.paymentNo } })).resolves.toMatchObject({ status: 'PENDING', providerTransactionId: null });

    const failedPayment = (await api().post('/payments').set('Cookie', cookies).send({ coinPackageId: selectedPackage.id, paymentMethod: 'VIETQR' })).body.data;
    await prisma.payment.update({ where: { paymentNo: failedPayment.paymentNo }, data: { status: 'FAILED' } });
    expect((await postWebhook(webhookPayload(failedPayment.paymentNo, `terminal-${Date.now()}`))).body).toEqual({ success: true });
    await expect(prisma.payment.findUniqueOrThrow({ where: { paymentNo: failedPayment.paymentNo } })).resolves.toMatchObject({ status: 'FAILED', providerTransactionId: null });
    await expect(prisma.walletTransaction.count({ where: { userId, type: 'TOPUP' } })).resolves.toBe(1);
  });

  function webhookPayload(paymentNo: string, id: string) {
    return {
      id,
      gateway: 'Vietcombank',
      transactionDate: '2026-08-26 12:00:00',
      accountNumber: bankAccount,
      subAccount: '',
      code: paymentNo,
      content: paymentNo,
      transferType: 'in',
      description: '',
      transferAmount: Number(selectedPackage.priceVnd),
      accumulated: 0,
      referenceCode: `REF-${id}`,
    };
  }

  function postWebhook(payload: Record<string, unknown>) {
    const rawBody = JSON.stringify(payload);
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = `sha256=${createHmac('sha256', webhookSecret).update(`${timestamp}.${rawBody}`).digest('hex')}`;
    return request(app.getHttpServer())
      .post('/api/v1/webhooks/sepay')
      .set('Content-Type', 'application/json')
      .set('x-sepay-signature', signature)
      .set('x-sepay-timestamp', timestamp)
      .send(rawBody);
  }

  function api() {
    return {
      get: (path: string) => request(app.getHttpServer()).get(`/api/v1${path}`).set('Origin', 'http://localhost:3000'),
      post: (path: string) => request(app.getHttpServer()).post(`/api/v1${path}`).set('Origin', 'http://localhost:3000'),
    };
  }

  function cookieHeader(response: { headers: Record<string, string | string[]> }) {
    const setCookie = response.headers['set-cookie'];
    return (Array.isArray(setCookie) ? setCookie : [setCookie]).map((cookie) => cookie.split(';')[0]).join('; ');
  }
});
