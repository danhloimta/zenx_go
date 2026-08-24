import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { CreatePaymentDto, PaymentCallbackDto } from './dto';
import { PaymentService } from './payment.service';

@Controller()
export class PaymentController {
  constructor(private readonly payments: PaymentService) {}

  @Get('coin-packages') packages() { return this.payments.listPackages(); }

  @UseGuards(AuthGuard)
  @Post('payments') create(@Req() request: AuthenticatedRequest, @Body() dto: CreatePaymentDto) { return this.payments.create(request.user.sub, dto); }
  @UseGuards(AuthGuard)
  @Get('payments/:paymentNo') get(@Req() request: AuthenticatedRequest, @Param('paymentNo') no: string) { return this.payments.get(request.user.sub, no); }
  @UseGuards(AuthGuard)
  @Get('payments') list(@Req() request: AuthenticatedRequest) { return this.payments.list(request.user.sub); }

  @Post('payments/:provider/callback')
  callback(@Req() request: Request, @Headers('x-payment-signature') signature: string, @Body() dto: PaymentCallbackDto) {
    const rawBody = (request as Request & { rawBody?: Buffer }).rawBody?.toString('utf8') ?? JSON.stringify(dto);
    return this.payments.callback(rawBody, signature, dto as unknown as Record<string, unknown>);
  }
}
