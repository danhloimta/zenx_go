import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import request = require('supertest');
import * as argon2 from 'argon2';
import { AppModule } from '../../src/app.module';
import { ApiErrorFilter } from '../../src/common/error.filter';
import { ResponseInterceptor } from '../../src/common/response.interceptor';
import { PrismaService } from '../../src/database/prisma.service';

jest.setTimeout(30_000);

describe('Support admin API (SQL Server)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let memberCookies = '';
  let memberId = '';
  let supportCookies = '';
  let secondSupportCookies = '';
  let ticketNo = '';
  let supportId = '';
  let categoryId = '';
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10_000)}`;
  const memberEmail = `support-member-${suffix}@example.com`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ rawBody: true });
    const config = app.get(ConfigService);
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1');
    app.enableCors({ origin: config.getOrThrow<string>('webOrigin'), credentials: true });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidUnknownValues: true }),
    );
    app.useGlobalFilters(new ApiErrorFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
    prisma = app.get(PrismaService);
    const member = await registerMember();
    memberId = member.id;
    memberCookies = member.cookies;
    const support = await createSupportUser('support-agent');
    supportId = support.id;
    supportCookies = await login(support.email, support.password);
    const second = await createSupportUser('support-agent-two');
    secondSupportCookies = await login(second.email, second.password);
    const faqs = await http().get('/support/faqs');
    categoryId = faqs.body.data.categories[0].id;
    const created = await http().post('/support/tickets').set('Cookie', memberCookies).send({
      categoryId,
      subject: 'Cần hỗ trợ từ support admin',
      description: 'Nội dung ticket dùng để kiểm tra quy trình support hai chiều.',
    });
    expect(created.status).toBe(201);
    ticketNo = created.body.data.ticketNo;
  });

  afterAll(async () => {
    await app.close();
  });

  it('limits SUPPORT to support surfaces and exposes queue/dashboard', async () => {
    const me = await http().get('/admin/me').set('Cookie', supportCookies);
    expect(me.status).toBe(200);
    expect(me.body.data.roles).toContain('SUPPORT');
    const dashboard = await http().get('/admin/support/dashboard').set('Cookie', supportCookies);
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.data.tickets.unassigned).toBeGreaterThanOrEqual(1);
    const queue = await http().get('/admin/support/tickets').set('Cookie', supportCookies);
    expect(queue.status).toBe(200);
    expect(
      queue.body.data.items.some((item: { ticketNo: string }) => item.ticketNo === ticketNo),
    ).toBe(true);
    const userManagement = await http().get('/admin/users').set('Cookie', supportCookies);
    expect(userManagement.status).toBe(403);
    expect(userManagement.body.error.code).toBe('ADMIN_ACCESS_REQUIRED');
    const audit = await http().get('/admin/audit-logs').set('Cookie', supportCookies);
    expect(audit.status).toBe(403);
  });

  it('claims, reassigns, replies, hides internal notes, and tracks unread state', async () => {
    const initial = await http()
      .get(`/admin/support/tickets/${ticketNo}`)
      .set('Cookie', supportCookies);
    const claimed = await http()
      .post(`/admin/support/tickets/${ticketNo}/claim`)
      .set('Cookie', supportCookies)
      .send({
        expectedUpdatedAt: initial.body.data.updatedAt,
        reason: 'Nhận ticket để xử lý',
      });
    expect(claimed.status).toBe(201);
    expect(claimed.body.data).toMatchObject({ assigneeUserId: supportId, status: 'IN_PROGRESS' });

    const secondClaim = await http()
      .post(`/admin/support/tickets/${ticketNo}/claim`)
      .set('Cookie', secondSupportCookies)
      .send({
        expectedUpdatedAt: initial.body.data.updatedAt,
        reason: 'Thử nhận ticket đã có người',
      });
    expect(secondClaim.status).toBe(409);
    expect(['SUPPORT_TICKET_ASSIGNED_TO_ANOTHER', 'STALE_ADMIN_UPDATE']).toContain(
      secondClaim.body.error.code,
    );

    const publicReply = await http()
      .post(`/admin/support/tickets/${ticketNo}/messages`)
      .set('Cookie', supportCookies)
      .send({
        visibility: 'PUBLIC',
        body: 'Đội hỗ trợ đã tiếp nhận yêu cầu của bạn.',
        expectedUpdatedAt: claimed.body.data.updatedAt,
      });
    expect(publicReply.status).toBe(201);
    const memberMessages = await http()
      .get(`/support/tickets/${ticketNo}/messages`)
      .set('Cookie', memberCookies);
    expect(
      memberMessages.body.data.items.some((item: { body: string }) =>
        item.body.includes('đã tiếp nhận'),
      ),
    ).toBe(true);
    expect(
      memberMessages.body.data.items.some((item: { body: string }) =>
        item.body.includes('Nội dung ticket dùng để kiểm tra'),
      ),
    ).toBe(true);
    const unread = await http().get('/support/unread-count').set('Cookie', memberCookies);
    expect(unread.body.data.count).toBeGreaterThanOrEqual(1);

    const afterPublic = await http()
      .get(`/admin/support/tickets/${ticketNo}`)
      .set('Cookie', supportCookies);
    const internal = await http()
      .post(`/admin/support/tickets/${ticketNo}/messages`)
      .set('Cookie', secondSupportCookies)
      .send({
        visibility: 'INTERNAL',
        body: 'Ghi chú nội bộ không được hiển thị cho user.',
        expectedUpdatedAt: afterPublic.body.data.updatedAt,
      });
    expect(internal.status).toBe(201);
    const hidden = await http()
      .get(`/support/tickets/${ticketNo}/messages`)
      .set('Cookie', memberCookies);
    expect(
      hidden.body.data.items.some((item: { body: string }) => item.body.includes('Ghi chú nội bộ')),
    ).toBe(false);

    const afterInternal = await http()
      .get(`/admin/support/tickets/${ticketNo}`)
      .set('Cookie', secondSupportCookies);
    const memberReply = await http()
      .post(`/support/tickets/${ticketNo}/messages`)
      .set('Cookie', memberCookies)
      .send({
        body: 'Tôi bổ sung thêm thông tin cho yêu cầu này.',
      });
    expect(memberReply.status).toBe(201);
    const afterReply = await http()
      .get(`/admin/support/tickets/${ticketNo}`)
      .set('Cookie', secondSupportCookies);
    expect(afterReply.body.data.status).toBe('IN_PROGRESS');
    expect(afterReply.body.data.messages.length).toBeGreaterThan(
      afterInternal.body.data.messages.length,
    );
  });

  it('enforces workflow transitions, reopen window, and closed tickets', async () => {
    const current = await http()
      .get(`/admin/support/tickets/${ticketNo}`)
      .set('Cookie', supportCookies);
    const resolved = await http()
      .patch(`/admin/support/tickets/${ticketNo}`)
      .set('Cookie', supportCookies)
      .send({
        expectedUpdatedAt: current.body.data.updatedAt,
        status: 'RESOLVED',
        reason: 'Đã xử lý xong yêu cầu',
      });
    expect(resolved.status).toBe(200);
    const reopened = await http()
      .post(`/support/tickets/${ticketNo}/messages`)
      .set('Cookie', memberCookies)
      .send({ body: 'Tôi phản hồi trong thời hạn mở lại.' });
    expect(reopened.status).toBe(201);
    const resolvedAgain = await http()
      .get(`/admin/support/tickets/${ticketNo}`)
      .set('Cookie', supportCookies);
    const resolvedAgainUpdate = await http()
      .patch(`/admin/support/tickets/${ticketNo}`)
      .set('Cookie', supportCookies)
      .send({
        expectedUpdatedAt: resolvedAgain.body.data.updatedAt,
        status: 'RESOLVED',
        reason: 'Đóng xử lý lần hai',
      });
    expect(resolvedAgainUpdate.status).toBe(200);
    await prisma.supportTicket.update({
      where: { ticketNo },
      data: { resolvedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
    });
    const expired = await http()
      .post(`/support/tickets/${ticketNo}/messages`)
      .set('Cookie', memberCookies)
      .send({ body: 'Phản hồi sau thời hạn mở lại.' });
    expect(expired.status).toBe(409);
    expect(expired.body.error.code).toBe('SUPPORT_TICKET_REOPEN_EXPIRED');
    const expiredState = await http()
      .get(`/admin/support/tickets/${ticketNo}`)
      .set('Cookie', supportCookies);
    const stale = await http()
      .patch(`/admin/support/tickets/${ticketNo}`)
      .set('Cookie', supportCookies)
      .send({
        expectedUpdatedAt: expiredState.body.data.updatedAt,
        status: 'CLOSED',
        reason: 'Đóng ticket đã xử lý',
      });
    expect(stale.status).toBe(200);
    const closedReply = await http()
      .post(`/support/tickets/${ticketNo}/messages`)
      .set('Cookie', memberCookies)
      .send({ body: 'Không thể gửi vào ticket đã đóng.' });
    expect(closedReply.status).toBe(409);
    expect(closedReply.body.error.code).toBe('SUPPORT_TICKET_CLOSED');
  });

  it('manages FAQ with safe Markdown and preserves audit metadata boundaries', async () => {
    const createdCategory = await http()
      .post('/admin/support/categories')
      .set('Cookie', supportCookies)
      .send({
        code: `PHASE2_${suffix.slice(-6)}`,
        name: 'Phase 2 Support',
        status: 'ACTIVE',
        sortOrder: 99,
        reason: 'Tạo danh mục kiểm thử',
      });
    expect(createdCategory.status).toBe(201);
    const createdFaq = await http().post('/admin/support/faqs').set('Cookie', supportCookies).send({
      categoryId: createdCategory.body.data.id,
      question: 'FAQ Markdown?',
      answer: 'Dùng **in đậm** và [liên kết](https://example.com).',
      status: 'ACTIVE',
      sortOrder: 1,
      reason: 'Tạo FAQ kiểm thử',
    });
    expect(createdFaq.status).toBe(201);
    const invalid = await http().post('/admin/support/faqs').set('Cookie', supportCookies).send({
      categoryId: createdCategory.body.data.id,
      question: 'FAQ nguy hiểm?',
      answer: '<script>alert(1)</script>',
      status: 'ACTIVE',
      sortOrder: 2,
      reason: 'Kiểm tra sanitizer',
    });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('SUPPORT_INVALID_MARKDOWN');
    const publicFaqs = await http().get('/support/faqs');
    expect(
      publicFaqs.body.data.categories.find(
        (category: { id: string }) => category.id === createdCategory.body.data.id,
      ).faqs[0].answer,
    ).toContain('**in đậm**');
    const logs = await http()
      .get('/admin/audit-logs')
      .query({ targetId: createdFaq.body.data.id })
      .set('Cookie', supportCookies);
    expect(logs.status).toBe(403);
    const adminLogs = await http().get('/admin/audit-logs').set('Cookie', supportCookies);
    expect(adminLogs.status).toBe(403);
  });

  async function registerMember() {
    const phone = `+849${suffix.slice(-8)}`;
    const sent = await http()
      .post('/otp/send')
      .send({ channel: 'SMS', purpose: 'VERIFY_PHONE', destination: phone });
    expect(sent.status).toBe(201);
    const verified = await http()
      .post('/otp/verify')
      .send({
        channel: 'SMS',
        purpose: 'VERIFY_PHONE',
        destination: phone,
        code: process.env.OTP_MOCK_FIXED_CODE ?? '123456',
      });
    expect(verified.status).toBe(201);
    const registered = await http()
      .post('/auth/register')
      .send({
        username: `supportmember${suffix.slice(-8)}`,
        email: memberEmail,
        phone,
        password: 'MemberPassword123!',
        verificationToken: verified.body.data.verificationToken,
        acceptTerms: true,
        acceptPrivacy: true,
      });
    expect(registered.status).toBe(201);
    return { id: registered.body.data.user.id as string, cookies: cookieHeader(registered) };
  }

  async function createSupportUser(prefix: string) {
    const email = `${prefix}-${suffix}@example.com`;
    const password = 'SupportPassword123!';
    const user = await prisma.user.create({
      data: {
        username: `${prefix}${suffix.slice(-8)}`,
        usernameNormalized: `${prefix}${suffix.slice(-8)}`.toLowerCase(),
        email,
        emailNormalized: email,
        passwordHash: await argon2.hash(password),
        status: 'ACTIVE',
        phone: null,
        phoneNormalized: null,
        profile: {
          create: {
            fullName: prefix,
            gender: 'UNSPECIFIED',
            termsVersion: 'test-2026-01',
            privacyVersion: 'test-2026-01',
            acceptedAt: new Date(),
          },
        },
        wallet: { create: { currency: 'ZENX', balance: 0n } },
      },
    });
    await prisma.userRole.create({ data: { userId: user.id, role: 'SUPPORT' } });
    return { id: user.id, email, password };
  }

  async function login(username: string, password: string) {
    const response = await http().post('/auth/login').send({ username, password });
    expect(response.status).toBe(201);
    return cookieHeader(response);
  }

  function http() {
    return {
      get: (path: string) =>
        request(app.getHttpServer()).get(`/api/v1${path}`).set('Origin', 'http://localhost:3000'),
      post: (path: string) =>
        request(app.getHttpServer()).post(`/api/v1${path}`).set('Origin', 'http://localhost:3000'),
      patch: (path: string) =>
        request(app.getHttpServer()).patch(`/api/v1${path}`).set('Origin', 'http://localhost:3000'),
    };
  }

  function cookieHeader(response: { headers: Record<string, string | string[]> }) {
    const setCookie = response.headers['set-cookie'];
    return (Array.isArray(setCookie) ? setCookie : [setCookie])
      .map((cookie) => cookie.split(';')[0])
      .join('; ');
  }
});
