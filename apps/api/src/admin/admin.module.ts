import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { AuthModule } from '../auth/auth.module';
import { AdminController } from './admin.controller';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { ContentAdminController } from './content/content.controller';
import { ContentAdminService } from './content/content.service';
import { FinanceModule } from './finance/finance.module';

@Module({
  imports: [AuthModule, AccountModule, FinanceModule],
  controllers: [AdminController, ContentAdminController],
  providers: [AdminService, AdminGuard, ContentAdminService],
  exports: [AdminGuard],
})
export class AdminModule {}
