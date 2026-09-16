import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import cookieParser from 'cookie-parser';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import request = require('supertest');
import { AppModule } from '../../src/app.module';
import { ApiErrorFilter } from '../../src/common/error.filter';
import { ResponseInterceptor } from '../../src/common/response.interceptor';
import { PrismaService } from '../../src/database/prisma.service';

jest.setTimeout(30_000);

const prisma = new PrismaClient();
const repoRoot = resolve(__dirname, '../../../..');

process.env.ALLOW_TEST_OAUTH = 'true';
process.env.GOOGLE_CLIENT_ID = 'integration-google-client';
process.env.GOOGLE_CLIENT_SECRET = 'integration-google-secret';
process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/api/v1/auth/google/callback';

describe('Auth settings persistence', () => {
  afterAll(async () => {
    await prisma.authSettings.update({
      where: { id: 1 },
      data: {
        googleLoginRegistrationEnabled: true,
        facebookLoginRegistrationEnabled: true,
      },
    });
    await prisma.$disconnect();
  });

  it('seeds the enabled singleton defaults', async () => {
    const settings = await prisma.authSettings.findUniqueOrThrow({ where: { id: 1 } });

    expect(settings).toMatchObject({
      googleLoginRegistrationEnabled: true,
      facebookLoginRegistrationEnabled: true,
    });
  });

  it('grants auth settings management only to SUPER_ADMIN', async () => {
    const permission = await prisma.permission.findUniqueOrThrow({
      where: { code: 'settings.auth.manage' },
      include: { roles: { include: { role: true } } },
    });

    expect(permission).toMatchObject({ action: 'manage', subject: 'AuthSettings' });
    expect(permission.roles.map(({ role }) => role.code).sort()).toEqual(['SUPER_ADMIN']);
  });

  it('rejects a second settings row', async () => {
    await expect(prisma.authSettings.create({ data: { id: 2 } })).rejects.toThrow();
  });

  it('preserves live choices when seed is rerun', async () => {
    await prisma.authSettings.update({
      where: { id: 1 },
      data: {
        googleLoginRegistrationEnabled: false,
        facebookLoginRegistrationEnabled: false,
      },
    });

    execFileSync('pnpm', ['--filter', 'api', 'prisma:seed'], {
      cwd: repoRoot,
      env: process.env,
    });

    await expect(prisma.authSettings.findUniqueOrThrow({ where: { id: 1 } })).resolves.toMatchObject({
      googleLoginRegistrationEnabled: false,
      facebookLoginRegistrationEnabled: false,
    });
  });
});

