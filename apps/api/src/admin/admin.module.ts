import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { AuthModule } from '../auth/auth.module';
import { AdminAuthSettingsController } from '../auth-settings/admin-auth-settings.controller';
import { AuthSettingsModule } from '../auth-settings/auth-settings.module';
import { AdminController } from './admin.controller';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { ContentAdminController } from './content/content.controller';
import { ContentAdminService } from './content/content.service';
import { FinanceModule } from './finance/finance.module';
import { AuthorizationService } from './authorization.service';
import { PermissionGuard } from './permission.guard';
import { AccessAdminController } from './access.controller';
import { AccessAdminService } from './access.service';
import { GameAccessService } from './game-access.service';
import { GameAccessGuard } from './game-access.guard';
import { GamePermissionGuard } from './game-permission.guard';
import { GameAdminService } from './game-admin.service';
import { GameAdminController } from './game-admin.controller';
import { GameManagementService } from './game-management.service';
import { GameManagementController } from './game-management.controller';

@Module({
  imports: [AuthModule, AuthSettingsModule, AccountModule, FinanceModule],
  controllers: [AdminController, ContentAdminController, AccessAdminController, AdminAuthSettingsController, GameAdminController, GameManagementController],
  providers: [AdminService, AdminGuard, ContentAdminService, AuthorizationService, PermissionGuard, AccessAdminService, GameAccessService, GameAccessGuard, GamePermissionGuard, GameAdminService, GameManagementService],
  exports: [AdminGuard, AuthorizationService, PermissionGuard, GameAccessService],
})
export class AdminModule {}
