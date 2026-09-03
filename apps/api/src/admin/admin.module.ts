import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { AuthModule } from '../auth/auth.module';
import { AdminController } from './admin.controller';
import { AdminAuditService } from './admin.audit.service';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@Module({
  imports: [AuthModule, AccountModule],
  controllers: [AdminController],
  providers: [AdminService, AdminAuditService, AdminGuard],
})
export class AdminModule {}
