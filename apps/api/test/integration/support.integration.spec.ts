import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import request = require('supertest');
import { AppModule } from '../../src/app.module';
import { ApiErrorFilter } from '../../src/common/error.filter';
import { ResponseInterceptor } from '../../src/common/response.interceptor';

jest.setTimeout(30_000);

describe('Support API (SQL Server)', () => {
  let app: INestApplication;
  let sequence = 0;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves active FAQs and creates private, paginated tickets', async () => {
    const faqs = await http().get('/support/faqs');
    expect(faqs.status).toBe(200);
    expect(faqs.body.data.categories.length).toBeGreaterThanOrEqual(4);
    expect(faqs.body.data.categories.every((category: { faqs: unknown[] }) => category.faqs.length > 0)).toBe(true);

    const unauthenticated = await http().post('/support/tickets').send({
      categoryId: faqs.body.data.categories[0].id,
      subject: 'Yêu cầu chưa đăng nhập',
      description: 'Nội dung này phải yêu cầu đăng nhập.',
    });
    expect(unauthenticated.status).toBe(401);

    const firstUser = await register();
    const categoryId = faqs.body.data.categories[0].id as string;
    const invalidCategory = await http().post('/support/tickets').set('Cookie', firstUser.cookies).send({
      categoryId: '00000000-0000-4000-8000-000000000001',
      subject: 'Danh mục không tồn tại',
      description: 'Nội dung kiểm tra danh mục không tồn tại.',
    });
    expect(invalidCategory.status).toBe(400);
    expect(invalidCategory.body.error.code).toBe('SUPPORT_CATEGORY_NOT_FOUND');

    const tooLong = await http().post('/support/tickets').set('Cookie', firstUser.cookies).send({
      categoryId,
      subject: 'Mô tả quá dài',
      description: 'x'.repeat(4001),
    });
    expect(tooLong.status).toBe(400);

    const created = await http().post('/support/tickets').set('Cookie', firstUser.cookies).send({
      categoryId,
      subject: 'Không thể nạp Coin',
      description: 'Tôi đã thanh toán nhưng số dư chưa được cập nhật.',
    });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ status: 'NEW', category: { id: categoryId } });
    expect(created.body.data.ticketNo).toMatch(/^ZSUP-\d{8}-[A-F0-9]{8}$/);
    expect(created.body.data.userId).toBeUndefined();
    expect(created.body.data.categoryId).toBeUndefined();

    const list = await http().get('/support/tickets?page=1&pageSize=10').set('Cookie', firstUser.cookies);
    expect(list.status).toBe(200);
    expect(list.body.data).toMatchObject({ page: 1, pageSize: 10, total: 1, totalPages: 1 });
    expect(list.body.data.items[0].ticketNo).toBe(created.body.data.ticketNo);

    const detail = await http().get(`/support/tickets/${created.body.data.ticketNo}`).set('Cookie', firstUser.cookies);
    expect(detail.status).toBe(200);
    expect(detail.body.data.description).toContain('thanh toán');

    const secondUser = await register();
    const otherUserDetail = await http().get(`/support/tickets/${created.body.data.ticketNo}`).set('Cookie', secondUser.cookies);
    expect(otherUserDetail.status).toBe(404);
    expect(otherUserDetail.body.error.code).toBe('SUPPORT_TICKET_NOT_FOUND');
  });

  async function register() {
    sequence += 1;
    const suffix = `${Date.now()}${sequence}`;
    const phone = `+849${suffix.slice(-8)}`;
    const username = `support${suffix.slice(-12)}`;
    const email = `support-${suffix}@example.com`;
    const sent = await http().post('/otp/send').send({ channel: 'SMS', purpose: 'VERIFY_PHONE', destination: phone });
    expect(sent.status).toBe(201);
    const verified = await http().post('/otp/verify').send({
      channel: 'SMS', purpose: 'VERIFY_PHONE', destination: phone, code: process.env.OTP_MOCK_FIXED_CODE ?? '123456',
    });
    expect(verified.status).toBe(201);
    const registered = await http().post('/auth/register').send({
      username, email, phone, password: 'Password123!', verificationToken: verified.body.data.verificationToken,
      acceptTerms: true, acceptPrivacy: true,
    });
    expect(registered.status).toBe(201);
    return { cookies: cookieHeader(registered) };
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
