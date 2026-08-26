import * as argon2 from 'argon2';
import { MockMailProvider, MockOtpProvider, OtpService } from './otp.service';

describe('OtpService demo mode', () => {
  it('uses the configured fixed code only for mock demo OTP', async () => {
    const prisma = {
      otpRequest: {
        findFirst: jest.fn().mockResolvedValue(null),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({ id: 'otp-1' }),
      },
    };
    const config = {
      get: (key: string) => ({
        nodeEnv: 'development',
        demoMode: true,
        otpSmsProvider: 'mock',
        otpMockFixedCode: '123456',
      } as Record<string, unknown>)[key],
    };
    const service = new OtpService(prisma as never, config as never, new MockOtpProvider(), new MockMailProvider());

    await service.send({ channel: 'SMS', purpose: 'VERIFY_PHONE', destination: '+84901234567' });

    const codeHash = prisma.otpRequest.create.mock.calls[0]?.[0]?.data.codeHash as string;
    await expect(argon2.verify(codeHash, '123456')).resolves.toBe(true);
  });
});
