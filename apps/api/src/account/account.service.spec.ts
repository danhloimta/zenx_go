import { DomainError } from '../common/errors';
import { AccountService } from './account.service';

describe('AccountService OTP policy', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    refreshSession: { updateMany: jest.fn() },
    $transaction: jest.fn(),
    userProfile: { findUnique: jest.fn(), update: jest.fn() },
  };
  const otp = {
    send: jest.fn(),
    verify: jest.fn(),
    consumeVerificationToken: jest.fn(),
  };
  const config = { getOrThrow: jest.fn().mockReturnValue('test') };
  const settings = { isOtpRequired: jest.fn() };

  let service: AccountService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new (AccountService as any)(prisma, otp, config, settings);
    prisma.$transaction.mockImplementation(async (operation: unknown) =>
      typeof operation === 'function' ? operation(prisma) : operation,
    );
    prisma.user.update.mockResolvedValue({});
    prisma.user.updateMany.mockResolvedValue({ count: 1 });
    prisma.refreshSession.updateMany.mockResolvedValue({ count: 1 });
    prisma.user.findFirst.mockResolvedValue(null);
  });

  it('sends password-change OTP only to the current phone and binds it to the user', async () => {
    settings.isOtpRequired.mockResolvedValue(true);
    prisma.user.findUnique.mockResolvedValue({ phone: '+84901234567' });
    otp.send.mockResolvedValue({ expiresIn: 600, resendAfter: 60, requestId: 'otp-1' });

    await expect((service as any).sendChangePasswordOtp('user-1')).resolves.toMatchObject({
      destination: '+84******4567',
      expiresIn: 600,
      resendAfter: 60,
    });
    expect(otp.send).toHaveBeenCalledWith({
      channel: 'SMS',
      purpose: 'CHANGE_PASSWORD',
      destination: '+84901234567',
      userId: 'user-1',
    });
  });

  it('rejects password-change OTP when the account has no phone', async () => {
    settings.isOtpRequired.mockResolvedValue(true);
    prisma.user.findUnique.mockResolvedValue({ phone: null });

    await expect((service as any).sendChangePasswordOtp('user-1')).rejects.toMatchObject({
      code: 'PASSWORD_CHANGE_OTP_UNAVAILABLE',
    } satisfies Partial<DomainError>);
    expect(otp.send).not.toHaveBeenCalled();
  });

  it('verifies password-change OTP against the current phone and user id', async () => {
    settings.isOtpRequired.mockResolvedValue(true);
    prisma.user.findUnique.mockResolvedValue({ phone: '+84901234567' });
    otp.verify.mockResolvedValue({ verificationToken: 'verification-token', expiresIn: 600 });

    await expect((service as any).verifyChangePasswordOtp('user-1', { code: '123456' })).resolves.toEqual({
      verificationToken: 'verification-token',
      expiresIn: 600,
    });
    expect(otp.verify).toHaveBeenCalledWith({
      channel: 'SMS',
      purpose: 'CHANGE_PASSWORD',
      destination: '+84901234567',
      code: '123456',
      userId: 'user-1',
    });
  });

  it('requires a password-change verification token when OTP is enabled', async () => {
    settings.isOtpRequired.mockResolvedValue(true);
    prisma.user.findUnique.mockResolvedValue({
      phone: '+84901234567',
      passwordHash: null,
      mustChangePassword: false,
    });

    await expect(service.changePassword('user-1', {
      newPassword: 'NewPassword123!',
    } as any)).rejects.toMatchObject({
      code: 'VERIFICATION_TOKEN_INVALID',
    } satisfies Partial<DomainError>);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('marks the current phone verified after a valid password-change OTP', async () => {
    settings.isOtpRequired.mockResolvedValue(true);
    prisma.user.findUnique.mockResolvedValue({
      phone: '+84901234567',
      phoneVerifiedAt: null,
      passwordHash: null,
      mustChangePassword: false,
    });
    otp.consumeVerificationToken.mockResolvedValue({});

    await expect(service.changePassword('user-1', {
      newPassword: 'NewPassword123!',
      verificationToken: 'verification-token',
    } as any)).resolves.toEqual({ changed: true });
    expect(otp.consumeVerificationToken).toHaveBeenCalledWith(
      'verification-token',
      'CHANGE_PASSWORD',
      '+84901234567',
      'user-1',
      'SMS',
    );
    expect(prisma.user.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-1', phoneNormalized: '+84901234567' },
      data: expect.objectContaining({ phoneVerifiedAt: expect.any(Date) }),
    }));
  });

  it('changes phone without OTP when the shared policy is disabled', async () => {
    settings.isOtpRequired.mockResolvedValue(false);
    prisma.user.update.mockResolvedValue({});

    await expect(service.changePhone('user-1', {
      newPhone: '+84909876543',
    } as any)).resolves.toEqual({ changed: true });
    expect(otp.consumeVerificationToken).not.toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        phone: '+84909876543',
        phoneNormalized: '+84909876543',
        phoneVerifiedAt: null,
      },
    });
  });

  it('consumes an optional password-change token when OTP is disabled', async () => {
    settings.isOtpRequired.mockResolvedValue(false);
    prisma.user.findUnique.mockResolvedValue({
      phone: '+84901234567',
      phoneVerifiedAt: null,
      passwordHash: null,
      mustChangePassword: false,
    });
    otp.consumeVerificationToken.mockResolvedValue({});

    await expect(service.changePassword('user-1', {
      newPassword: 'NewPassword123!',
      verificationToken: 'verification-token',
    } as any)).resolves.toEqual({ changed: true });
    expect(otp.consumeVerificationToken).toHaveBeenCalledWith(
      'verification-token',
      'CHANGE_PASSWORD',
      '+84901234567',
      'user-1',
      'SMS',
    );
    expect(prisma.user.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-1', phoneNormalized: '+84901234567' },
      data: expect.objectContaining({ phoneVerifiedAt: expect.any(Date) }),
    }));
  });

  it('consumes an optional phone-change token when OTP is disabled', async () => {
    settings.isOtpRequired.mockResolvedValue(false);
    otp.consumeVerificationToken.mockResolvedValue({});

    await expect(service.changePhone('user-1', {
      newPhone: '+84909876543',
      verificationToken: 'verification-token',
    } as any)).resolves.toEqual({ changed: true });
    expect(otp.consumeVerificationToken).toHaveBeenCalledWith(
      'verification-token',
      'CHANGE_PHONE',
      '+84909876543',
    );
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        phone: '+84909876543',
        phoneNormalized: '+84909876543',
        phoneVerifiedAt: expect.any(Date),
      },
    });
  });

  it('does not mark a replacement phone verified when the original phone changed before persistence', async () => {
    settings.isOtpRequired.mockResolvedValue(true);
    prisma.user.findUnique.mockResolvedValue({
      phone: '+84901234567',
      phoneVerifiedAt: null,
      passwordHash: null,
      mustChangePassword: false,
    });
    otp.consumeVerificationToken.mockResolvedValue({});
    const tx = {
      user: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        update: jest.fn().mockResolvedValue({}),
      },
      refreshSession: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    prisma.$transaction.mockImplementation(async (callback: (client: typeof tx) => Promise<unknown>) =>
      callback(tx),
    );

    await expect(service.changePassword('user-1', {
      newPassword: 'NewPassword123!',
      verificationToken: 'verification-token',
    } as any)).resolves.toEqual({ changed: true });
    expect(tx.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'user-1', phoneNormalized: '+84901234567' },
      data: expect.objectContaining({ phoneVerifiedAt: expect.any(Date) }),
    });
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: expect.not.objectContaining({ phoneVerifiedAt: expect.anything() }),
    });
  });
});
