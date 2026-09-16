import { Module } from '@nestjs/common';
import { ProviderAvailabilityController } from './provider-availability.controller';
import { AuthSettingsService } from './auth-settings.service';

@Module({
  controllers: [ProviderAvailabilityController],
  providers: [AuthSettingsService],
  exports: [AuthSettingsService],
})
export class AuthSettingsModule {}
