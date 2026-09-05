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

  it('limits CMS to SUPER_ADMIN and exposes dashboard/game reads', async () => {
    const denied = await http().get('/admin/content/dashboard').set('Cookie', supportCookies);
    expect(denied.status).toBe(403);
    expect(denied.body.error.code).toBe('ADMIN_ACCESS_REQUIRED');

    const dashboard = await http().get('/admin/content/dashboard').set('Cookie', adminCookies);
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.data.games.total).toBeGreaterThanOrEqual(1);


    const list = await http().get('/admin/content/games?search=' + gameSlug).set('Cookie', adminCookies);
    expect(list.status).toBe(200);
    expect(list.body.data.items.some((item: { id: string }) => item.id === gameId)).toBe(true);

    expect((await http().get(`/admin/content/games/${gameId}`).set('Cookie', adminCookies)).status).toBe(200);
  });

  it('updates basic fields and identifiers while keeping advanced config read-only', async () => {
    const current = await http().get(`/admin/content/games/${gameId}`).set('Cookie', adminCookies);
    expect(current.status).toBe(200);
    const original = current.body.data;
    const otherGame = await prisma.game.findFirst({ where: { id: { not: gameId } }, select: { code: true } });
    if (!otherGame) throw new Error('A second seed game is required');

    const suffixPart = suffix.slice(-12);
    const editedSlug = `cms-game-${suffixPart}`;
    const editedSubdomain = `cms-${suffixPart}`;
    const editedCode = `CMS${suffixPart}`.slice(0, 32).toUpperCase();
    let editedUpdatedAt = '';
    try {
      const changed = await http()
        .patch(`/admin/content/games/${gameId}`)
        .set('Cookie', adminCookies)
        .send({
          expectedUpdatedAt: original.updatedAt,
          code: editedCode,
          slug: editedSlug,
          subdomain: editedSubdomain,
          tagline: 'Basic field updated',
          recordType: original.recordType === 'REAL' ? 'DEMO' : 'REAL',
          primaryGame: !original.primaryGame,
        });
      expect(changed.status).toBe(200);
      editedUpdatedAt = changed.body.data.updatedAt;
      expect(changed.body.data.code).toBe(editedCode);
      expect(changed.body.data.slug).toBe(editedSlug);
      expect(changed.body.data.subdomain).toBe(editedSubdomain);
      expect(changed.body.data.tagline).toBe('Basic field updated');
      expect(changed.body.data.recordType).toBe(original.recordType);
      expect(changed.body.data.primaryGame).toBe(original.primaryGame);
      expect((await http().get(`/games/${gameSlug}`)).status).toBe(404);
      expect((await http().get(`/games/${editedSlug}`)).status).toBe(200);

      const duplicate = await http()
        .patch(`/admin/content/games/${gameId}`)
        .set('Cookie', adminCookies)
        .send({ expectedUpdatedAt: editedUpdatedAt, code: otherGame.code });
      expect(duplicate.status).toBe(409);

      const reservedSubdomain = await http()
        .patch(`/admin/content/games/${gameId}`)
        .set('Cookie', adminCookies)
        .send({ expectedUpdatedAt: editedUpdatedAt, subdomain: 'admin' });
      expect(reservedSubdomain.status).toBe(400);

      const stale = await http()
        .patch(`/admin/content/games/${gameId}`)
        .set('Cookie', adminCookies)
        .send({ expectedUpdatedAt: original.updatedAt, code: original.code });
      expect(stale.status).toBe(409);
      expect(stale.body.error.code).toBe('STALE_ADMIN_UPDATE');
    } finally {
      if (editedUpdatedAt) {
        await http()
          .patch(`/admin/content/games/${gameId}`)
          .set('Cookie', adminCookies)
          .send({
            expectedUpdatedAt: editedUpdatedAt,
            code: original.code,
            slug: original.slug,
            subdomain: original.subdomain,
            tagline: original.tagline,
          });
      }
    }
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
      });
    expect(event.status).toBe(201);
    eventId = event.body.data.id;
    const draftEvents = await http().get('/portal/events?status=UPCOMING');
    expect(draftEvents.body.data.items.some((item: { slug: string }) => item.slug === event.body.data.slug)).toBe(false);

    const publishedEvent = await http()
      .patch(`/admin/content/events/${eventId}`)
      .set('Cookie', adminCookies)
      .send({ expectedUpdatedAt: event.body.data.updatedAt, status: 'PUBLISHED' });
    expect(publishedEvent.status).toBe(200);
    const publicEvents = await http().get('/portal/events?status=UPCOMING');
    expect(publicEvents.body.data.items.some((item: { slug: string }) => item.slug === event.body.data.slug)).toBe(true);
  });

  it('validates announcement date/url', async () => {
    const invalid = await http()
      .post('/admin/content/announcements')
      .set('Cookie', adminCookies)
      .send({
        code: `CONTENT_${suffix}`,
        title: 'Thông báo lỗi',
        message: 'Không hợp lệ',
        ctaPath: 'javascript:alert(1)',
        startsAt: new Date().toISOString(),
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
      });
    expect(announcement.status).toBe(201);
    announcementId = announcement.body.data.id;
    const home = await http().get('/portal/home');
    expect(home.body.data.announcement?.code).toBe(`CONTENT_${suffix}`);

    const auditRoute = await http().get('/admin/audit-logs').set('Cookie', adminCookies);
    expect(auditRoute.status).toBe(404);

    // Test asset upload endpoint
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    const uploadRes = await http()
      .post('/admin/content/upload')
      .set('Cookie', adminCookies)
      .attach('file', pngBuffer, { filename: 'icon.png', contentType: 'image/png' });
    expect(uploadRes.status).toBe(201);
    expect(uploadRes.body.data.url).toMatch(/^\/uploads\/content\/.+\.png$/);

    const deniedUpload = await http()
      .post('/admin/content/upload')
      .set('Cookie', supportCookies)
      .attach('file', pngBuffer, { filename: 'icon.png', contentType: 'image/png' });
    expect(deniedUpload.status).toBe(403);
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