describe('Auth settings API (SQL Server)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminCookies = '';
  let supportCookies = '';
  const userIds: string[] = [];
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10_000)}`;

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

    await prisma.authSettings.update({
      where: { id: 1 },
      data: {
        googleLoginRegistrationEnabled: true,
        facebookLoginRegistrationEnabled: true,
      },
    });
    adminCookies = await createRoleUser('SUPER_ADMIN', 'auth-settings-admin');
    supportCookies = await createRoleUser('SUPPORT', 'auth-settings-support');
  });

  afterAll(async () => {
    await prisma.authSettings.update({
      where: { id: 1 },
      data: {
        googleLoginRegistrationEnabled: true,
        facebookLoginRegistrationEnabled: true,
      },
    });
    await prisma.$transaction([
      prisma.refreshSession.deleteMany({ where: { userId: { in: userIds } } }),
      prisma.userRole.deleteMany({ where: { userId: { in: userIds } } }),
      prisma.wallet.deleteMany({ where: { userId: { in: userIds } } }),
      prisma.userProfile.deleteMany({ where: { userId: { in: userIds } } }),
      prisma.user.deleteMany({ where: { id: { in: userIds } } }),
    ]);
    await app.close();
  });

  it('returns only public provider availability without caching', async () => {
    const publicRead = await http().get('/auth/provider-availability');

    expect(publicRead.status).toBe(200);
    expect(publicRead.headers['cache-control']).toBe('no-store');
    expect(publicRead.body.data).toEqual({ google: true, facebook: true });
    expect(Object.keys(publicRead.body.data).sort()).toEqual(['facebook', 'google']);
  });

  it('protects admin reads with authentication and the auth settings permission', async () => {
    expect(await http().get('/admin/settings/auth-providers')).toMatchObject({ status: 401 });

    const supportRead = await http()
      .get('/admin/settings/auth-providers')
      .set('Cookie', supportCookies);
    expect(supportRead.status).toBe(403);
    expect(supportRead.body.error.code).toBe('PERMISSION_REQUIRED');

    const adminRead = await http()
      .get('/admin/settings/auth-providers')
      .set('Cookie', adminCookies);
    expect(adminRead.status).toBe(200);
    expect(adminRead.body.data).toMatchObject({
      googleLoginRegistrationEnabled: true,
      facebookLoginRegistrationEnabled: true,
    });
    expect(adminRead.body.data.updatedAt).toEqual(expect.any(String));
  });

  it('applies partial updates and rejects a stale competing write', async () => {
    const before = await http()
      .get('/admin/settings/auth-providers')
      .set('Cookie', adminCookies);
    const expectedUpdatedAt = before.body.data.updatedAt as string;

    const updated = await http()
      .patch('/admin/settings/auth-providers')
      .set('Cookie', adminCookies)
      .send({ expectedUpdatedAt, googleLoginRegistrationEnabled: false });
    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({
      googleLoginRegistrationEnabled: false,
      facebookLoginRegistrationEnabled: true,
      updatedAt: expect.any(String),
    });

    const stale = await http()
      .patch('/admin/settings/auth-providers')
      .set('Cookie', adminCookies)
      .send({ expectedUpdatedAt, facebookLoginRegistrationEnabled: false });
    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe('STALE_AUTH_SETTINGS_UPDATE');
  });

  it('rejects updates without a boolean setting or with non-boolean values', async () => {
    const current = await prisma.authSettings.findUniqueOrThrow({ where: { id: 1 } });

    const empty = await http()
      .patch('/admin/settings/auth-providers')
      .set('Cookie', adminCookies)
      .send({ expectedUpdatedAt: current.updatedAt.toISOString() });
    expect(empty.status).toBe(400);

    const nonBoolean = await http()
      .patch('/admin/settings/auth-providers')
      .set('Cookie', adminCookies)
      .send({
        expectedUpdatedAt: current.updatedAt.toISOString(),
        googleLoginRegistrationEnabled: 'false',
      });
    expect(nonBoolean.status).toBe(400);
  });

  it.each([
    {
      name: 'Facebook string alongside valid Google',
      settings: {
        googleLoginRegistrationEnabled: true,
        facebookLoginRegistrationEnabled: 'false',
      },
    },
    {
      name: 'Facebook null alongside valid Google',
      settings: {
        googleLoginRegistrationEnabled: true,
        facebookLoginRegistrationEnabled: null,
      },
    },
    {
      name: 'Google null',
      settings: { googleLoginRegistrationEnabled: null },
    },
  ])('rejects $name before persistence', async ({ settings }) => {
    const current = await prisma.authSettings.findUniqueOrThrow({ where: { id: 1 } });

    const response = await http()
      .patch('/admin/settings/auth-providers')
      .set('Cookie', adminCookies)
      .send({ expectedUpdatedAt: current.updatedAt.toISOString(), ...settings });

    expect(response.status).toBe(400);
    expect(response.body.error.code).not.toBe('SETTINGS_UNAVAILABLE');
  });

  it('returns SETTINGS_UNAVAILABLE when the singleton row is absent', async () => {
    const saved = await prisma.authSettings.findUniqueOrThrow({ where: { id: 1 } });
    await prisma.authSettings.delete({ where: { id: 1 } });

    try {
      const publicRead = await http().get('/auth/provider-availability');
      expect(publicRead.status).toBe(503);
      expect(publicRead.body.error.code).toBe('SETTINGS_UNAVAILABLE');

      const adminRead = await http()
        .get('/admin/settings/auth-providers')
        .set('Cookie', adminCookies);
      expect(adminRead.status).toBe(503);
      expect(adminRead.body.error.code).toBe('SETTINGS_UNAVAILABLE');
    } finally {
      await prisma.authSettings.create({ data: saved });
    }
  });

  it('blocks disabled login starts before creating OAuth state but leaves link start available', async () => {
    await prisma.authSettings.update({
      where: { id: 1 },
      data: { googleLoginRegistrationEnabled: false },
    });

    const loginStart = await http().get('/auth/google');
    expect(loginStart.status).toBe(302);
    expect(loginStart.headers.location).toContain('social_error=provider_disabled');
    expect(loginStart.headers['set-cookie']).toBeUndefined();

    const linkStart = await http()
      .get('/auth/google?mode=link')
      .set('Cookie', adminCookies);
    expect(linkStart.status).toBe(302);
    expect(linkStart.headers.location).toContain('accounts.google.com');
    expect(linkStart.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('zenx_oauth_state_google=')]),
    );
  });

  it('rechecks settings after valid callback state and blocks stale enabled policy', async () => {
    await prisma.authSettings.update({
      where: { id: 1 },
      data: { googleLoginRegistrationEnabled: true },
    });
    const start = await http().get('/auth/google');
    const state = new URL(start.headers.location).searchParams.get('state');
    const stateCookie = cookieHeader(start);
    expect(state).toEqual(expect.any(String));

    await prisma.authSettings.update({
      where: { id: 1 },
      data: { googleLoginRegistrationEnabled: false },
    });
    const callback = await http()
      .get(`/auth/google/callback?state=${encodeURIComponent(state!)}&code=unused`)
      .set('Cookie', stateCookie);

    expect(callback.status).toBe(302);
    expect(callback.headers.location).toContain('social_error=provider_disabled');
  });

  it('maps unavailable settings while preserving invalid-state precedence', async () => {
    await prisma.authSettings.update({
      where: { id: 1 },
      data: { googleLoginRegistrationEnabled: true },
    });
    const start = await http().get('/auth/google');
    const state = new URL(start.headers.location).searchParams.get('state');
    const stateCookie = cookieHeader(start);
    const saved = await prisma.authSettings.findUniqueOrThrow({ where: { id: 1 } });
    await prisma.authSettings.delete({ where: { id: 1 } });

    try {
      const unavailableStart = await http().get('/auth/google');
      expect(unavailableStart.status).toBe(302);
      expect(unavailableStart.headers.location).toContain('social_error=settings_unavailable');
      expect(unavailableStart.headers['set-cookie']).toBeUndefined();

      const unavailableCallback = await http()
        .get(`/auth/google/callback?state=${encodeURIComponent(state!)}&code=unused`)
        .set('Cookie', stateCookie);
      expect(unavailableCallback.status).toBe(302);
      expect(unavailableCallback.headers.location).toContain('social_error=settings_unavailable');

      const invalidCallback = await http()
        .get('/auth/google/callback?state=tampered&code=unused')
        .set('Cookie', stateCookie);
      expect(invalidCallback.status).toBe(302);
      expect(invalidCallback.headers.location).toContain('social_error=invalid_state');
    } finally {
      await prisma.authSettings.create({ data: saved });
    }
  });

  async function createRoleUser(roleCode: 'SUPER_ADMIN' | 'SUPPORT', prefix: string) {
    const email = `${prefix}-${suffix}@example.com`;
    const password = 'AuthSettingsPassword123!';
    const username = `${prefix}${suffix.slice(-8)}`;
    const user = await prisma.user.create({
      data: {
        username,
        usernameNormalized: username.toLowerCase(),
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
    userIds.push(user.id);
    const role = await prisma.role.findUniqueOrThrow({ where: { code: roleCode } });
    await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });

    const login = await http().post('/auth/login').send({ username: email, password });
    expect(login.status).toBe(201);
    return cookieHeader(login);
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
