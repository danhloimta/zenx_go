import { DomainError } from '../common/errors';
import { AuthSettingsService } from './auth-settings.service';

const UPDATED_AT = new Date('2026-09-15T10:00:00.000Z');
const NEXT_UPDATED_AT = new Date('2026-09-15T10:01:00.000Z');

const enabledSettings = {
  googleLoginRegistrationEnabled: true,
  facebookLoginRegistrationEnabled: false,
  updatedAt: UPDATED_AT,
};

function setup() {
  const authSettings = {
    findUnique: jest.fn(),
    updateMany: jest.fn(),
  };
  const service = new AuthSettingsService({ authSettings } as any);
  return { authSettings, service };
}

describe('AuthSettingsService', () => {
  it('reads only the singleton public/admin fields', async () => {
    const { authSettings, service } = setup();
    authSettings.findUnique.mockResolvedValue(enabledSettings);

    await expect(service.readCurrent()).resolves.toEqual(enabledSettings);
    expect(authSettings.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: {
        googleLoginRegistrationEnabled: true,
        facebookLoginRegistrationEnabled: true,
        updatedAt: true,
      },
    });
  });

  it('performs a fresh read and safely projects provider availability', async () => {
    const { authSettings, service } = setup();
    authSettings.findUnique
      .mockResolvedValueOnce(enabledSettings)
      .mockResolvedValueOnce({
        googleLoginRegistrationEnabled: false,
        facebookLoginRegistrationEnabled: true,
        updatedAt: NEXT_UPDATED_AT,
      });

    await expect(service.providerAvailability()).resolves.toEqual({
      google: true,
      facebook: false,
    });
    await expect(service.providerAvailability()).resolves.toEqual({
      google: false,
      facebook: true,
    });
    expect(authSettings.findUnique).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['GOOGLE', { ...enabledSettings, googleLoginRegistrationEnabled: false }],
    ['FACEBOOK', enabledSettings],
  ] as const)('rejects disabled %s login and registration from a fresh read', async (provider, row) => {
    const { authSettings, service } = setup();
    authSettings.findUnique.mockResolvedValue(row);

    await expect(service.assertLoginRegistrationEnabled(provider)).rejects.toMatchObject({
      code: 'SOCIAL_PROVIDER_DISABLED',
    } satisfies Partial<DomainError>);
    expect(authSettings.findUnique).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['GOOGLE', enabledSettings],
    ['FACEBOOK', { ...enabledSettings, facebookLoginRegistrationEnabled: true }],
  ] as const)('allows enabled %s login and registration from a fresh read', async (provider, row) => {
    const { authSettings, service } = setup();
    authSettings.findUnique.mockResolvedValue(row);

    await expect(service.assertLoginRegistrationEnabled(provider)).resolves.toBeUndefined();
    expect(authSettings.findUnique).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['a missing singleton', null],
    ['a rejected database read', new Error('database unavailable')],
  ] as const)('fails closed when reading encounters %s', async (_case, result) => {
    const { authSettings, service } = setup();
    if (result instanceof Error) authSettings.findUnique.mockRejectedValue(result);
    else authSettings.findUnique.mockResolvedValue(result);

    await expect(service.readCurrent()).rejects.toMatchObject({
      code: 'SETTINGS_UNAVAILABLE',
      status: 503,
    } satisfies Partial<DomainError>);
  });

  it('updates only supplied flags with optimistic concurrency and returns a fresh reread', async () => {
    const { authSettings, service } = setup();
    const updated = {
      googleLoginRegistrationEnabled: false,
      facebookLoginRegistrationEnabled: false,
      updatedAt: NEXT_UPDATED_AT,
    };
    authSettings.updateMany.mockResolvedValue({ count: 1 });
    authSettings.findUnique.mockResolvedValue(updated);

    await expect(service.update({
      expectedUpdatedAt: UPDATED_AT.toISOString(),
      googleLoginRegistrationEnabled: false,
    })).resolves.toEqual(updated);
    expect(authSettings.updateMany).toHaveBeenCalledWith({
      where: { id: 1, updatedAt: UPDATED_AT },
      data: { googleLoginRegistrationEnabled: false },
    });
    expect(authSettings.findUnique).toHaveBeenCalledTimes(1);
  });

  it('preserves an explicitly supplied facebook flag in the partial update', async () => {
    const { authSettings, service } = setup();
    authSettings.updateMany.mockResolvedValue({ count: 1 });
    authSettings.findUnique.mockResolvedValue({
      ...enabledSettings,
      facebookLoginRegistrationEnabled: true,
      updatedAt: NEXT_UPDATED_AT,
    });

    await service.update({
      expectedUpdatedAt: UPDATED_AT.toISOString(),
      facebookLoginRegistrationEnabled: true,
    });

    expect(authSettings.updateMany).toHaveBeenCalledWith({
      where: { id: 1, updatedAt: UPDATED_AT },
      data: { facebookLoginRegistrationEnabled: true },
    });
  });

  it('reports a stale update when the compare-and-swap misses an extant row', async () => {
    const { authSettings, service } = setup();
    authSettings.updateMany.mockResolvedValue({ count: 0 });
    authSettings.findUnique.mockResolvedValue(enabledSettings);

    await expect(service.update({
      expectedUpdatedAt: '2026-09-15T09:59:00.000Z',
      googleLoginRegistrationEnabled: false,
    })).rejects.toMatchObject({
      code: 'STALE_AUTH_SETTINGS_UPDATE',
      status: 409,
    } satisfies Partial<DomainError>);
    expect(authSettings.findUnique).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['the singleton disappeared', null],
    ['the distinguishing reread fails', new Error('database unavailable')],
  ] as const)('fails closed when a missed update finds that %s', async (_case, result) => {
    const { authSettings, service } = setup();
    authSettings.updateMany.mockResolvedValue({ count: 0 });
    if (result instanceof Error) authSettings.findUnique.mockRejectedValue(result);
    else authSettings.findUnique.mockResolvedValue(result);

    await expect(service.update({
      expectedUpdatedAt: UPDATED_AT.toISOString(),
      googleLoginRegistrationEnabled: false,
    })).rejects.toMatchObject({
      code: 'SETTINGS_UNAVAILABLE',
      status: 503,
    } satisfies Partial<DomainError>);
  });

  it('translates rejected writes to unavailable settings', async () => {
    const { authSettings, service } = setup();
    authSettings.updateMany.mockRejectedValue(new Error('database unavailable'));

    await expect(service.update({
      expectedUpdatedAt: UPDATED_AT.toISOString(),
      googleLoginRegistrationEnabled: false,
    })).rejects.toMatchObject({
      code: 'SETTINGS_UNAVAILABLE',
      status: 503,
    } satisfies Partial<DomainError>);
  });
});
