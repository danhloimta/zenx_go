import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import * as argon2 from 'argon2';
import request = require('supertest');
import { AppModule } from '../../src/app.module';
import { ApiErrorFilter } from '../../src/common/error.filter';
import { ResponseInterceptor } from '../../src/common/response.interceptor';
import { PrismaService } from '../../src/database/prisma.service';

jest.setTimeout(30_000);

describe('Genre admin API (SQL Server)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminCookies = '';
  let supportCookies = '';
  let genreId = '';
  let gameId = '';
  let gameSlug = '';
  let originalGame: { updatedAt: string; tagline: string; genreCodes: string[]; platforms: string[] } | null = null;
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10_000)}`;
  const adminEmail = `genre-admin-${suffix}@example.com`;
  const supportEmail = `genre-support-${suffix}@example.com`;

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
    await createUser('genreadmin', adminEmail, 'SUPER_ADMIN');
    await createUser('genresupport', supportEmail, 'SUPPORT');
    adminCookies = await login(adminEmail);
    supportCookies = await login(supportEmail);
    const game = await prisma.game.findFirst({ where: { isPublic: true }, select: { id: true, slug: true, tagline: true, updatedAt: true, genres: { select: { genre: { select: { code: true } } } }, platforms: { select: { platform: true } } } });
    if (!game) throw new Error('Seed game is required');
    gameId = game.id;
    gameSlug = game.slug;
    originalGame = { updatedAt: game.updatedAt.toISOString(), tagline: game.tagline, genreCodes: game.genres.map(({ genre }) => genre.code), platforms: game.platforms.map(({ platform }) => platform) };
  });

  afterAll(async () => {
    if (originalGame) {
      await prisma.game.update({ where: { id: gameId }, data: { tagline: originalGame.tagline } }).catch(() => undefined);
      // Restore relations using direct database writes so cleanup survives a
      // failed assertion in the HTTP workflow above.
      const genreRows = await prisma.genre.findMany({ where: { code: { in: originalGame.genreCodes } }, select: { id: true, code: true } });
      await prisma.gameGenre.deleteMany({ where: { gameId } });
      await prisma.gameGenre.createMany({ data: genreRows.map((genre) => ({ gameId, genreId: genre.id })) });
      await prisma.gamePlatform.deleteMany({ where: { gameId } });
      await prisma.gamePlatform.createMany({ data: originalGame.platforms.map((platform) => ({ gameId, platform })) });
    }
    if (genreId) await prisma.genre.delete({ where: { id: genreId } }).catch(() => undefined);
    await app.close();
  });

  it('supports CRUD, usage protection, active assignment rules and public retention', async () => {
    const denied = await http().get('/admin/content/genres').set('Cookie', supportCookies);
    expect(denied.status).toBe(403);
    expect(denied.body.error.code).toBe('ADMIN_ACCESS_REQUIRED');

    const code = `E2E_GENRE_${suffix}`.slice(0, 32).toUpperCase();
    const slug = `e2e-genre-${suffix}`.slice(0, 80);
    const created = await http().post('/admin/content/genres').set('Cookie', adminCookies).send({ code, name: 'E2E Genre', slug, sortOrder: 999 });
    expect(created.status).toBe(201);
    genreId = created.body.data.id;
    expect(created.body.data).toMatchObject({ code, name: 'E2E Genre', slug, sortOrder: 999, isActive: true, usageCount: 0 });

    const duplicateCode = await http().post('/admin/content/genres').set('Cookie', adminCookies).send({ code: code.toLowerCase(), name: 'Duplicate code', slug: `${slug}-code` });
    expect(duplicateCode.status).toBe(409);
    expect(duplicateCode.body.error.code).toBe('CONTENT_GENRE_CODE_EXISTS');
    const duplicateSlug = await http().post('/admin/content/genres').set('Cookie', adminCookies).send({ code: `${code}_2`.slice(0, 32), name: 'Duplicate slug', slug });
    expect(duplicateSlug.status).toBe(409);
    expect(duplicateSlug.body.error.code).toBe('CONTENT_GENRE_SLUG_EXISTS');

    const search = await http().get('/admin/content/genres').query({ search: code }).set('Cookie', adminCookies);
    expect(search.status).toBe(200);
    expect(search.body.data).toHaveLength(1);
    expect(search.body.data[0].usageCount).toBe(0);

    const activeDelete = await http().delete(`/admin/content/genres/${genreId}`).set('Cookie', adminCookies);
    expect(activeDelete.status).toBe(409);
    expect(activeDelete.body.error.code).toBe('CONTENT_GENRE_MUST_BE_INACTIVE');

    const gameBefore = await http().get(`/admin/content/games/${gameId}`).set('Cookie', adminCookies);
    const attached = await http().patch(`/admin/content/games/${gameId}`).set('Cookie', adminCookies).send({ expectedUpdatedAt: gameBefore.body.data.updatedAt, genreCodes: [...originalGame!.genreCodes, code], platforms: originalGame!.platforms });
    expect(attached.status).toBe(200);
    const deactivated = await http().patch(`/admin/content/genres/${genreId}`).set('Cookie', adminCookies).send({ expectedUpdatedAt: created.body.data.updatedAt, isActive: false, name: 'E2E Genre Disabled' });
    expect(deactivated.status).toBe(200);
    expect(deactivated.body.data).toMatchObject({ isActive: false, usageCount: 1 });

    const inactiveList = await http().get('/admin/content/genres').query({ status: 'INACTIVE' }).set('Cookie', adminCookies);
    expect(inactiveList.status).toBe(200);
    expect(inactiveList.body.data.some((genre: { id: string }) => genre.id === genreId)).toBe(true);
    const activeList = await http().get('/admin/content/genres').query({ status: 'ACTIVE' }).set('Cookie', adminCookies);
    expect(activeList.status).toBe(200);
    expect(activeList.body.data.some((genre: { id: string }) => genre.id === genreId)).toBe(false);

    const options = await http().get('/admin/content/game-options').set('Cookie', adminCookies);
    expect(options.body.data.genres.find((genre: { code: string }) => genre.code === code)).toMatchObject({ isActive: false });
    const keepInactive = await http().patch(`/admin/content/games/${gameId}`).set('Cookie', adminCookies).send({ expectedUpdatedAt: attached.body.data.updatedAt, tagline: 'Keep inactive taxonomy', genreCodes: [...originalGame!.genreCodes, code], platforms: originalGame!.platforms });
    expect(keepInactive.status).toBe(200);

    const createInactive = await http().post('/admin/content/games').set('Cookie', adminCookies).send({ themePreset: 'EDITORIAL_FANTASY', code: `INACTIVE_${suffix}`.slice(0, 32), slug: `inactive-genre-${suffix}`.slice(0, 180), subdomain: `inactive-genre-${suffix}`.slice(0, 63), name: 'Inactive Genre Game', genreCodes: [code], platforms: ['PC'] });
    expect(createInactive.status).toBe(400);
    expect(createInactive.body.error.code).toBe('CONTENT_GENRE_INACTIVE');

    const otherGame = await prisma.game.findFirst({ where: { id: { not: gameId } }, select: { id: true, updatedAt: true, genres: { select: { genre: { select: { code: true } } } }, platforms: { select: { platform: true } } } });
    if (!otherGame) throw new Error('Second seed game is required');
    const inactiveAssignment = await http().patch(`/admin/content/games/${otherGame.id}`).set('Cookie', adminCookies).send({ expectedUpdatedAt: otherGame.updatedAt.toISOString(), genreCodes: [...otherGame.genres.map(({ genre }) => genre.code), code], platforms: otherGame.platforms.map(({ platform }) => platform) });
    expect(inactiveAssignment.status).toBe(400);
    expect(inactiveAssignment.body.error.code).toBe('CONTENT_GENRE_INACTIVE');

    const retained = await http().get(`/admin/content/games/${gameId}`).set('Cookie', adminCookies);
    expect(retained.body.data.genres.some((genre: { code: string }) => genre.code === code)).toBe(true);
    const publicGame = await http().get(`/games/${gameSlug}`);
    expect(publicGame.status).toBe(200);
    expect(publicGame.body.data.genres.some((genre: { code: string }) => genre.code === code)).toBe(true);

    const stale = await http().patch(`/admin/content/genres/${genreId}`).set('Cookie', adminCookies).send({ expectedUpdatedAt: created.body.data.updatedAt, name: 'Stale update' });
    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe('STALE_ADMIN_UPDATE');

    const stillInUse = await http().delete(`/admin/content/genres/${genreId}`).set('Cookie', adminCookies);
    expect(stillInUse.status).toBe(409);
    expect(stillInUse.body.error.code).toBe('CONTENT_GENRE_IN_USE');

    const latestGame = await http().get(`/admin/content/games/${gameId}`).set('Cookie', adminCookies);
    const removed = await http().patch(`/admin/content/games/${gameId}`).set('Cookie', adminCookies).send({ expectedUpdatedAt: latestGame.body.data.updatedAt, genreCodes: originalGame!.genreCodes, platforms: originalGame!.platforms });
    expect(removed.status).toBe(200);
    const latestGenre = await http().get('/admin/content/genres').query({ search: code }).set('Cookie', adminCookies);
    const deleted = await http().delete(`/admin/content/genres/${genreId}`).set('Cookie', adminCookies);
    expect(deleted.status).toBe(200);
    expect(deleted.body.data).toEqual({ deleted: true, id: genreId });
    genreId = '';
    expect(latestGenre.body.data[0].usageCount).toBe(0);
  });

  async function createUser(username: string, email: string, role: 'SUPER_ADMIN' | 'SUPPORT') {
    const user = await prisma.user.create({ data: { username: `${username}${suffix.slice(-8)}`, usernameNormalized: `${username}${suffix.slice(-8)}`.toLowerCase(), email, emailNormalized: email, passwordHash: await argon2.hash('GenrePassword123!'), status: 'ACTIVE', profile: { create: { fullName: username, gender: 'UNSPECIFIED', termsVersion: 'test', privacyVersion: 'test', acceptedAt: new Date() } }, wallet: { create: { currency: 'ZENX', balance: 0n } } } });
    await prisma.userRole.create({ data: { userId: user.id, role } });
  }

  async function login(username: string) {
    const response = await http().post('/auth/login').send({ username, password: 'GenrePassword123!' });
    expect(response.status).toBe(201);
    return cookieHeader(response);
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
    return (Array.isArray(setCookie) ? setCookie : [setCookie]).filter(Boolean).map((cookie) => cookie.split(';')[0]).join('; ');
  }
});
