import { ArgumentsHost, CanActivate, Catch, ExceptionFilter, ExecutionContext, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { InvalidSepayWebhookError, SepayPaymentProvider } from './payment.provider';

@Injectable()
export class SepayWebhookAuthGuard implements CanActivate {
  constructor(private readonly sepay: SepayPaymentProvider) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request & { rawBody?: Buffer }>();
    const signature = this.header(request, 'x-sepay-signature');
    const timestamp = this.header(request, 'x-sepay-timestamp');
    this.sepay.verifyWebhook({ rawBody: request.rawBody?.toString('utf8') ?? '', signature, timestamp });
    return true;
  }

  private header(request: Request, name: string) {
    const value = request.headers[name];
    return Array.isArray(value) ? value[0] : value;
  }
}

@Catch(InvalidSepayWebhookError)
export class SepayWebhookExceptionFilter implements ExceptionFilter {
  catch(_exception: InvalidSepayWebhookError, host: ArgumentsHost) {
    host.switchToHttp().getResponse<Response>().status(401).json({ success: false });
  }
}
