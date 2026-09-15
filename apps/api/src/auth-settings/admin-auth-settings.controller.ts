import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../admin/admin.guard';
import { PermissionGuard } from '../admin/permission.guard';
import { RequirePermission } from '../admin/permission.decorator';
import { PERMISSIONS } from '../admin/permissions';
import { AuthGuard } from '../auth/auth.guard';
import { AdminAuthSettingsUpdateDto } from './auth-settings.dto';
import { AuthSettingsService } from './auth-settings.service';

@Controller('admin/settings/auth-providers')
@UseGuards(AuthGuard, AdminGuard, PermissionGuard)
export class AdminAuthSettingsController {
  constructor(private readonly authSettings: AuthSettingsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.AUTH_SETTINGS_MANAGE)
  readCurrent() {
    return this.authSettings.readCurrent();
  }

  @Patch()
  @RequirePermission(PERMISSIONS.AUTH_SETTINGS_MANAGE)
  update(@Body() dto: AdminAuthSettingsUpdateDto) {
    return this.authSettings.update(dto);
  }
}
