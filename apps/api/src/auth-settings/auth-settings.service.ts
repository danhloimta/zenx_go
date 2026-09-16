import { Injectable } from '@nestjs/common';
import { SocialProvider } from '../common/domain';
import { DomainError, ErrorCode } from '../common/errors';
import { PrismaService } from '../database/prisma.service';

export type AuthSettingsState = {
  googleLoginRegistrationEnabled: boolean;
  facebookLoginRegistrationEnabled: boolean;
  updatedAt: Date;
};

export type AuthProviderAvailability = { google: boolean; facebook: boolean };

export type UpdateAuthSettingsInput = {
  expectedUpdatedAt: string;
  googleLoginRegistrationEnabled?: boolean;
  facebookLoginRegistrationEnabled?: boolean;
};

const AUTH_SETTINGS_SELECT = {
  googleLoginRegistrationEnabled: true,
  facebookLoginRegistrationEnabled: true,
  updatedAt: true,
} as const;

@Injectable()
export class AuthSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async readCurrent(): Promise<AuthSettingsState> {
    try {
      const settings = await this.prisma.authSettings.findUnique({
        where: { id: 1 },
        select: AUTH_SETTINGS_SELECT,
      });
      if (!settings) throw this.unavailable();
      return settings;
    } catch {
      throw this.unavailable();
    }
  }

  async providerAvailability(): Promise<AuthProviderAvailability> {
    const settings = await this.readCurrent();
    return {
      google: settings.googleLoginRegistrationEnabled,
      facebook: settings.facebookLoginRegistrationEnabled,
    };
  }

  async update(input: UpdateAuthSettingsInput): Promise<AuthSettingsState> {
    const data = {
      ...(input.googleLoginRegistrationEnabled !== undefined
        ? { googleLoginRegistrationEnabled: input.googleLoginRegistrationEnabled }
        : {}),
      ...(input.facebookLoginRegistrationEnabled !== undefined
        ? { facebookLoginRegistrationEnabled: input.facebookLoginRegistrationEnabled }
        : {}),
    };

    let count: number;
    try {
      ({ count } = await this.prisma.authSettings.updateMany({
        where: { id: 1, updatedAt: new Date(input.expectedUpdatedAt) },
        data,
      }));
    } catch {
      throw this.unavailable();
    }

    if (count === 0) {
      await this.readCurrent();
      throw new DomainError(
        ErrorCode.STALE_AUTH_SETTINGS_UPDATE,
        'Authentication settings were changed by another administrator',
        409,
      );
    }

    return this.readCurrent();
  }

  async assertLoginRegistrationEnabled(provider: SocialProvider): Promise<void> {
    const settings = await this.readCurrent();
    const enabled = provider === 'GOOGLE'
      ? settings.googleLoginRegistrationEnabled
      : settings.facebookLoginRegistrationEnabled;
    if (!enabled) {
      throw new DomainError(
        ErrorCode.SOCIAL_PROVIDER_DISABLED,
        'Social login and registration are disabled for this provider',
      );
    }
  }

  private unavailable(): DomainError {
    return new DomainError(
      ErrorCode.SETTINGS_UNAVAILABLE,
      'Authentication settings are unavailable',
      503,
    );
  }
}
