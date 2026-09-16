import { Injectable } from '@nestjs/common';
import { SocialProvider } from '../common/domain';
import { DomainError, ErrorCode } from '../common/errors';
import { PrismaService } from '../database/prisma.service';

export type AuthSettingsState = {
  googleLoginRegistrationEnabled: boolean;
  facebookLoginRegistrationEnabled: boolean;
  otpRequired: boolean;
  /** @deprecated API compatibility alias; persisted via the legacy column. */
  phoneRegistrationOtpRequired: boolean;
  updatedAt: Date;
};

export type AuthProviderAvailability = {
  google: boolean;
  facebook: boolean;
  otpRequired: boolean;
  /** @deprecated API compatibility alias. */
  phoneRegistrationOtpRequired: boolean;
};

export type UpdateAuthSettingsInput = {
  expectedUpdatedAt: string;
  googleLoginRegistrationEnabled?: boolean;
  facebookLoginRegistrationEnabled?: boolean;
  otpRequired?: boolean;
  /** @deprecated Use otpRequired. */
  phoneRegistrationOtpRequired?: boolean;
};

const AUTH_SETTINGS_SELECT = {
  googleLoginRegistrationEnabled: true,
  facebookLoginRegistrationEnabled: true,
  phoneRegistrationOtpRequired: true,
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
      const rawSettings = settings as typeof settings & {
        otpRequired?: boolean;
      };
      const otpRequired = rawSettings.phoneRegistrationOtpRequired
        ?? rawSettings.otpRequired
        ?? true;
      return { ...settings, otpRequired, phoneRegistrationOtpRequired: otpRequired };
    } catch {
      throw this.unavailable();
    }
  }

  async providerAvailability(): Promise<AuthProviderAvailability> {
    const settings = await this.readCurrent();
    return {
      google: settings.googleLoginRegistrationEnabled,
      facebook: settings.facebookLoginRegistrationEnabled,
      otpRequired: settings.otpRequired,
      phoneRegistrationOtpRequired: settings.phoneRegistrationOtpRequired !== false,
    };
  }

  /** Keep every policy-controlled auth flow at the secure default on outage. */
  async isOtpRequired(): Promise<boolean> {
    try {
      return (await this.readCurrent()).otpRequired;
    } catch (error) {
      if (error instanceof DomainError && error.code === ErrorCode.SETTINGS_UNAVAILABLE) {
        return true;
      }
      throw error;
    }
  }

  /** @deprecated Use isOtpRequired; retained for older callers during rollout. */
  async isPhoneRegistrationOtpRequired(): Promise<boolean> {
    return this.isOtpRequired();
  }

  async update(input: UpdateAuthSettingsInput): Promise<AuthSettingsState> {
    if (
      input.otpRequired !== undefined &&
      input.phoneRegistrationOtpRequired !== undefined &&
      input.otpRequired !== input.phoneRegistrationOtpRequired
    ) {
      throw new DomainError(
        ErrorCode.INVALID_AUTH_SETTINGS,
        'Canonical and legacy OTP settings must match',
        400,
      );
    }
    const otpRequired = input.otpRequired ?? input.phoneRegistrationOtpRequired;
    const data = {
      ...(input.googleLoginRegistrationEnabled !== undefined
        ? { googleLoginRegistrationEnabled: input.googleLoginRegistrationEnabled }
        : {}),
      ...(input.facebookLoginRegistrationEnabled !== undefined
        ? { facebookLoginRegistrationEnabled: input.facebookLoginRegistrationEnabled }
        : {}),
      ...(otpRequired !== undefined
        ? { phoneRegistrationOtpRequired: otpRequired }
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
