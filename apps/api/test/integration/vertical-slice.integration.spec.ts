import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { createHash } from 'node:crypto';
import request = require('supertest');
import { AppModule } from '../../src/app.module';
import { ApiErrorFilter } from '../../src/common/error.filter';
import { ResponseInterceptor } from '../../src/common/response.interceptor';
import { PrismaService } from '../../src/database/prisma.service';
import { WalletService } from '../../src/wallet/wallet.service';
import { OtpService } from '../../src/otp/otp.service';
import { normalizePhone } from '../../src/common/normalize';

jest.setTimeout(30_000);

type HttpResponse<T = any> = { body: { data: T; error: { code: string } | null }; headers: Record<string, string | string[]>; status: number };

describe('ZENX GO vertical slice (SQL Server)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let walletService: WalletService;
  let otpService: OtpService;
  let cookies = '';
  let userId = '';
  let email = '';
  let phone = '';

  beforeAll(async () => {
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
    walletService = app.get(WalletService);
    otpService = app.get(OtpService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers with OTP proof, starts a zero-balance wallet, and never returns password hash', async () => {
    const suffix = Date.now().toString();
    email = `slice-${suffix}@example.com`;
    phone = `+849${suffix.slice(-8)}`;
    const username = `slice${suffix.slice(-8)}`;
    const verificationToken = await verifyOtp(phone, 'VERIFY_PHONE');
    const response = await http().post('/auth/register').send({
      username, email, phone, password: 'Password123!', fullName: 'Slice Player', verificationToken,
      dateOfBirth: '2000-01-01', gender: 'MALE', city: 'Ho Chi Minh City', acceptTerms: true, acceptPrivacy: true,
    });
    expect(response.status).toBe(201);
    expect(response.body.data.user.passwordHash).toBeUndefined();
    expect(response.body.data.user.id).toBeTruthy();
    userId = response.body.data.user.id;
    cookies = cookieHeader(response);

    const wallet = await http().get('/wallet').set('Cookie', cookies);
    expect(wallet.body.data).toMatchObject({ currency: 'ZENX', balance: '0' });
  });

  it('rejects an OTP proof reused for a different normalized destination', async () => {
    const otherPhone = `+849${(Number(phone.slice(-8)) + 1).toString().padStart(8, '0')}`;
    const token = await verifyOtp(phone, 'VERIFY_PHONE');
    const response = await http().post('/auth/register').send({
      username: `wrong${Date.now()}`, email: `wrong-${Date.now()}@example.com`, phone: otherPhone,
      password: 'Password123!', fullName: 'Wrong Destination', verificationToken: token,
      dateOfBirth: '2000-01-01', gender: 'OTHER', city: 'Hanoi', acceptTerms: true, acceptPrivacy: true,
    });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VERIFICATION_TOKEN_INVALID');
  });

  it('consumes verification tokens once and rejects expired OTP requests', async () => {
    const reusablePhone = `+849${(Number(phone.slice(-8)) + 2).toString().padStart(8, '0')}`;
    const token = await verifyOtp(reusablePhone, 'VERIFY_PHONE');
    await expect(otpService.consumeVerificationToken(token, 'VERIFY_PHONE', reusablePhone)).resolves.toBeTruthy();
    await expect(otpService.consumeVerificationToken(token, 'VERIFY_PHONE', reusablePhone)).rejects.toMatchObject({ code: 'VERIFICATION_TOKEN_INVALID' });

    const expiredPhone = `+849${(Number(phone.slice(-8)) + 3).toString().padStart(8, '0')}`;
    await http().post('/otp/send').send({ channel: 'SMS', purpose: 'VERIFY_PHONE', destination: expiredPhone });
    await prisma.otpRequest.updateMany({ where: { destinationNormalized: normalizePhone(expiredPhone), purpose: 'VERIFY_PHONE', status: 'PENDING' }, data: { expiresAt: new Date(Date.now() - 1000) } });
    const response = await http().post('/otp/verify').send({ channel: 'SMS', purpose: 'VERIFY_PHONE', destination: expiredPhone, code: '123456' });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('OTP_EXPIRED');
  });

  it('rotates refresh sessions and rejects concurrent replay of the old refresh cookie', async () => {
    const login = await http().post('/auth/login').send({ username: (await prisma.user.findUniqueOrThrow({ where: { id: userId } })).username, password: 'Password123!' });
    const oldRefresh = cookieHeader(login).split('; ').find((item) => item.startsWith('zenx_refresh='));
    expect(oldRefresh).toBeTruthy();
    const [first, second] = await Promise.all([
      http().post('/auth/refresh').set('Cookie', oldRefresh!),
      http().post('/auth/refresh').set('Cookie', oldRefresh!),
    ]);
    expect([first.status, second.status].sort()).toEqual([201, 401]);
    const successful = first.status === 201 ? first : second;
    expect(cookieHeader(successful)).toContain('zenx_refresh=');
  });

  it('credits one TOPUP for duplicate callbacks and serializes all monetary values as strings', async () => {
    const packages = await http().get('/coin-packages');
    const selected = packages.body.data[0];
    const created = await http().post('/payments').set('Cookie', cookies).send({ coinPackageId: selected.id, paymentMethod: 'QR' });
    const payment = created.body.data;
    const payload = { providerTransactionId: payment.providerTransactionId, paymentNo: payment.paymentNo, status: 'SUCCESS', signature: 'ignored' };
    const rawBody = JSON.stringify(payload);
    const signature = createHash('sha256').update(rawBody).digest('hex');
    const callback = () => http().post('/payments/mock/callback').set('Origin', 'http://localhost:3000').set('x-payment-signature', signature).set('Content-Type', 'application/json').send(rawBody);
    const [first, second] = await Promise.all([callback(), callback()]);
    expect([first.status, second.status].every((status) => status === 201)).toBe(true);
    const wallet = await http().get('/wallet').set('Cookie', cookies);
    expect(wallet.body.data.balance).toBe(String(selected.coinAmount));
    const transactions = await http().get('/wallet/transactions').set('Cookie', cookies);
    expect(transactions.body.data.items).toHaveLength(1);
    expect(typeof transactions.body.data.items[0].amount).toBe('string');
    expect(typeof transactions.body.data.items[0].createdAt).toBe('string');
  });

  it('allows only one of two concurrent debits and keeps ledger balance non-negative', async () => {
    await walletService.credit(userId, { amount: 1000n, referenceType: 'TEST', referenceId: `credit-${Date.now()}`, idempotencyKey: `credit:${Date.now()}` });
    const results = await Promise.allSettled([
      walletService.debit(userId, { amount: 700n, referenceType: 'TEST', referenceId: `debit-a-${Date.now()}` }),
      walletService.debit(userId, { amount: 700n, referenceType: 'TEST', referenceId: `debit-b-${Date.now()}` }),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId } });
    expect(wallet.balance).toBe(500n);
    expect(wallet.balance >= 0n).toBe(true);
  });

  it('does not top up a payment that already reached FAILED', async () => {
    const packages = await http().get('/coin-packages');
    const created = await http().post('/payments').set('Cookie', cookies).send({ coinPackageId: packages.body.data[1].id, paymentMethod: 'REDIRECT' });
    const payment = created.body.data;
    const failed = { providerTransactionId: payment.providerTransactionId, paymentNo: payment.paymentNo, status: 'FAILED', signature: 'ignored' };
    const failedRaw = JSON.stringify(failed);
    const failedSignature = createHash('sha256').update(failedRaw).digest('hex');
    await http().post('/payments/mock/callback').set('x-payment-signature', failedSignature).set('Content-Type', 'application/json').send(failedRaw);
    const success = { ...failed, status: 'SUCCESS' };
    const successRaw = JSON.stringify(success);
    const successSignature = createHash('sha256').update(successRaw).digest('hex');
    const response = await http().post('/payments/mock/callback').set('x-payment-signature', successSignature).set('Content-Type', 'application/json').send(successRaw);
    expect(response.body.data.status).toBe('FAILED');
    const wallet = await http().get('/wallet').set('Cookie', cookies);
    expect(wallet.body.data.balance).toBe('500');
  });

  async function verifyOtp(destination: string, purpose: string) {
    const sent = await http().post('/otp/send').send({ channel: 'SMS', purpose, destination });
    expect(sent.status).toBe(201);
    const verified = await http().post('/otp/verify').send({ channel: 'SMS', purpose, destination, code: process.env.OTP_MOCK_FIXED_CODE ?? '123456' });
    expect(verified.status).toBe(201);
    return verified.body.data.verificationToken as string;
  }

  function http() {
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
