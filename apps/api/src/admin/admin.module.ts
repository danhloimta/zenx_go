import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { AuthModule } from '../auth/auth.module';
import { AdminController } from './admin.controller';
import { AdminAuditService } from './admin.audit.service';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { ContentAdminController } from './content/content.controller';
import { ContentAdminService } from './content/content.service';

@Module({
  imports: [AuthModule, AccountModule],
  controllers: [AdminController, ContentAdminController],
  providers: [AdminService, AdminAuditService, AdminGuard, ContentAdminService],
  exports: [AdminAuditService, AdminGuard],
})
export class AdminModule {}
