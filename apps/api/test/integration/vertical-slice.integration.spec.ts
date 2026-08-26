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
      username, email, phone, password: 'Password123!', verificationToken, acceptTerms: true, acceptPrivacy: true,
    });
    expect(response.status).toBe(201);
    expect(response.body.data.user.passwordHash).toBeUndefined();
    expect(response.body.data.user.id).toBeTruthy();
    expect(response.body.data.user.profile.profileCompletedAt).toBeNull();
    userId = response.body.data.user.id;
    cookies = cookieHeader(response);

    const wallet = await http().get('/wallet').set('Cookie', cookies);
    expect(wallet.body.data).toMatchObject({ currency: 'ZENX', balance: '0' });

    const incomplete = await http().get('/account/me').set('Cookie', cookies);
    expect(incomplete.body.data.profile.profileCompletedAt).toBeNull();
    const completed = await http().post('/account/complete-profile').set('Cookie', cookies).send({ fullName: 'Slice Player', dateOfBirth: '2000-01-01', gender: 'MALE', city: 'Ho Chi Minh City', address: '123 Nguyen Hue' });
    expect(completed.body.data.profile).toMatchObject({ fullName: 'Slice Player', city: 'Ho Chi Minh City', address: '123 Nguyen Hue' });
    expect(completed.body.data.profile.profileCompletedAt).toEqual(expect.any(String));
  });

  it('rejects an OTP proof reused for a different normalized destination', async () => {
    const otherPhone = `+849${(Number(phone.slice(-8)) + 1).toString().padStart(8, '0')}`;
    const token = await verifyOtp(phone, 'VERIFY_PHONE');
    const response = await http().post('/auth/register').send({
      username: `wrong${Date.now()}`, email: `wrong-${Date.now()}@example.com`, phone: otherPhone,
      password: 'Password123!', verificationToken: token, acceptTerms: true, acceptPrivacy: true,
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
    const login = await http().post('/auth/login').send({ username: email, password: 'Password123!' });
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
    expect(payment.paymentUrl).toBeNull();
    const payload = { providerTransactionId: payment.providerTransactionId, paymentNo: payment.paymentNo, status: 'SUCCESS' };
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
    expect(transactions.body.data.items[0]).not.toHaveProperty('userId');
    expect(transactions.body.data.items[0]).not.toHaveProperty('walletId');
    expect(transactions.body.data.items[0]).not.toHaveProperty('paymentId');
    expect(transactions.body.data.items[0]).not.toHaveProperty('idempotencyKey');
    const filtered = await http().get('/wallet/transactions').query({ search: 'Top up', from: new Date(Date.now() - 86_400_000).toISOString(), to: new Date(Date.now() + 86_400_000).toISOString() }).set('Cookie', cookies);
    expect(filtered.status).toBe(200);
    expect(filtered.body.data.totalPages).toBeGreaterThanOrEqual(1);
    const csv = await http().get('/wallet/transactions/export').query({ search: 'Top up' }).set('Cookie', cookies);
    expect(csv.status).toBe(200);
    expect(csv.text).toContain('createdAt');
    expect(csv.text).toContain('transactionNo');
  });

  it('allows only one of two concurrent debits and keeps ledger balance non-negative', async () => {
    await walletService.credit(userId, { amount: 1000n, referenceType: 'TEST', referenceId: `credit-${Date.now()}`, idempotencyKey: `credit:${Date.now()}` });
    const results = await Promise.allSettled([
      walletService.debit(userId, { amount: 1500n, referenceType: 'TEST', referenceId: `debit-a-${Date.now()}` }),
      walletService.debit(userId, { amount: 1500n, referenceType: 'TEST', referenceId: `debit-b-${Date.now()}` }),
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
    const failed = { providerTransactionId: payment.providerTransactionId, paymentNo: payment.paymentNo, status: 'FAILED' };
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

  it('requires the callback signature header and expires pending payments without crediting them', async () => {
    const packages = await http().get('/coin-packages');
    const created = await http().post('/payments').set('Cookie', cookies).send({ coinPackageId: packages.body.data[2].id, paymentMethod: 'MOMO' });
    const payment = created.body.data;
    const payload = { providerTransactionId: payment.providerTransactionId, paymentNo: payment.paymentNo, status: 'SUCCESS' };
    const rawBody = JSON.stringify(payload);
    const signature = createHash('sha256').update(rawBody).digest('hex');
    const withoutHeader = await http().post('/payments/mock/callback').set('Content-Type', 'application/json').send(rawBody);
    expect(withoutHeader.status).toBe(400);
    expect(withoutHeader.body.error.code).toBe('INVALID_PAYMENT_CALLBACK');

    await prisma.payment.update({ where: { paymentNo: payment.paymentNo }, data: { expiredAt: new Date(Date.now() - 1_000) } });
    const expired = await http().get(`/payments/${payment.paymentNo}`).set('Cookie', cookies);
    expect(expired.status).toBe(200);
    expect(expired.body.data.status).toBe('EXPIRED');
    expect(expired.body.data.paymentUrl).toBeNull();

    const callback = await http().post('/payments/mock/callback').set('x-payment-signature', signature).set('Content-Type', 'application/json').send(rawBody);
    expect(callback.status).toBe(201);
    expect(callback.body.data.status).toBe('EXPIRED');
    const topups = await prisma.walletTransaction.count({ where: { userId, paymentId: (await prisma.payment.findUniqueOrThrow({ where: { paymentNo: payment.paymentNo } })).id } });
    expect(topups).toBe(0);
  });

  it('reuses a payment idempotency key and does not expose payment storage identifiers', async () => {
    const packages = await http().get('/coin-packages');
    const idempotencyKey = `payment-idempotency-${Date.now()}`;
    const input = { coinPackageId: packages.body.data[0].id, paymentMethod: 'MOMO', idempotencyKey };
    const first = await http().post('/payments').set('Cookie', cookies).send(input);
    const second = await http().post('/payments').set('Cookie', cookies).send(input);
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body.data.paymentNo).toBe(first.body.data.paymentNo);
    expect(first.body.data).not.toHaveProperty('id');
    expect(first.body.data).not.toHaveProperty('userId');
    expect(first.body.data).not.toHaveProperty('coinPackageId');
    expect(first.body.data).not.toHaveProperty('idempotencyKey');
    await expect(prisma.payment.count({ where: { userId, idempotencyKey } })).resolves.toBe(1);

    const concurrentKey = `payment-idempotency-concurrent-${Date.now()}`;
    const concurrentInput = { ...input, idempotencyKey: concurrentKey };
    const [concurrentA, concurrentB] = await Promise.all([
      http().post('/payments').set('Cookie', cookies).send(concurrentInput),
      http().post('/payments').set('Cookie', cookies).send(concurrentInput),
    ]);
    expect(concurrentA.status).toBe(201);
    expect(concurrentB.status).toBe(201);
    expect(concurrentB.body.data.paymentNo).toBe(concurrentA.body.data.paymentNo);
    await expect(prisma.payment.count({ where: { userId, idempotencyKey: concurrentKey } })).resolves.toBe(1);
  });

  it('keeps transaction pagination deterministic across pages', async () => {
    for (let index = 0; index < 11; index += 1) {
      await walletService.credit(userId, {
        amount: 1n,
        referenceType: 'PAGINATION_TEST',
        referenceId: `pagination-${Date.now()}-${index}`,
        idempotencyKey: `pagination:${Date.now()}:${index}`,
      });
    }
    const firstPage = await http().get('/wallet/transactions').query({ page: 1, pageSize: 10 }).set('Cookie', cookies);
    const secondPage = await http().get('/wallet/transactions').query({ page: 2, pageSize: 10 }).set('Cookie', cookies);
    expect(firstPage.body.data.totalPages).toBeGreaterThanOrEqual(2);
    expect(firstPage.body.data.items).toHaveLength(10);
    expect(secondPage.body.data.items.length).toBeGreaterThan(0);
    const firstNos = new Set(firstPage.body.data.items.map((item: { transactionNo: string }) => item.transactionNo));
    expect(secondPage.body.data.items.some((item: { transactionNo: string }) => firstNos.has(item.transactionNo))).toBe(false);
  });

  it('exposes truthful security flags and supports profile, contact, avatar, and password changes', async () => {
    const initial = await http().get('/account/me').set('Cookie', cookies);
    expect(initial.body.data).toMatchObject({ hasPassword: true, emailVerifiedAt: null });
    expect(initial.body.data.phoneVerifiedAt).toEqual(expect.any(String));

    const invalidProfile = await http().patch('/account/me').set('Cookie', cookies).send({ fullName: ' ' });
    expect(invalidProfile.status).toBe(400);

    const profile = await http().patch('/account/me').set('Cookie', cookies).send({ fullName: 'Updated Slice Player', city: 'Da Nang', address: '1 Bach Dang' });
    expect(profile.status).toBe(200);
    expect(profile.body.data.profile).toMatchObject({ fullName: 'Updated Slice Player', city: 'Da Nang', address: '1 Bach Dang' });

    const emailVerificationToken = await verifyOtp(email, 'CHANGE_EMAIL', 'EMAIL');
    const emailVerification = await http().post('/account/change-email').set('Cookie', cookies).send({ newEmail: email, verificationToken: emailVerificationToken });
    expect(emailVerification.status).toBe(201);
    const verifiedAccount = await http().get('/account/me').set('Cookie', cookies);
    expect(verifiedAccount.body.data.emailVerifiedAt).toEqual(expect.any(String));

    const invalidAvatar = await request(app.getHttpServer())
      .post('/api/v1/account/avatar')
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', cookies)
      .attach('file', Buffer.from('not-an-image'), { filename: 'avatar.png', contentType: 'image/png' });
    expect(invalidAvatar.status).toBe(400);
    expect(invalidAvatar.body.error.code).toBe('INVALID_AVATAR');

    const validAvatar = await request(app.getHttpServer())
      .post('/api/v1/account/avatar')
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', cookies)
      .attach('file', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), { filename: 'avatar.png', contentType: 'image/png' });
    expect(validAvatar.status).toBe(201);
    expect(validAvatar.body.data.avatarUrl).toMatch(/^\/uploads\/avatars\/.+\.png$/);

    const newEmail = `updated-${Date.now()}@example.com`;
    const emailToken = await verifyOtp(newEmail, 'CHANGE_EMAIL', 'EMAIL');
    const emailChange = await http().post('/account/change-email').set('Cookie', cookies).send({ newEmail, verificationToken: emailToken });
    expect(emailChange.status).toBe(201);
    const newPhone = `+849${(Number(phone.slice(-8)) + 10).toString().padStart(8, '0')}`;
    const phoneToken = await verifyOtp(newPhone, 'CHANGE_PHONE');
    const phoneChange = await http().post('/account/change-phone').set('Cookie', cookies).send({ newPhone, verificationToken: phoneToken });
    expect(phoneChange.status).toBe(201);

    const weakPassword = await http().post('/account/change-password').set('Cookie', cookies).send({ currentPassword: 'Password123!', newPassword: 'weakpassword' });
    expect(weakPassword.status).toBe(400);
    const wrongPassword = await http().post('/account/change-password').set('Cookie', cookies).send({ currentPassword: 'wrong-password', newPassword: 'NewPassword123!' });
    expect(wrongPassword.status).toBe(401);
    const changed = await http().post('/account/change-password').set('Cookie', cookies).send({ currentPassword: 'Password123!', newPassword: 'NewPassword123!' });
    expect(changed.status).toBe(201);
    const revokedRefresh = await http().post('/auth/refresh').set('Cookie', cookies);
    expect(revokedRefresh.status).toBe(401);

    const oldLogin = await http().post('/auth/login').send({ username: email, password: 'Password123!' });
    expect(oldLogin.status).toBe(401);
    const newLogin = await http().post('/auth/login').send({ username: newEmail, password: 'NewPassword123!' });
    expect(newLogin.status).toBe(201);
  });

  it('unlinks an existing social identity through the authenticated account endpoint', async () => {
    const providerUserId = `integration-google-${Date.now()}`;
    await prisma.socialIdentity.create({ data: { userId, provider: 'GOOGLE', providerUserId } });
    const response = await http().delete('/account/social/google').set('Cookie', cookies);
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ unlinked: true });
    await expect(prisma.socialIdentity.findUnique({ where: { provider_providerUserId: { provider: 'GOOGLE', providerUserId } } })).resolves.toBeNull();

    await prisma.user.update({ where: { id: userId }, data: { passwordHash: null } });
    const passwordSetup = await http().post('/account/change-password').set('Cookie', cookies).send({ newPassword: 'SocialOnly123!' });
    expect(passwordSetup.status).toBe(201);
    const account = await http().get('/account/me').set('Cookie', cookies);
    expect(account.body.data.hasPassword).toBe(true);
  });

  it('does not expose a fake OAuth adapter when a provider is not configured', async () => {
    const start = await http().get('/auth/google');
    expect(start.status).toBe(302);
    expect(start.headers.location).toContain('social_error=not_configured');

    const callback = await http().get('/auth/google/callback?state=tampered&code=unused');
    expect(callback.status).toBe(302);
    expect(callback.headers.location).toContain('social_error=invalid_state');

    const invalidProvider = await http().delete('/account/social/twitter').set('Cookie', cookies);
    expect(invalidProvider.status).toBe(400);
    expect(invalidProvider.body.error.code).toBe('INVALID_SOCIAL_PROVIDER');
  });

  it('rejects account requests after an account is locked even when the access token has not expired', async () => {
    await prisma.user.update({ where: { id: userId }, data: { status: 'LOCKED' } });
    const response = await http().get('/account/me').set('Cookie', cookies);
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
    await prisma.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } });
  });

  async function verifyOtp(destination: string, purpose: string, channel: 'SMS' | 'EMAIL' = 'SMS') {
    const sent = await http().post('/otp/send').send({ channel, purpose, destination });
    expect(sent.status).toBe(201);
    const verified = await http().post('/otp/verify').send({ channel, purpose, destination, code: process.env.OTP_MOCK_FIXED_CODE ?? '123456' });
    expect(verified.status).toBe(201);
    return verified.body.data.verificationToken as string;
  }

  function http() {
    return {
      get: (path: string) => request(app.getHttpServer()).get(`/api/v1${path}`).set('Origin', 'http://localhost:3000'),
      post: (path: string) => request(app.getHttpServer()).post(`/api/v1${path}`).set('Origin', 'http://localhost:3000'),
      patch: (path: string) => request(app.getHttpServer()).patch(`/api/v1${path}`).set('Origin', 'http://localhost:3000'),
      delete: (path: string) => request(app.getHttpServer()).delete(`/api/v1${path}`).set('Origin', 'http://localhost:3000'),
    };
  }
  function cookieHeader(response: { headers: Record<string, string | string[]> }) {
    const setCookie = response.headers['set-cookie'];
    return (Array.isArray(setCookie) ? setCookie : [setCookie]).map((cookie) => cookie.split(';')[0]).join('; ');
  }
});
