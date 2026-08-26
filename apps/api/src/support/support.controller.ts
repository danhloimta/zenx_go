import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { CreateSupportTicketDto, SupportTicketsQueryDto } from './dto';
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
  @Get('tickets/:ticketNo')
  ticket(@Req() request: AuthenticatedRequest, @Param('ticketNo') ticketNo: string) {
    return this.support.getTicket(request.user.sub, ticketNo);
  }
}
