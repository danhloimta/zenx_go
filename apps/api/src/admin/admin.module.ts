import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { AuthModule } from '../auth/auth.module';
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

@Module({
  imports: [AuthModule, AccountModule, FinanceModule],
  controllers: [AdminController, ContentAdminController, AccessAdminController],
  providers: [AdminService, AdminGuard, ContentAdminService, AuthorizationService, PermissionGuard, AccessAdminService],
  exports: [AdminGuard, AuthorizationService, PermissionGuard],
})
export class AdminModule {}
