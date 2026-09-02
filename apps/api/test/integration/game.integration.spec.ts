import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import request = require('supertest');
import { AppModule } from '../../src/app.module';
import { ApiErrorFilter } from '../../src/common/error.filter';
import { ResponseInterceptor } from '../../src/common/response.interceptor';
import { PrismaService } from '../../src/database/prisma.service';

jest.setTimeout(30_000);

describe('Game catalog API (SQL Server)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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
  });

  afterAll(async () => app.close());

  const http = () => ({
    get: (path: string) => request(app.getHttpServer()).get(path).set('Origin', 'http://localhost:3000'),
  });

  it('lists the four public seed games and supports combined filters', async () => {
    const all = await http().get('/api/v1/games');
    expect(all.status).toBe(200);
    expect(all.body.data.items.map((item: { slug: string }) => item.slug)).toEqual(['luc-dia-dam-me', 'vuong-trieu-hoa-long', 'thi-tran-may', 'chien-tuyen-orion']);
    expect(all.body.data.items.every((item: { themeConfig?: unknown }) => item.themeConfig === undefined)).toBe(true);

    const filtered = await http().get('/api/v1/games?genre=MMORPG&platform=PC');
    expect(filtered.status).toBe(200);
    expect(filtered.body.data.items).toHaveLength(1);
    expect(filtered.body.data.items[0]).toMatchObject({ slug: 'luc-dia-dam-me', subdomain: 'lucdia' });

    const orion = await http().get('/api/v1/games?genre=SHOOTER&platform=PC&status=CONCEPT');
    expect(orion.status).toBe(200);
    expect(orion.body.data.items).toHaveLength(1);
    expect(orion.body.data.items[0]).toMatchObject({ slug: 'chien-tuyen-orion', subdomain: 'orion', recordType: 'DEMO' });
  });

  it('resolves by subdomain and exposes only published content', async () => {
    const game = await http().get('/api/v1/games/by-subdomain/lucdia');
    expect(game.status).toBe(200);
    expect(game.body.data).toMatchObject({ slug: 'luc-dia-dam-me', subdomain: 'lucdia', themePreset: 'EDITORIAL_FANTASY' });
    expect(game.body.data.theme.primary).toBe('#54796f');
    expect(game.body.data.featureConfig.sections).toContain('ROADMAP_PREVIEW');

    const article = await http().get('/api/v1/games/luc-dia-dam-me/articles/world-remake');
    expect(article.status).toBe(200);
    expect(article.body.data.contentHtml).toContain('<h1>World Remake</h1>');
    expect(article.body.data.content).toBeUndefined();
    expect(article.body.data.related.length).toBeGreaterThan(0);

    const orion = await http().get('/api/v1/games/by-subdomain/orion');
    expect(orion.status).toBe(200);
    expect(orion.body.data).toMatchObject({ slug: 'chien-tuyen-orion', subdomain: 'orion', themePreset: 'SCI_FI_SHOOTER', heroDesktopUrl: '/images/games/chien-tuyen-orion/hero-desktop.webp', heroMobileUrl: '/images/games/chien-tuyen-orion/hero-mobile.webp' });
    expect(orion.body.data.featureConfig.sections).toEqual(['HERO', 'GAME_INTRODUCTION', 'FEATURE_GRID', 'ARTICLE_GRID', 'COMMUNITY_CTA']);
    expect(orion.body.data.featureConfig.routes).toEqual(['NEWS']);
  });

  it('returns clear 404s for unknown slug and subdomain', async () => {
    const slug = await http().get('/api/v1/games/not-a-game');
    expect(slug.status).toBe(404);
    expect(slug.body.error.code).toBe('GAME_NOT_FOUND');
    const host = await http().get('/api/v1/games/by-subdomain/no-such-game');
    expect(host.status).toBe(404);
    expect(host.body.error.code).toBe('GAME_NOT_FOUND');
  });

  it('hides demo records when their public flag is disabled', async () => {
    await prisma.game.updateMany({ where: { recordType: 'DEMO' }, data: { isPublic: false } });
    try {
      const response = await http().get('/api/v1/games');
      expect(response.status).toBe(200);
      expect(response.body.data.items.map((item: { slug: string }) => item.slug)).toEqual(['luc-dia-dam-me']);
      const orion = await http().get('/api/v1/games/by-subdomain/orion');
      expect(orion.status).toBe(404);
    } finally {
      await prisma.game.updateMany({ where: { recordType: 'DEMO' }, data: { isPublic: true } });
    }
  });

  it('allows state-changing requests from a public game host but rejects lookalike domains', async () => {
    const gameOrigin = await request(app.getHttpServer()).post('/api/v1/auth/refresh').set('Origin', 'http://lucdia.localhost:3000');
    expect(gameOrigin.status).toBe(401);
    const missingOrigin = await request(app.getHttpServer()).post('/api/v1/auth/refresh');
    expect(missingOrigin.status).toBe(403);
    const foreignOrigin = await request(app.getHttpServer()).post('/api/v1/auth/refresh').set('Origin', 'http://evilzenxgo.io.vn');
    expect(foreignOrigin.status).toBe(403);

    await prisma.game.update({ where: { subdomain: 'lucdia' }, data: { isPublic: false } });
    try {
      const hiddenOrigin = await request(app.getHttpServer()).post('/api/v1/auth/refresh').set('Origin', 'http://lucdia.localhost:3000');
      expect(hiddenOrigin.status).toBe(403);
    } finally {
      await prisma.game.update({ where: { subdomain: 'lucdia' }, data: { isPublic: true } });
    }
  });
});
