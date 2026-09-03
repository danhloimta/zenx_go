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

describe('Sensitive profile API (SQL Server)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cookies = '';
  let userId = '';
  let email = '';
  let phone = '';

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

    const suffix = Date.now().toString();
    email = `sensitive-${suffix}@example.com`;
    phone = `+849${suffix.slice(-8)}`;
    const verificationToken = await verifyPublicOtp(phone, 'VERIFY_PHONE');
    const registered = await http()
      .post('/auth/register')
      .send({
        username: `sensitive${suffix.slice(-8)}`,
        email,
        phone,
        password: 'Password123!',
        verificationToken,
        acceptTerms: true,
        acceptPrivacy: true,
      });
    expect(registered.status).toBe(201);
    userId = registered.body.data.user.id;
    cookies = cookieHeader(registered);
  });

  afterAll(async () => {
    await app.close();
  });

  it('keeps sensitive profile separate, encrypted, and protected by an OTP-bound token', async () => {
    const questions = await http()
      .get('/account/sensitive-profile/questions')
      .set('Cookie', cookies);
    expect(questions.status).toBe(200);
    expect(questions.body.data).toEqual([
      { code: 'CHILDHOOD_NICKNAME', label: 'Biệt danh thời thơ ấu của bạn là gì?' },
      { code: 'FIRST_SCHOOL', label: 'Tên ngôi trường đầu tiên của bạn là gì?' },
      { code: 'FIRST_PET', label: 'Tên thú cưng đầu tiên của bạn là gì?' },
      { code: 'FAVORITE_TEACHER', label: 'Tên giáo viên bạn yêu thích là gì?' },
      { code: 'MEMORABLE_PLACE', label: 'Địa điểm đáng nhớ nhất của bạn là ở đâu?' },
    ]);

    const initial = await http().get('/account/sensitive-profile').set('Cookie', cookies);
    expect(initial.status).toBe(200);
    expect(initial.body.data).toEqual({
      identity: { configured: false, last4: null },
      security: { configured: false, questionCode: null },
    });

    const genericOtp = await http()
      .post('/otp/send')
      .send({ channel: 'SMS', purpose: 'MANAGE_SENSITIVE_PROFILE', destination: phone });
    expect(genericOtp.status).toBe(400);
    expect(genericOtp.body.error.code).toBe('INVALID_SENSITIVE_PROFILE');

    const sent = await http().post('/account/sensitive-profile/otp').set('Cookie', cookies);
    expect(sent.status).toBe(201);
    expect(sent.body.data).toMatchObject({
      channel: 'SMS',
      destination: expect.stringContaining('******'),
    });
    const access = await http()
      .post('/account/sensitive-profile/otp/verify')
      .set('Cookie', cookies)
      .send({ channel: 'SMS', code: '123456' });
    expect(access.status).toBe(201);
    const accessToken = access.body.data.accessToken as string;

    const invalid = await http()
      .patch('/account/sensitive-profile')
      .set('Cookie', cookies)
      .send({
        accessToken,
        identity: { citizenId: '123', issuedAt: '2024-01-01', issuedPlace: 'Hà Nội' },
      });
    expect(invalid.status).toBe(400);

    const futureIssueDate = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    const future = await http()
      .patch('/account/sensitive-profile')
      .set('Cookie', cookies)
      .send({
        accessToken,
        identity: { citizenId: '079123456790', issuedAt: futureIssueDate, issuedPlace: 'Hà Nội' },
      });
    expect(future.status).toBe(400);

    const invalidPlace = await http()
      .patch('/account/sensitive-profile')
      .set('Cookie', cookies)
      .send({
        accessToken,
        identity: { citizenId: '079123456790', issuedAt: '2024-05-20', issuedPlace: ' ' },
      });
    expect(invalidPlace.status).toBe(400);

    const updated = await http()
      .patch('/account/sensitive-profile')
      .set('Cookie', cookies)
      .send({
        accessToken,
        identity: {
          citizenId: '079123456789',
          issuedAt: '2024-05-20',
          issuedPlace: 'Cục Cảnh sát quản lý hành chính',
        },
        security: {
          secretCode: '123456',
          secretCodeConfirmation: '123456',
          questionCode: 'FIRST_SCHOOL',
          answer: 'Trường Ánh Dương',
        },
      });
    expect(updated.status).toBe(200);
    expect(updated.body.data).toEqual({
      identity: { configured: true, last4: '6789' },
      security: { configured: true, questionCode: 'FIRST_SCHOOL' },
    });

    const row = await prisma.sensitiveProfile.findUniqueOrThrow({ where: { userId } });
    expect(row.citizenIdCiphertext).not.toContain('079123456789');
    expect(row.secretCodeHash).not.toBe('123456');
    expect(row.securityAnswerHash).not.toContain('Trường');
    const account = await http().get('/account/me').set('Cookie', cookies);
    expect(account.body.data).not.toHaveProperty('sensitiveProfile');
    expect(account.body.data).not.toHaveProperty('citizenId');
    const sensitiveAsAccess = await http()
      .get('/account/me')
      .set('Cookie', `zenx_access=${accessToken}`);
    expect(sensitiveAsAccess.status).toBe(401);

    const wrongReveal = await http()
      .post('/account/sensitive-profile/reveal')
      .set('Cookie', cookies)
      .send({ accessToken: 'wrong-token-value-that-is-long-enough' });
    expect(wrongReveal.status).toBe(401);

    const answerChallenge = await http()
      .post('/account/sensitive-profile/challenge')
      .set('Cookie', cookies)
      .send({ method: 'SECURITY_ANSWER', value: '  trường   ánh dương ' });
    expect(answerChallenge.status).toBe(201);
    const revealed = await http()
      .post('/account/sensitive-profile/reveal')
      .set('Cookie', cookies)
      .send({ accessToken: answerChallenge.body.data.accessToken });
    expect(revealed.status).toBe(201);
    expect(revealed.body.data.identity).toEqual({
      citizenId: '079123456789',
      issuedAt: '2024-05-20',
      issuedPlace: 'Cục Cảnh sát quản lý hành chính',
    });
    expect(revealed.body.data).not.toHaveProperty('secretCode');
  });

  it('supports challenge lockout, version invalidation, and deletion rules', async () => {
    const oldChallenge = await http()
      .post('/account/sensitive-profile/challenge')
      .set('Cookie', cookies)
      .send({ method: 'SECRET_CODE', value: '123456' });
    expect(oldChallenge.status).toBe(201);
    const oldToken = oldChallenge.body.data.accessToken as string;

    const changed = await http()
      .patch('/account/sensitive-profile')
      .set('Cookie', cookies)
      .send({
        accessToken: oldToken,
        security: {
          secretCode: '654321',
          secretCodeConfirmation: '654321',
          questionCode: 'FIRST_SCHOOL',
          answer: 'Trường Ánh Dương',
        },
      });
    expect(changed.status).toBe(200);
    const stale = await http()
      .post('/account/sensitive-profile/reveal')
      .set('Cookie', cookies)
      .send({ accessToken: oldToken });
    expect(stale.status).toBe(401);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const wrong = await http()
        .post('/account/sensitive-profile/challenge')
        .set('Cookie', cookies)
        .send({ method: 'SECRET_CODE', value: '000000' });
      expect(wrong.status).toBe(attempt === 4 ? 429 : 400);
    }
    const locked = await http()
      .post('/account/sensitive-profile/challenge')
      .set('Cookie', cookies)
      .send({ method: 'SECRET_CODE', value: '654321' });
    expect(locked.status).toBe(429);

    await prisma.sensitiveProfile.update({
      where: { userId },
      data: { failedChallengeCount: 0, challengeLockedUntil: new Date(Date.now() - 1_000) },
    });
    const identityToken = (
      await http()
        .post('/account/sensitive-profile/challenge')
        .set('Cookie', cookies)
        .send({ method: 'SECRET_CODE', value: '654321' })
    ).body.data.accessToken as string;
    const removedIdentity = await http()
      .patch('/account/sensitive-profile')
      .set('Cookie', cookies)
      .send({ accessToken: identityToken, identity: null });
    expect(removedIdentity.status).toBe(200);
    expect(removedIdentity.body.data.identity.configured).toBe(false);

    const securityToken = (
      await http()
        .post('/account/sensitive-profile/challenge')
        .set('Cookie', cookies)
        .send({ method: 'SECURITY_ANSWER', value: 'Trường Ánh Dương' })
    ).body.data.accessToken as string;
    const removedAll = await http()
      .patch('/account/sensitive-profile')
      .set('Cookie', cookies)
      .send({ accessToken: securityToken, identity: null, security: null });
    expect(removedAll.status).toBe(200);
    expect(removedAll.body.data).toEqual({
      identity: { configured: false, last4: null },
      security: { configured: false, questionCode: null },
    });
    await expect(prisma.sensitiveProfile.findUnique({ where: { userId } })).resolves.toBeNull();
  });

  it('falls back to verified email when phone verification is unavailable', async () => {
    await prisma.user.update({
      where: { id: userId },
      data: { phoneVerifiedAt: null, emailVerifiedAt: new Date() },
    });
    const sent = await http().post('/account/sensitive-profile/otp').set('Cookie', cookies);
    expect(sent.status).toBe(201);
    expect(sent.body.data.channel).toBe('EMAIL');
    expect(sent.body.data.destination).toContain('@');
    const verified = await http()
      .post('/account/sensitive-profile/otp/verify')
      .set('Cookie', cookies)
      .send({ channel: 'EMAIL', code: '123456' });
    expect(verified.status).toBe(201);
    await prisma.user.update({ where: { id: userId }, data: { phoneVerifiedAt: new Date() } });
  });

  it('rejects OTP recovery when neither contact method is verified', async () => {
    await prisma.user.update({
      where: { id: userId },
      data: { phoneVerifiedAt: null, emailVerifiedAt: null },
    });
    const response = await http().post('/account/sensitive-profile/otp').set('Cookie', cookies);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('SENSITIVE_PROFILE_OTP_UNAVAILABLE');
    await prisma.user.update({ where: { id: userId }, data: { phoneVerifiedAt: new Date() } });
  });

  async function verifyPublicOtp(
    destination: string,
    purpose: string,
    channel: 'SMS' | 'EMAIL' = 'SMS',
  ) {
    const sent = await http().post('/otp/send').send({ channel, purpose, destination });
    expect(sent.status).toBe(201);
    const verified = await http()
      .post('/otp/verify')
      .send({ channel, purpose, destination, code: '123456' });
    expect(verified.status).toBe(201);
    return verified.body.data.verificationToken as string;
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
