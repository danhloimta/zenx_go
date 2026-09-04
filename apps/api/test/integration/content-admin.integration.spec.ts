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

describe('Content admin API (SQL Server)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminCookies = '';
  let supportCookies = '';
  let gameId = '';
  let gameSlug = '';
  let originalTagline = '';
  let articleId = '';
  let eventId = '';
  let announcementId = '';
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10_000)}`;
  const adminEmail = `content-admin-${suffix}@example.com`;
  const supportEmail = `content-support-${suffix}@example.com`;

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
    const admin = await createUser('contentadmin', adminEmail, 'SUPER_ADMIN');
    await createUser('contentsupport', supportEmail, 'SUPPORT');
    adminCookies = await login(adminEmail, 'ContentPassword123!');
    supportCookies = await login(supportEmail, 'ContentPassword123!');
    const game = await prisma.game.findFirst({ where: { isPublic: true }, select: { id: true, slug: true, tagline: true } });
    if (!game) throw new Error('Seed game is required');
    gameId = game.id;
    gameSlug = game.slug;
    originalTagline = game.tagline;
  });

  afterAll(async () => {
    if (articleId) await prisma.gameArticle.delete({ where: { id: articleId } });
    if (eventId) await prisma.gameEvent.delete({ where: { id: eventId } });
    if (announcementId) await prisma.portalAnnouncement.delete({ where: { id: announcementId } });
    if (gameId) await prisma.game.update({ where: { id: gameId }, data: { isPublic: true, tagline: originalTagline } });
    await app.close();
  });

  it('limits CMS to SUPER_ADMIN and exposes dashboard/game operations', async () => {
    const denied = await http().get('/admin/content/dashboard').set('Cookie', supportCookies);
    expect(denied.status).toBe(403);
    expect(denied.body.error.code).toBe('ADMIN_ACCESS_REQUIRED');

    const dashboard = await http().get('/admin/content/dashboard').set('Cookie', adminCookies);
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.data.games.total).toBeGreaterThanOrEqual(1);

    const list = await http().get('/admin/content/games?search=' + gameSlug).set('Cookie', adminCookies);
    expect(list.status).toBe(200);
    expect(list.body.data.items.some((item: { id: string }) => item.id === gameId)).toBe(true);

    const current = await http().get(`/admin/content/games/${gameId}`).set('Cookie', adminCookies);
    expect(current.status).toBe(200);
    const updated = await http()
      .patch(`/admin/content/games/${gameId}`)
      .set('Cookie', adminCookies)
      .send({
        expectedUpdatedAt: current.body.data.updatedAt,
        tagline: 'Tagline CMS integration test',
        isPublic: false,
        reason: 'Kiểm tra cập nhật game CMS',
      });
    expect(updated.status).toBe(200);
    expect(updated.body.data.isPublic).toBe(false);

    const hidden = await http().get(`/games/${gameSlug}`);
    expect(hidden.status).toBe(404);
    await prisma.game.update({ where: { id: gameId }, data: { isPublic: true } });

    const stale = await http()
      .patch(`/admin/content/games/${gameId}`)
      .set('Cookie', adminCookies)
      .send({
        expectedUpdatedAt: current.body.data.updatedAt,
        tagline: 'Không được ghi đè',
        reason: 'Kiểm tra conflict dữ liệu cũ',
      });
    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe('STALE_ADMIN_UPDATE');
  });

  it('keeps draft articles/events out of public API and publishes them safely', async () => {
    const article = await http()
      .post('/admin/content/articles')
      .set('Cookie', adminCookies)
      .send({
        gameId,
        title: 'CMS integration article',
        slug: `CMS Article ${suffix}`,
        excerpt: 'Bài viết dùng trong integration test.',
        content: '# Nội dung\n\n**Bản nháp** của bài viết.',
        category: 'DEVELOPMENT_UPDATE',
        status: 'DRAFT',
        reason: 'Tạo bài viết nháp kiểm thử',
      });
    expect(article.status).toBe(201);
    articleId = article.body.data.id;
    const publicDraft = await http().get(`/games/${gameSlug}/articles`).set('Cookie', adminCookies);
    expect(publicDraft.body.data.items.some((item: { slug: string }) => item.slug.includes(`cms-article-${suffix}`))).toBe(false);

    const published = await http()
      .patch(`/admin/content/articles/${articleId}`)
      .set('Cookie', adminCookies)
      .send({
        expectedUpdatedAt: article.body.data.updatedAt,
        status: 'PUBLISHED',
        reason: 'Publish bài viết kiểm thử',
      });
    expect(published.status).toBe(200);
    expect(published.body.data.status).toBe('PUBLISHED');
    const publicArticle = await http().get(`/games/${gameSlug}/articles`);
    expect(publicArticle.body.data.items.some((item: { slug: string }) => item.slug === published.body.data.slug)).toBe(true);

    const startsAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const event = await http()
      .post('/admin/content/events')
      .set('Cookie', adminCookies)
      .send({
        gameId,
        title: 'CMS integration event',
        slug: `CMS Event ${suffix}`,
        excerpt: 'Sự kiện kiểm thử.',
        content: 'Nội dung sự kiện.',
        startsAt,
        status: 'DRAFT',
        reason: 'Tạo sự kiện nháp kiểm thử',
      });
    expect(event.status).toBe(201);
    eventId = event.body.data.id;
    const draftEvents = await http().get('/portal/events?status=UPCOMING');
    expect(draftEvents.body.data.items.some((item: { slug: string }) => item.slug === event.body.data.slug)).toBe(false);

    const publishedEvent = await http()
      .patch(`/admin/content/events/${eventId}`)
      .set('Cookie', adminCookies)
      .send({ expectedUpdatedAt: event.body.data.updatedAt, status: 'PUBLISHED', reason: 'Publish event kiểm thử' });
    expect(publishedEvent.status).toBe(200);
    const publicEvents = await http().get('/portal/events?status=UPCOMING');
    expect(publicEvents.body.data.items.some((item: { slug: string }) => item.slug === event.body.data.slug)).toBe(true);
  });

  it('validates announcement date/url and audits content without body payloads', async () => {
    const invalid = await http()
      .post('/admin/content/announcements')
      .set('Cookie', adminCookies)
      .send({
        code: `CONTENT_${suffix}`,
        title: 'Thông báo lỗi',
        message: 'Không hợp lệ',
        ctaPath: 'javascript:alert(1)',
        startsAt: new Date().toISOString(),
        reason: 'Kiểm tra URL không an toàn',
      });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('CONTENT_INVALID_URL');

    const announcement = await http()
      .post('/admin/content/announcements')
      .set('Cookie', adminCookies)
      .send({
        code: `CONTENT_${suffix}`,
        title: 'Thông báo CMS',
        message: 'Thông báo kiểm thử.',
        startsAt: new Date(Date.now() - 60_000).toISOString(),
        status: 'PUBLISHED',
        reason: 'Tạo announcement kiểm thử',
      });
    expect(announcement.status).toBe(201);
    announcementId = announcement.body.data.id;
    const home = await http().get('/portal/home');
    expect(home.body.data.announcement?.code).toBe(`CONTENT_${suffix}`);

    const logs = await http()
      .get('/admin/audit-logs')
      .query({ targetId: announcementId })
      .set('Cookie', adminCookies);
    expect(logs.status).toBe(200);
    const metadata = JSON.stringify(logs.body.data.items[0]?.metadata ?? {});
    expect(metadata).not.toContain('Thông báo kiểm thử');
  });

  async function createUser(username: string, email: string, role: 'SUPER_ADMIN' | 'SUPPORT') {
    const user = await prisma.user.create({
      data: {
        username: `${username}${suffix.slice(-8)}`,
        usernameNormalized: `${username}${suffix.slice(-8)}`.toLowerCase(),
        email,
        emailNormalized: email,
        passwordHash: await argon2.hash('ContentPassword123!'),
        status: 'ACTIVE',
        phone: null,
        phoneNormalized: null,
        profile: {
          create: {
            fullName: username,
            gender: 'UNSPECIFIED',
            termsVersion: 'test-2026-01',
            privacyVersion: 'test-2026-01',
            acceptedAt: new Date(),
          },
        },
        wallet: { create: { currency: 'ZENX', balance: 0n } },
      },
    });
    await prisma.userRole.create({ data: { userId: user.id, role } });
    return user;
  }

  async function login(username: string, password: string) {
    const response = await http().post('/auth/login').send({ username, password });
    expect(response.status).toBe(201);
    return cookieHeader(response);
  }

  function http() {
    return {
      get: (path: string) => request(app.getHttpServer()).get(`/api/v1${path}`).set('Origin', 'http://localhost:3000'),
      post: (path: string) => request(app.getHttpServer()).post(`/api/v1${path}`).set('Origin', 'http://localhost:3000'),
      patch: (path: string) => request(app.getHttpServer()).patch(`/api/v1${path}`).set('Origin', 'http://localhost:3000'),
    };
  }

  function cookieHeader(response: { headers: Record<string, string | string[]> }) {
    const setCookie = response.headers['set-cookie'];
    return (Array.isArray(setCookie) ? setCookie : [setCookie]).map((cookie) => cookie.split(';')[0]).join('; ');
  }
});
