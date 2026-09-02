import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import request = require('supertest');
import { AppModule } from '../../src/app.module';
import { ApiErrorFilter } from '../../src/common/error.filter';
import { ResponseInterceptor } from '../../src/common/response.interceptor';

jest.setTimeout(30_000);

describe('Portal content API (SQL Server)', () => {
  let app: INestApplication;

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

  afterAll(async () => app.close());

  const http = () => ({
    get: (path: string) => request(app.getHttpServer()).get(path).set('Origin', 'http://localhost:3000'),
  });

  it('returns homepage data from public games, published articles and active events', async () => {
    const response = await http().get('/api/v1/portal/home');
    expect(response.status).toBe(200);
    expect(response.body.data.announcement).toMatchObject({ code: 'ALPHA_TEST_LDDM_2026', ctaPath: '/events/alpha-test-luc-dia-dam-me' });
    expect(response.body.data.heroGames.map((game: { slug: string }) => game.slug)).toContain('luc-dia-dam-me');
    expect(response.body.data.games.map((game: { slug: string }) => game.slug)).toEqual(['luc-dia-dam-me', 'vuong-trieu-hoa-long', 'thi-tran-may', 'chien-tuyen-orion']);
    expect(response.body.data.latestArticles[0]).toMatchObject({ game: { slug: 'chien-tuyen-orion', subdomain: 'orion' }, href: 'http://orion.localhost:3000/tin-tuc/bao-cao-chien-tuyen-vanh-dai-orion' });
    expect(response.body.data.latestArticles).toHaveLength(3);
    expect(response.body.data.activeEvents.map((event: { slug: string }) => event.slug)).toContain('alpha-test-luc-dia-dam-me');

    const allNews = await http().get('/api/v1/portal/news?pageSize=30');
    expect(allNews.body.data.total).toBe(16);
    for (const [status, total] of [['ACTIVE', 3], ['UPCOMING', 3], ['ENDED', 2]] as const) {
      const events = await http().get(`/api/v1/portal/events?status=${status}`);
      expect(events.body.data.total).toBe(total);
    }
  });

  it('filters portal news by game/category and paginates', async () => {
    const response = await http().get('/api/v1/portal/news?game=lucdia&category=DEVELOPMENT_UPDATE&page=1&pageSize=2');
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ page: 1, pageSize: 2, total: 4, totalPages: 2 });
    expect(response.body.data.items).toHaveLength(2);
    expect(response.body.data.items.every((item: { game: { subdomain: string }; category: string }) => item.game.subdomain === 'lucdia' && item.category === 'DEVELOPMENT_UPDATE')).toBe(true);
  });

  it('filters events by lifecycle and returns sanitized event details', async () => {
    const active = await http().get('/api/v1/portal/events?status=ACTIVE');
    expect(active.status).toBe(200);
    expect(active.body.data.total).toBe(3);
    expect(active.body.data.items.every((item: { status: string }) => item.status === 'ACTIVE')).toBe(true);

    const detail = await http().get('/api/v1/portal/events/alpha-test-luc-dia-dam-me');
    expect(detail.status).toBe(200);
    expect(detail.body.data).toMatchObject({ title: 'Alpha Test Lục Địa Đam Mê', game: { subdomain: 'lucdia' } });
    expect(detail.body.data.contentHtml).toContain('<h1>Alpha Test Lục Địa Đam Mê</h1>');
    expect(detail.body.data.content).toBeUndefined();
  });

  it('returns a clear 404 for an unknown portal event', async () => {
    const response = await http().get('/api/v1/portal/events/not-an-event');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('PORTAL_EVENT_NOT_FOUND');
  });
});
