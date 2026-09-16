import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import cookieParser from 'cookie-parser';
import request = require('supertest');
import { AppModule } from '../../src/app.module';
import { ApiErrorFilter } from '../../src/common/error.filter';
import { ResponseInterceptor } from '../../src/common/response.interceptor';
import { PrismaService } from '../../src/database/prisma.service';

jest.setTimeout(30_000);

describe('Account OTP policy (SQL Server)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: string;
  let email: string;
  let phone: string;
  let cookies: string;

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

    const suffix = `${Date.now()}${Math.floor(Math.random() * 10_000)}`;
    email = `account-otp-${suffix}@example.com`;
    phone = `+849${suffix.slice(-8)}`;
    const username = `accountotp${suffix.slice(-8)}`;
    const user = await prisma.user.create({
      data: {
        username,
        usernameNormalized: username.toLowerCase(),
        email,
        emailNormalized: email.toLowerCase(),
        phone,
        phoneNormalized: phone,
        passwordHash: await argon2.hash('CurrentPassword123!'),
        status: 'ACTIVE',
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
    userId = user.id;
    await setOtpRequired(true);
    cookies = await login(email, 'CurrentPassword123!');
  });

  afterAll(async () => {
    await setOtpRequired(true);
    if (userId) {
      await prisma.$transaction([
        prisma.refreshSession.deleteMany({ where: { userId } }),
        prisma.wallet.deleteMany({ where: { userId } }),
        prisma.userProfile.deleteMany({ where: { userId } }),
        prisma.user.delete({ where: { id: userId } }),
      ]);
    }
    await app.close();
  });

  it('requires and verifies a user-bound SMS OTP for password changes', async () => {
    const send = await http().post('/account/change-password/otp').set('Cookie', cookies);
    expect(send.status).toBe(201);
    expect(send.body.data).toMatchObject({
      destination: '+84******' + phone.slice(-4),
      expiresIn: expect.any(Number),
      resendAfter: expect.any(Number),
    });

    const verify = await http()
      .post('/account/change-password/otp/verify')
      .set('Cookie', cookies)
      .send({ code: '123456' });
    expect(verify.status).toBe(201);
    const verificationToken = verify.body.data.verificationToken as string;

    const missing = await http()
      .post('/account/change-password')
      .set('Cookie', cookies)
      .send({ currentPassword: 'CurrentPassword123!', newPassword: 'NextPassword123!' });
    expect(missing.status).toBe(400);
    expect(missing.body.error.code).toBe('VERIFICATION_TOKEN_INVALID');

    const changed = await http()
      .post('/account/change-password')
      .set('Cookie', cookies)
      .send({
        currentPassword: 'CurrentPassword123!',
        newPassword: 'NextPassword123!',
        verificationToken,
      });
    expect(changed.status).toBe(201);
    await expect(prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { phoneVerifiedAt: true } }))
      .resolves.toMatchObject({ phoneVerifiedAt: expect.any(Date) });

    cookies = await login(email, 'NextPassword123!');
  });

  it('requires an OTP token for changing phone while enabled', async () => {
    const newPhone = `+849${(Number(phone.slice(-8)) + 1).toString().padStart(8, '0')}`;
    const unauthenticated = await http().post('/account/change-phone/otp');
    expect(unauthenticated.status).toBe(401);
    const sent = await http().post('/account/change-phone/otp').set('Cookie', cookies);
    expect(sent.status).toBe(201);
    expect(sent.body.data.destination).toBe('+84******' + phone.slice(-4));
    const verified = await http()
      .post('/account/change-phone/otp/verify')
      .set('Cookie', cookies)
      .send({ code: '123456' });
    expect(verified.status).toBe(201);

    const missing = await http()
      .post('/account/change-phone')
      .set('Cookie', cookies)
      .send({ newPhone });
    expect(missing.status).toBe(400);
    expect(missing.body.error.code).toBe('VERIFICATION_TOKEN_INVALID');

    const changed = await http()
      .post('/account/change-phone')
      .set('Cookie', cookies)
      .send({ newPhone, verificationToken: verified.body.data.verificationToken });
    expect(changed.status).toBe(201);
    phone = newPhone;
    await expect(prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { phoneVerifiedAt: true } }))
      .resolves.toEqual({ phoneVerifiedAt: null });
  });

  it('requires reset-password verification while the shared policy is enabled', async () => {
    const response = await http().post('/auth/reset-password').send({
      email,
      newPassword: 'RejectedResetPassword123!',
    });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VERIFICATION_TOKEN_INVALID');
  });

  it('disables OTP for password, phone, and reset-password operations', async () => {
    await setOtpRequired(false);

    const phoneOtpOff = await http().post('/account/change-phone/otp').set('Cookie', cookies);
    expect(phoneOtpOff.status).toBe(400);
    expect(phoneOtpOff.body.error.code).toBe('OTP_NOT_REQUIRED');

    const directPhone = `+849${(Number(phone.slice(-8)) + 2).toString().padStart(8, '0')}`;
    const phoneChange = await http()
      .post('/account/change-phone')
      .set('Cookie', cookies)
      .send({ newPhone: directPhone });
    expect(phoneChange.status).toBe(201);
    phone = directPhone;
    await expect(prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { phoneVerifiedAt: true } }))
      .resolves.toEqual({ phoneVerifiedAt: null });

    const passwordChange = await http()
      .post('/account/change-password')
      .set('Cookie', cookies)
      .send({ currentPassword: 'NextPassword123!', newPassword: 'DirectPassword123!' });
    expect(passwordChange.status).toBe(201);
    cookies = await login(email, 'DirectPassword123!');

    const beforeOtpRequests = await prisma.otpRequest.count({ where: { purpose: 'RESET_PASSWORD', destinationNormalized: email } });
    const forgot = await http().post('/auth/forgot-password').send({ email });
    expect(forgot.status).toBe(201);
    const afterOtpRequests = await prisma.otpRequest.count({ where: { purpose: 'RESET_PASSWORD', destinationNormalized: email } });
    expect(afterOtpRequests).toBe(beforeOtpRequests);

    const reset = await http().post('/auth/reset-password').send({
      email,
      newPassword: 'ResetPassword123!',
    });
    expect(reset.status).toBe(201);
    cookies = await login(email, 'ResetPassword123!');
    expect(cookies.length).toBeGreaterThan(0);
  });

  it('keeps public password-change OTP endpoints private', async () => {
    const send = await http().post('/otp/send').send({
      channel: 'SMS',
      purpose: 'CHANGE_PASSWORD',
      destination: phone,
    });
    expect(send.status).toBe(400);
    expect(send.body.error.code).toBe('OTP_PURPOSE_RESTRICTED');

    const phoneChange = await http().post('/otp/send').send({
      channel: 'SMS',
      purpose: 'CHANGE_PHONE',
      destination: phone,
    });
    expect(phoneChange.status).toBe(400);
    expect(phoneChange.body.error.code).toBe('OTP_PURPOSE_RESTRICTED');

    const phoneVerify = await http().post('/otp/verify').send({
      channel: 'SMS',
      purpose: 'CHANGE_PHONE',
      destination: phone,
      code: '123456',
    });
    expect(phoneVerify.status).toBe(400);
    expect(phoneVerify.body.error.code).toBe('OTP_PURPOSE_RESTRICTED');
  });

  it('fails closed to OTP when settings cannot be read', async () => {
    const saved = await prisma.authSettings.findUniqueOrThrow({ where: { id: 1 } });
    await prisma.authSettings.delete({ where: { id: 1 } });
    try {
      const response = await http()
        .post('/account/change-password')
        .set('Cookie', cookies)
        .send({ currentPassword: 'ResetPassword123!', newPassword: 'UnavailablePassword123!' });
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VERIFICATION_TOKEN_INVALID');
    } finally {
      await prisma.authSettings.create({ data: saved });
    }
  });

  it('consumes valid tokens supplied after the shared policy is disabled', async () => {
    await setOtpRequired(true);

    const passwordOtp = await http().post('/account/change-password/otp').set('Cookie', cookies);
    expect(passwordOtp.status).toBe(201);
    const passwordVerification = await http()
      .post('/account/change-password/otp/verify')
      .set('Cookie', cookies)
      .send({ code: '123456' });
    expect(passwordVerification.status).toBe(201);

    const verifiedPhone = `+849${(Number(phone.slice(-8)) + 1).toString().padStart(8, '0')}`;
    const phoneOtp = await http().post('/account/change-phone/otp').set('Cookie', cookies);
    expect(phoneOtp.status).toBe(201);
    const phoneVerification = await http()
      .post('/account/change-phone/otp/verify')
      .set('Cookie', cookies)
      .send({ code: '123456' });
    expect(phoneVerification.status).toBe(201);

    await setOtpRequired(false);
    const passwordChange = await http()
      .post('/account/change-password')
      .set('Cookie', cookies)
      .send({
        currentPassword: 'ResetPassword123!',
        newPassword: 'OptionalPassword123!',
        verificationToken: passwordVerification.body.data.verificationToken,
      });
    expect(passwordChange.status).toBe(201);
    await expect(prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { phoneVerifiedAt: true } }))
      .resolves.toMatchObject({ phoneVerifiedAt: expect.any(Date) });

    cookies = await login(email, 'OptionalPassword123!');
    const phoneChange = await http()
      .post('/account/change-phone')
      .set('Cookie', cookies)
      .send({ newPhone: verifiedPhone, verificationToken: phoneVerification.body.data.verificationToken });
    expect(phoneChange.status).toBe(201);
    phone = verifiedPhone;
    await expect(prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { phoneVerifiedAt: true } }))
      .resolves.toEqual({ phoneVerifiedAt: null });
  });

  async function setOtpRequired(value: boolean) {
    await prisma.authSettings.update({ where: { id: 1 }, data: { phoneRegistrationOtpRequired: value } });
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
    };
  }

  function cookieHeader(response: { headers: Record<string, string | string[]> }) {
    const value = response.headers['set-cookie'];
    return (Array.isArray(value) ? value : [value]).map((cookie) => cookie.split(';')[0]).join('; ');
  }
});
