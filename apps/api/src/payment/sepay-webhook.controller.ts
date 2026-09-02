import { Body, Controller, Post, Res, SetMetadata, UseFilters, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { SepayWebhookPayload } from './payment.provider';
import { SepayWebhookDto } from './dto';
import { PaymentService } from './payment.service';
import { SKIP_RESPONSE_ENVELOPE } from '../common/response.interceptor';
import { SepayWebhookAuthGuard, SepayWebhookExceptionFilter } from './sepay-webhook.guard';
import { SkipOriginGuard } from '../common/origin-guard.decorator';

@Controller()
@Throttle({ default: { limit: 300, ttl: 60_000 } })
@UseFilters(SepayWebhookExceptionFilter)
export class SepayWebhookController {
  constructor(private readonly payments: PaymentService) {}

  @Post('webhooks/sepay')
  @SkipOriginGuard()
  @SetMetadata(SKIP_RESPONSE_ENVELOPE, true)
  @UseGuards(SepayWebhookAuthGuard)
  async receive(
    @Body() dto: SepayWebhookDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.payments.handleSepayWebhook(dto as SepayWebhookPayload);
    response.status(200);
    return { success: true };
  }
}
