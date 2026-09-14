import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard, AdminRequest } from '../admin/admin.guard';
import { PermissionGuard } from '../admin/permission.guard';
import { RequireAnyPermission, RequirePermission } from '../admin/permission.decorator';
import { PERMISSIONS } from '../admin/permissions';
import { SupportMessageVisibility } from '../common/domain';
import { DomainError, ErrorCode } from '../common/errors';
import { SupportAdminService } from './support-admin.service';
import {
  AdminCreateSupportMessageDto,
  AdminSupportCategoryCreateDto,
  AdminSupportCategoryUpdateDto,
  AdminSupportFaqCreateDto,
  AdminSupportFaqQueryDto,
  AdminSupportFaqUpdateDto,
  AdminSupportTicketClaimDto,
  AdminSupportTicketUpdateDto,
  AdminSupportTicketsQueryDto,
} from './admin-support.dto';
import { SupportTicketMessagesQueryDto } from './dto';

@Controller('admin/support')
@UseGuards(AuthGuard, AdminGuard, PermissionGuard)
export class SupportAdminController {
  constructor(private readonly support: SupportAdminService) {}

  @Get('dashboard')
  @RequirePermission({ code: 'support.dashboard.view', action: 'read', subject: 'SupportDashboard' })
  dashboard(@Req() request: AdminRequest) {
    return this.support.dashboard(request.user.sub);
  }

  @Get('agents')
  @RequirePermission({ code: 'support.agents.view', action: 'read', subject: 'SupportAgent' })
  agents() {
    return this.support.agents();
  }

  @Get('tickets')
  @RequirePermission({ code: 'support.tickets.view', action: 'read', subject: 'SupportTicket' })
  tickets(@Req() request: AdminRequest, @Query() query: AdminSupportTicketsQueryDto) {
    return this.support.listTickets(request.user.sub, query);
  }

  @Get('tickets/:ticketNo')
  @RequirePermission({ code: 'support.tickets.view', action: 'read', subject: 'SupportTicket' })
  ticket(@Req() request: AdminRequest, @Param('ticketNo') ticketNo: string) {
    return this.support.getTicket(request.user.sub, ticketNo);
  }

  @Get('tickets/:ticketNo/messages')
  @RequirePermission({ code: 'support.tickets.view', action: 'read', subject: 'SupportTicket' })
  messages(
    @Req() request: AdminRequest,
    @Param('ticketNo') ticketNo: string,
    @Query() query: SupportTicketMessagesQueryDto,
  ) {
    return this.support.getMessages(request.user.sub, ticketNo, query);
  }

  @Post('tickets/:ticketNo/claim')
  @RequirePermission({ code: 'support.tickets.claim', action: 'claim', subject: 'SupportTicket' })
  claim(
    @Req() request: AdminRequest,
    @Param('ticketNo') ticketNo: string,
    @Body() dto: AdminSupportTicketClaimDto,
  ) {
    return this.support.claim(request.user.sub, ticketNo, dto);
  }

  @Patch('tickets/:ticketNo')
  @RequirePermission({ code: 'support.tickets.update', action: 'update', subject: 'SupportTicket' })
  updateTicket(
    @Req() request: AdminRequest,
    @Param('ticketNo') ticketNo: string,
    @Body() dto: AdminSupportTicketUpdateDto,
  ) {
    return this.support.updateTicket(request.user.sub, ticketNo, dto);
  }

  @Post('tickets/:ticketNo/messages')
  @RequireAnyPermission(PERMISSIONS.SUPPORT_TICKETS_REPLY, PERMISSIONS.SUPPORT_TICKETS_INTERNAL_NOTE)
  createMessage(
    @Req() request: AdminRequest,
    @Param('ticketNo') ticketNo: string,
    @Body() dto: AdminCreateSupportMessageDto,
  ) {
    const required = dto.visibility === SupportMessageVisibility.INTERNAL
      ? PERMISSIONS.SUPPORT_TICKETS_INTERNAL_NOTE
      : PERMISSIONS.SUPPORT_TICKETS_REPLY;
    if (!request.admin.ability.can(required.action, required.subject))
      throw new DomainError(ErrorCode.PERMISSION_REQUIRED, 'Permission is required', 403);
    return this.support.sendMessage(request.user.sub, ticketNo, dto);
  }

  @Post('tickets/:ticketNo/read')
  @RequirePermission({ code: 'support.tickets.view', action: 'read', subject: 'SupportTicket' })
  markRead(@Req() request: AdminRequest, @Param('ticketNo') ticketNo: string) {
    return this.support.markRead(request.user.sub, ticketNo);
  }

  @Get('faqs')
  @RequirePermission({ code: 'support.faq.manage', action: 'manage', subject: 'SupportFaq' })
  faqs(@Query() query: AdminSupportFaqQueryDto) {
    return this.support.listFaqs(query);
  }

  @Post('categories')
  @RequirePermission({ code: 'support.faq.manage', action: 'manage', subject: 'SupportFaq' })
  createCategory(@Body() dto: AdminSupportCategoryCreateDto) {
    return this.support.createCategory(dto);
  }

  @Patch('categories/:categoryId')
  @RequirePermission({ code: 'support.faq.manage', action: 'manage', subject: 'SupportFaq' })
  updateCategory(
    @Param('categoryId') categoryId: string,
    @Body() dto: AdminSupportCategoryUpdateDto,
  ) {
    return this.support.updateCategory(categoryId, dto);
  }

  @Post('faqs')
  @RequirePermission({ code: 'support.faq.manage', action: 'manage', subject: 'SupportFaq' })
  createFaq(@Body() dto: AdminSupportFaqCreateDto) {
    return this.support.createFaq(dto);
  }

  @Patch('faqs/:faqId')
  @RequirePermission({ code: 'support.faq.manage', action: 'manage', subject: 'SupportFaq' })
  updateFaq(
    @Param('faqId') faqId: string,
    @Body() dto: AdminSupportFaqUpdateDto,
  ) {
    return this.support.updateFaq(faqId, dto);
  }
}
