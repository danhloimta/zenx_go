import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AdminRole } from '../common/domain';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard, AdminRequest } from '../admin/admin.guard';
import { RequireAdminRoles } from '../admin/admin-roles.decorator';
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
@UseGuards(AuthGuard, AdminGuard)
@RequireAdminRoles(AdminRole.SUPER_ADMIN, AdminRole.SUPPORT)
export class SupportAdminController {
  constructor(private readonly support: SupportAdminService) {}

  @Get('dashboard')
  dashboard(@Req() request: AdminRequest) {
    return this.support.dashboard(request.user.sub);
  }

  @Get('agents')
  agents() {
    return this.support.agents();
  }

  @Get('tickets')
  tickets(@Req() request: AdminRequest, @Query() query: AdminSupportTicketsQueryDto) {
    return this.support.listTickets(request.user.sub, query);
  }

  @Get('tickets/:ticketNo')
  ticket(@Req() request: AdminRequest, @Param('ticketNo') ticketNo: string) {
    return this.support.getTicket(request.user.sub, ticketNo);
  }

  @Get('tickets/:ticketNo/messages')
  messages(
    @Req() request: AdminRequest,
    @Param('ticketNo') ticketNo: string,
    @Query() query: SupportTicketMessagesQueryDto,
  ) {
    return this.support.getMessages(request.user.sub, ticketNo, query);
  }

  @Post('tickets/:ticketNo/claim')
  claim(
    @Req() request: AdminRequest,
    @Param('ticketNo') ticketNo: string,
    @Body() dto: AdminSupportTicketClaimDto,
  ) {
    return this.support.claim(request.user.sub, ticketNo, dto);
  }

  @Patch('tickets/:ticketNo')
  updateTicket(
    @Req() request: AdminRequest,
    @Param('ticketNo') ticketNo: string,
    @Body() dto: AdminSupportTicketUpdateDto,
  ) {
    return this.support.updateTicket(request.user.sub, ticketNo, dto);
  }

  @Post('tickets/:ticketNo/messages')
  createMessage(
    @Req() request: AdminRequest,
    @Param('ticketNo') ticketNo: string,
    @Body() dto: AdminCreateSupportMessageDto,
  ) {
    return this.support.sendMessage(request.user.sub, ticketNo, dto);
  }

  @Post('tickets/:ticketNo/read')
  markRead(@Req() request: AdminRequest, @Param('ticketNo') ticketNo: string) {
    return this.support.markRead(request.user.sub, ticketNo);
  }

  @Get('faqs')
  faqs(@Query() query: AdminSupportFaqQueryDto) {
    return this.support.listFaqs(query);
  }

  @Post('categories')
  createCategory(@Body() dto: AdminSupportCategoryCreateDto) {
    return this.support.createCategory(dto);
  }

  @Patch('categories/:categoryId')
  updateCategory(
    @Param('categoryId') categoryId: string,
    @Body() dto: AdminSupportCategoryUpdateDto,
  ) {
    return this.support.updateCategory(categoryId, dto);
  }

  @Post('faqs')
  createFaq(@Body() dto: AdminSupportFaqCreateDto) {
    return this.support.createFaq(dto);
  }

  @Patch('faqs/:faqId')
  updateFaq(
    @Param('faqId') faqId: string,
    @Body() dto: AdminSupportFaqUpdateDto,
  ) {
    return this.support.updateFaq(faqId, dto);
  }
}
