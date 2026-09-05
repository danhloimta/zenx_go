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
import { SensitiveProfileCrypto } from '../../src/account/sensitive-profile.service';

jest.setTimeout(30_000);

describe('Admin API (SQL Server)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let crypto: SensitiveProfileCrypto;
  let adminId = '';
  let memberId = '';
  let adminCookies = '';
  let memberCookies = '';
  let memberEmail = '';
  let memberCitizenId = '';
  const adminEmail = `admin-${Date.now()}@example.com`;
  const adminPassword = 'AdminPassword123!';

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
    crypto = app.get(SensitiveProfileCrypto);

    const passwordHash = await argon2.hash(adminPassword);
    const admin = await prisma.user.create({
      data: {
        username: `admin${Date.now()}`,
        usernameNormalized: adminEmail.split('@')[0],
        email: adminEmail,
        emailNormalized: adminEmail,
        passwordHash,
        status: 'ACTIVE',
        phone: null,
        phoneNormalized: null,
        profile: {
          create: {
            fullName: 'Phase 1 Admin',
            gender: 'UNSPECIFIED',
            termsVersion: 'test-2026-01',
            privacyVersion: 'test-2026-01',
            acceptedAt: new Date(),
          },
        },
        wallet: { create: { currency: 'ZENX', balance: 0n } },
      },
    });
    adminId = admin.id;
    await prisma.userRole.create({ data: { userId: admin.id, role: 'SUPER_ADMIN' } });

    memberEmail = `member-${Date.now()}@example.com`;
    const member = await prisma.user.create({
      data: {
        username: `member${Date.now()}`,
        usernameNormalized: memberEmail.split('@')[0],
        email: memberEmail,
        emailNormalized: memberEmail,
        passwordHash: await argon2.hash('MemberPassword123!'),
        status: 'ACTIVE',
        phone: '+84901234567',
        phoneNormalized: '+84901234567',
        phoneVerifiedAt: new Date(),
        profile: {
          create: {
            fullName: 'Phase 1 Member',
            gender: 'UNSPECIFIED',
            termsVersion: 'test-2026-01',
            privacyVersion: 'test-2026-01',
            acceptedAt: new Date(),
          },
        },
        wallet: { create: { currency: 'ZENX', balance: 1234n } },
      },
    });
    memberId = member.id;
    memberCitizenId = `079${Date.now().toString().slice(-9)}`;
    const encrypted = crypto.encrypt({
      citizenId: memberCitizenId,
      issuedAt: '2024-05-20',
      issuedPlace: 'Cục Cảnh sát',
    });
    await prisma.sensitiveProfile.create({
      data: {
        userId: member.id,
        citizenIdCiphertext: encrypted.ciphertext,
        citizenIdIv: encrypted.iv,
        citizenIdAuthTag: encrypted.authTag,
        citizenIdLookupHash: encrypted.lookupHash,
        citizenIdLast4: encrypted.last4,
      },
    });

    const adminLogin = await http()
      .post('/auth/login')
      .send({ username: adminEmail, password: adminPassword });
    expect(adminLogin.status).toBe(201);
    adminCookies = cookieHeader(adminLogin);
    const memberLogin = await http()
      .post('/auth/login')
      .send({ username: memberEmail, password: 'MemberPassword123!' });
    expect(memberLogin.status).toBe(201);
    memberCookies = cookieHeader(memberLogin);
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires a live SUPER_ADMIN role and returns dashboard/list/detail without secrets', async () => {
    const unauthenticated = await http().get('/admin/dashboard');
    expect(unauthenticated.status).toBe(401);

    const memberLogin = await http()
      .post('/auth/login')
      .send({ username: memberEmail, password: 'MemberPassword123!' });
    const forbidden = await http().get('/admin/dashboard').set('Cookie', cookieHeader(memberLogin));
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.error.code).toBe('ADMIN_ACCESS_REQUIRED');

    const dashboard = await http().get('/admin/dashboard').set('Cookie', adminCookies);
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.data.users.total).toBeGreaterThanOrEqual(2);
    expect(dashboard.body.data.users.byStatus.ACTIVE).toBeGreaterThanOrEqual(2);
    expect(dashboard.body.data).not.toHaveProperty('recentActivity');

    const list = await http()
      .get('/admin/users')
      .query({ search: memberEmail })
      .set('Cookie', adminCookies);
    expect(list.status).toBe(200);
    expect(list.body.data.items).toHaveLength(1);
    expect(list.body.data.items[0]).not.toHaveProperty('passwordHash');

    const detail = await http().get(`/admin/users/${memberId}`).set('Cookie', adminCookies);
    expect(detail.status).toBe(200);
    expect(detail.body.data.sensitiveProfile.identity).toEqual({
      configured: true,
      last4: memberCitizenId.slice(-4),
    });
    expect(detail.body.data).not.toHaveProperty('passwordHash');
    expect(detail.body.data).not.toHaveProperty('citizenIdCiphertext');
    expect(detail.body.data).not.toHaveProperty('secretCodeHash');
    expect(detail.body.data).not.toHaveProperty('auditLogs');
  });

  it('updates profile with uniqueness and optimistic concurrency checks', async () => {
    const before = (await http().get(`/admin/users/${memberId}`).set('Cookie', adminCookies)).body
      .data;
    const updated = await http()
      .patch(`/admin/users/${memberId}/profile`)
      .set('Cookie', adminCookies)
      .send({
        expectedUpdatedAt: before.updatedAt,
        fullName: 'Updated Admin Member',
        city: 'Đà Nẵng',
      });
    expect(updated.status).toBe(200);
    expect(updated.body.data.profile.fullName).toBe('Updated Admin Member');

    const nextEmail = `member-admin-${Date.now()}@example.com`;
    const contactUpdated = await http()
      .patch(`/admin/users/${memberId}/profile`)
      .set('Cookie', adminCookies)
      .send({
        expectedUpdatedAt: updated.body.data.updatedAt,
        email: nextEmail,
        emailVerified: true,
      });
    expect(contactUpdated.status).toBe(200);
    expect(contactUpdated.body.data.email).toBe(nextEmail);
    expect(contactUpdated.body.data.emailVerified).toBe(true);
    memberEmail = nextEmail;

    const duplicate = await http()
      .patch(`/admin/users/${memberId}/profile`)
      .set('Cookie', adminCookies)
      .send({
        expectedUpdatedAt: contactUpdated.body.data.updatedAt,
        email: adminEmail,
        emailVerified: false,
      });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('EMAIL_ALREADY_EXISTS');

    const stale = await http()
      .patch(`/admin/users/${memberId}/profile`)
      .set('Cookie', adminCookies)
      .send({
        expectedUpdatedAt: before.updatedAt,
        city: 'Hà Nội',
      });
    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe('STALE_ADMIN_UPDATE');
  });

  it('suspends/reactivates, revokes tokens, and protects the last super admin', async () => {
    const before = (await http().get(`/admin/users/${memberId}`).set('Cookie', adminCookies)).body
      .data;
    const suspended = await http()
      .patch(`/admin/users/${memberId}/status`)
      .set('Cookie', adminCookies)
      .send({
        expectedUpdatedAt: before.updatedAt,
        status: 'SUSPENDED',
      });
    expect(suspended.status).toBe(200);
    expect(suspended.body.data.status).toBe('SUSPENDED');
    const blocked = await http().get('/account/me').set('Cookie', memberCookies);
    expect(blocked.status).toBe(403);

    const reactivated = await http()
      .patch(`/admin/users/${memberId}/status`)
      .set('Cookie', adminCookies)
      .send({
        expectedUpdatedAt: suspended.body.data.updatedAt,
        status: 'ACTIVE',
      });
    expect(reactivated.status).toBe(200);
    const staleAccess = await http().get('/account/me').set('Cookie', memberCookies);
    expect(staleAccess.status).toBe(401);
    const revoked = await http()
      .post(`/admin/users/${memberId}/revoke-sessions`)
      .set('Cookie', adminCookies)
      .send();
    expect(revoked.status).toBe(201);

    const adminDetail = await http().get(`/admin/users/${adminId}`).set('Cookie', adminCookies);
    const lastAdmin = await http()
      .patch(`/admin/users/${adminId}/status`)
      .set('Cookie', adminCookies)
      .send({
        expectedUpdatedAt: adminDetail.body.data.updatedAt,
        status: 'SUSPENDED',
      });
    expect(lastAdmin.status).toBe(400);
    expect(lastAdmin.body.error.code).toBe('ADMIN_SELF_ACTION_FORBIDDEN');

    const memberDetailBeforeDelete = (await http().get(`/admin/users/${memberId}`).set('Cookie', adminCookies)).body.data;
    const deleteRes = await http()
      .delete(`/admin/users/${memberId}`)
      .set('Cookie', adminCookies)
      .send({ expectedUpdatedAt: memberDetailBeforeDelete.updatedAt });
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.status).toBe('DELETED');

    const deletedLogin = await http()
      .post('/auth/login')
      .send({ username: memberEmail, password: 'MemberPassword123!' });
    expect(deletedLogin.status).toBe(403);
    expect(deletedLogin.body.error.code).toBe('ACCOUNT_DELETED');

    const defaultListAfterDelete = await http()
      .get('/admin/users')
      .query({ search: memberEmail })
      .set('Cookie', adminCookies);
    expect(defaultListAfterDelete.status).toBe(200);
    expect(defaultListAfterDelete.body.data.items).toHaveLength(0);

    const deletedFilterList = await http()
      .get('/admin/users')
      .query({ search: memberEmail, status: 'DELETED' })
      .set('Cookie', adminCookies);
    expect(deletedFilterList.status).toBe(200);
    expect(deletedFilterList.body.data.items).toHaveLength(1);
    expect(deletedFilterList.body.data.items[0].id).toBe(memberId);

    const restoreRes = await http()
      .patch(`/admin/users/${memberId}/status`)
      .set('Cookie', adminCookies)
      .send({
        expectedUpdatedAt: deleteRes.body.data.updatedAt,
        status: 'ACTIVE',
      });
    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.data.status).toBe('ACTIVE');
  });

  it('sets a temporary password, enforces password change, reveals CCCD, and keeps wallet read-only', async () => {
    const before = (await http().get(`/admin/users/${memberId}`).set('Cookie', adminCookies)).body
      .data;
    const reset = await http()
      .post(`/admin/users/${memberId}/reset-password`)
      .set('Cookie', adminCookies)
      .send({
        expectedUpdatedAt: before.updatedAt,
        temporaryPassword: 'TemporaryPassword123!',
        temporaryPasswordConfirmation: 'TemporaryPassword123!',
      });
    expect(reset.status).toBe(201);

    const oldPassword = await http()
      .post('/auth/login')
      .send({ username: memberEmail, password: 'MemberPassword123!' });
    expect(oldPassword.status).toBe(401);
    const temporaryLogin = await http()
      .post('/auth/login')
      .send({ username: memberEmail, password: 'TemporaryPassword123!' });
    expect(temporaryLogin.status).toBe(201);
    const temporaryCookies = cookieHeader(temporaryLogin);
    const account = await http().get('/account/me').set('Cookie', temporaryCookies);
    expect(account.status).toBe(200);
    expect(account.body.data.mustChangePassword).toBe(true);
    const blockedWallet = await http().get('/wallet').set('Cookie', temporaryCookies);
    expect(blockedWallet.status).toBe(403);
    expect(blockedWallet.body.error.code).toBe('PASSWORD_CHANGE_REQUIRED');

    const changed = await http()
      .post('/account/change-password')
      .set('Cookie', temporaryCookies)
      .send({ currentPassword: 'TemporaryPassword123!', newPassword: 'MemberPassword456!' });
    expect(changed.status).toBe(201);
    expect((await http().get('/account/me').set('Cookie', temporaryCookies)).status).toBe(401);

    const detail = (await http().get(`/admin/users/${memberId}`).set('Cookie', adminCookies)).body
      .data;
    const revealed = await http()
      .post(`/admin/users/${memberId}/sensitive-profile/reveal`)
      .set('Cookie', adminCookies);
    expect(revealed.status).toBe(201);
    expect(revealed.body.data.identity).toEqual({
      citizenId: memberCitizenId,
      issuedAt: '2024-05-20',
      issuedPlace: 'Cục Cảnh sát',
    });

    const updatedCccd = '079090000999';
    const updateIdentity = await http()
      .patch(`/admin/users/${memberId}/sensitive-profile/identity`)
      .set('Cookie', adminCookies)
      .send({
        expectedUpdatedAt: detail.updatedAt,
        identity: {
          citizenId: updatedCccd,
          issuedAt: '2025-01-15',
          issuedPlace: 'Cục Cảnh sát QLHC về TTXH',
        },
      });
    expect(updateIdentity.status).toBe(200);
    expect(updateIdentity.body.data.sensitiveProfile.identity).toEqual({
      configured: true,
      last4: '0999',
    });

    const revealedUpdated = await http()
      .post(`/admin/users/${memberId}/sensitive-profile/reveal`)
      .set('Cookie', adminCookies);
    expect(revealedUpdated.status).toBe(201);
    expect(revealedUpdated.body.data.identity).toEqual({
      citizenId: updatedCccd,
      issuedAt: '2025-01-15',
      issuedPlace: 'Cục Cảnh sát QLHC về TTXH',
    });

    const auditRoute = await http().get('/admin/audit-logs').set('Cookie', adminCookies);
    expect(auditRoute.status).toBe(404);
    expect(detail.wallet.balance).toBe('1234');
  });

  function http() {
    return {
      get: (path: string) =>
        request(app.getHttpServer()).get(`/api/v1${path}`).set('Origin', 'http://localhost:3000'),
      post: (path: string) =>
        request(app.getHttpServer()).post(`/api/v1${path}`).set('Origin', 'http://localhost:3000'),
      patch: (path: string) =>
        request(app.getHttpServer()).patch(`/api/v1${path}`).set('Origin', 'http://localhost:3000'),
      delete: (path: string) =>
        request(app.getHttpServer()).delete(`/api/v1${path}`).set('Origin', 'http://localhost:3000'),
    };
  }

  function cookieHeader(response: { headers: Record<string, string | string[]> }) {
    const setCookie = response.headers['set-cookie'];
    return (Array.isArray(setCookie) ? setCookie : [setCookie])
      .map((cookie) => cookie.split(';')[0])
      .join('; ');
  }
});
