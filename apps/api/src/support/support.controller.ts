import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import {
  CreateSupportMessageDto,
  CreateSupportTicketDto,
  SupportTicketMessagesQueryDto,
  SupportTicketsQueryDto,
} from './dto';
import { SupportService } from './support.service';

@Controller('support')
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Get('faqs')
  faqs() {
    return this.support.getFaqs();
  }

  @UseGuards(AuthGuard)
  @Post('tickets')
  createTicket(@Req() request: AuthenticatedRequest, @Body() dto: CreateSupportTicketDto) {
    return this.support.createTicket(request.user.sub, dto);
  }

  @UseGuards(AuthGuard)
  @Get('tickets')
  tickets(@Req() request: AuthenticatedRequest, @Query() query: SupportTicketsQueryDto) {
    return this.support.getTickets(request.user.sub, query);
  }

  @UseGuards(AuthGuard)
  @Get('unread-count')
  unreadCount(@Req() request: AuthenticatedRequest) {
    return this.support.unreadCount(request.user.sub);
  }

  @UseGuards(AuthGuard)
  @Get('tickets/:ticketNo')
  ticket(@Req() request: AuthenticatedRequest, @Param('ticketNo') ticketNo: string) {
    return this.support.getTicket(request.user.sub, ticketNo);
  }

  @UseGuards(AuthGuard)
  @Get('tickets/:ticketNo/messages')
  messages(
    @Req() request: AuthenticatedRequest,
    @Param('ticketNo') ticketNo: string,
    @Query() query: SupportTicketMessagesQueryDto,
  ) {
    return this.support.getMessages(request.user.sub, ticketNo, query);
  }

  @UseGuards(AuthGuard)
  @Post('tickets/:ticketNo/messages')
  createMessage(
    @Req() request: AuthenticatedRequest,
    @Param('ticketNo') ticketNo: string,
    @Body() dto: CreateSupportMessageDto,
  ) {
    return this.support.createMessage(request.user.sub, ticketNo, dto);
  }

  @UseGuards(AuthGuard)
  @Post('tickets/:ticketNo/read')
  markRead(@Req() request: AuthenticatedRequest, @Param('ticketNo') ticketNo: string) {
    return this.support.markRead(request.user.sub, ticketNo);
  }
}
