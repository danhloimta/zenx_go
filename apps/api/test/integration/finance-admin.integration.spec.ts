import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import request = require('supertest');
import { AppModule } from '../../src/app.module';
import { ApiErrorFilter } from '../../src/common/error.filter';
import { ResponseInterceptor } from '../../src/common/response.interceptor';
import { PrismaService } from '../../src/database/prisma.service';

jest.setTimeout(30_000);
let activeApp: INestApplication;

describe('Finance admin API (SQL Server)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminCookies = '';
  let memberCookies = '';
  let memberId = '';
  let adminEmail = '';
  let memberEmail = '';
  const adminPassword = 'FinanceAdmin123!';
  const memberPassword = 'FinanceMember123!';

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
    activeApp = app;
    prisma = app.get(PrismaService);

    const suffix = Date.now();
    adminEmail = `finance-admin-${suffix}@example.com`;
    memberEmail = `finance-member-${suffix}@example.com`;
    const admin = await prisma.user.create({
      data: {
        username: `financeadmin${suffix}`,
        usernameNormalized: `financeadmin${suffix}`,
        email: adminEmail,
        emailNormalized: adminEmail,
        passwordHash: await argon2.hash(adminPassword),
        status: 'ACTIVE',
        profile: { create: { fullName: 'Finance Admin', gender: 'UNSPECIFIED', termsVersion: 'test', privacyVersion: 'test', acceptedAt: new Date() } },
        wallet: { create: { currency: 'ZENX', balance: 0n } },
      },
    });
    await prisma.userRole.create({ data: { userId: admin.id, role: 'SUPER_ADMIN' } });
    const member = await prisma.user.create({
      data: {
        username: `financemember${suffix}`,
        usernameNormalized: `financemember${suffix}`,
        email: memberEmail,
        emailNormalized: memberEmail,
        passwordHash: await argon2.hash(memberPassword),
        status: 'ACTIVE',
        profile: { create: { fullName: 'Finance Member', gender: 'UNSPECIFIED', termsVersion: 'test', privacyVersion: 'test', acceptedAt: new Date() } },
        wallet: { create: { currency: 'ZENX', balance: 0n } },
      },
    });
    memberId = member.id;
    adminCookies = cookieHeader(await http().post('/auth/login').send({ username: adminEmail, password: adminPassword }));
    memberCookies = cookieHeader(await http().post('/auth/login').send({ username: memberEmail, password: memberPassword }));
  });

  afterAll(async () => { await app.close(); });

  it('limits finance endpoints to SUPER_ADMIN and manages package lifecycle safely', async () => {
    const forbidden = await http().get('/admin/finance/dashboard').set('Cookie', memberCookies);
    expect(forbidden.status).toBe(403);

    const code = `TEST_${Date.now()}`;
    const created = await http().post('/admin/finance/coin-packages').set('Cookie', adminCookies).send({ code, name: 'Finance Test', priceVnd: '10000', coinAmount: '500', status: 'ACTIVE', sortOrder: 99 });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ code, status: 'ACTIVE', priceVnd: '10000', coinAmount: '500' });

    const update = await http().patch(`/admin/finance/coin-packages/${created.body.data.id}`).set('Cookie', adminCookies).send({ expectedUpdatedAt: created.body.data.updatedAt, name: 'Finance Test Updated', status: 'INACTIVE' });
    expect(update.status).toBe(200);
    expect(update.body.data).toMatchObject({ name: 'Finance Test Updated', status: 'INACTIVE' });

    const stale = await http().patch(`/admin/finance/coin-packages/${created.body.data.id}`).set('Cookie', adminCookies).send({ expectedUpdatedAt: created.body.data.updatedAt, name: 'Stale' });
    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe('FINANCE_STALE_UPDATE');

    const deleted = await http().delete(`/admin/finance/coin-packages/${created.body.data.id}`).set('Cookie', adminCookies);
    expect(deleted.status).toBe(200);
    expect(deleted.body.data.deleted).toBe(true);
  });

  it('confirms and refunds payment atomically, and makes wallet adjustments idempotent', async () => {
    const packageResponse = await http().get('/coin-packages');
    const selected = packageResponse.body.data[0];
    const created = await http().post('/payments').set('Cookie', memberCookies).send({ coinPackageId: selected.id, paymentMethod: 'MOMO' });
    expect(created.status).toBe(201);
    const paymentNo = created.body.data.paymentNo;

    const before = await http().get(`/admin/finance/payments/${paymentNo}`).set('Cookie', adminCookies);
    const confirmed = await http().post(`/admin/finance/payments/${paymentNo}/confirm-success`).set('Cookie', adminCookies).send({ expectedUpdatedAt: before.body.data.updatedAt, providerTransactionId: `manual-${Date.now()}` });
    expect(confirmed.status).toBe(201);
    expect(confirmed.body.data.status).toBe('SUCCESS');
    expect(confirmed.body.data.walletTransactions.some((item: { type: string }) => item.type === 'TOPUP')).toBe(true);

    const walletAfterTopup = await http().get('/wallet').set('Cookie', memberCookies);
    expect(walletAfterTopup.body.data.balance).toBe(String(selected.coinAmount));

    const refund = await http().post(`/admin/finance/payments/${paymentNo}/refund`).set('Cookie', adminCookies).send({ expectedUpdatedAt: confirmed.body.data.updatedAt });
    expect(refund.status).toBe(201);
    expect(refund.body.data.status).toBe('REFUNDED');
    const walletAfterRefund = await http().get('/wallet').set('Cookie', memberCookies);
    expect(walletAfterRefund.body.data.balance).toBe('0');
    const storedPayment = await prisma.payment.findUniqueOrThrow({ where: { paymentNo } });
    const refundTransaction = await prisma.walletTransaction.findFirst({ where: { referenceType: 'PAYMENT_REFUND', referenceId: storedPayment.id }, orderBy: { createdAt: 'desc' } });
    expect(refundTransaction).toBeTruthy();

    const requestId = randomUUID();
    const creditPayload = { clientRequestId: requestId, amount: '1000', note: 'Test adjustment' };
    const [creditA, creditB] = await Promise.all([
      http().post(`/admin/finance/users/${memberId}/wallet/credit`).set('Cookie', adminCookies).send(creditPayload),
      http().post(`/admin/finance/users/${memberId}/wallet/credit`).set('Cookie', adminCookies).send(creditPayload),
    ]);
    expect(creditA.status).toBe(201);
    expect(creditB.status).toBe(201);
    expect(creditA.body.data.transactionNo).toBe(creditB.body.data.transactionNo);
    expect((await http().get('/wallet').set('Cookie', memberCookies)).body.data.balance).toBe('1000');
  });

  it('lists finance data and returns raw CSV export', async () => {
    const dashboard = await http().get('/admin/finance/dashboard').set('Cookie', adminCookies);
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.data.payments).toHaveProperty('byStatus');
    const payments = await http().get('/admin/finance/payments').query({ search: memberEmail }).set('Cookie', adminCookies);
    expect(payments.status).toBe(200);
    expect(payments.body.data.items.length).toBeGreaterThan(0);
    const transactions = await http().get('/admin/finance/transactions').query({ search: memberEmail }).set('Cookie', adminCookies);
    expect(transactions.status).toBe(200);
    const csv = await http().get('/admin/finance/transactions/export').query({ search: memberEmail }).set('Cookie', adminCookies);
    expect(csv.status).toBe(200);
    expect(csv.headers['content-type']).toContain('text/csv');
    expect(csv.text).toContain('transactionNo');
  });
});

function http() {
  return {
    get: (path: string) => request(activeApp.getHttpServer()).get(`/api/v1${path}`).set('Origin', 'http://localhost:3000'),
    post: (path: string) => request(activeApp.getHttpServer()).post(`/api/v1${path}`).set('Origin', 'http://localhost:3000'),
    patch: (path: string) => request(activeApp.getHttpServer()).patch(`/api/v1${path}`).set('Origin', 'http://localhost:3000'),
    delete: (path: string) => request(activeApp.getHttpServer()).delete(`/api/v1${path}`).set('Origin', 'http://localhost:3000'),
  };
}
function cookieHeader(response: { headers: Record<string, string | string[]> }) {
  const value = response.headers['set-cookie'];
  const cookies = Array.isArray(value) ? value : [value];
  return cookies.filter(Boolean).map((cookie) => cookie.split(';')[0]).join('; ');
}
