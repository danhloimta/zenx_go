import { Controller, Get, Header } from '@nestjs/common';
import { AuthSettingsService } from './auth-settings.service';

@Controller('auth')
export class ProviderAvailabilityController {
  constructor(private readonly authSettings: AuthSettingsService) {}

  @Get('provider-availability')
  @Header('Cache-Control', 'no-store')
  providerAvailability() {
    return this.authSettings.providerAvailability();
  }
}
