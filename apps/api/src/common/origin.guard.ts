import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { DomainPolicyService } from './domain-policy.service';
import { SKIP_ORIGIN_GUARD } from './origin-guard.decorator';

@Injectable()
export class OriginGuard implements CanActivate {
  constructor(private readonly policy: DomainPolicyService, private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext) {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_ORIGIN_GUARD, [context.getHandler(), context.getClass()]);
    if (skip) return true;

    const request = context.switchToHttp().getRequest<Request>();
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return true;
    const origin = request.headers.origin;
    if (!(await this.policy.isAllowedRequestOrigin(origin))) throw new ForbiddenException('Invalid request origin');
    return true;
  }
}
