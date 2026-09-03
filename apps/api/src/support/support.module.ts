import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { SupportAdminController } from './support-admin.controller';
import { SupportAdminService } from './support-admin.service';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [AuthModule, AdminModule],
  controllers: [SupportController, SupportAdminController],
  providers: [SupportService, SupportAdminService],
  exports: [SupportService, SupportAdminService],
})
export class SupportModule {}
