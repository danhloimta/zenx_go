import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { classifyWebHost, isAllowedWebOrigin } from './web-domain';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class OriginGuard implements CanActivate {
  constructor(private readonly config: ConfigService, private readonly prisma: PrismaService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return true;
    const origin = request.headers.origin;
    if (!isAllowedWebOrigin(
      origin,
      this.config.getOrThrow<string>('baseDomain'),
      this.config.get<string[]>('allowedWebOrigins') ?? [],
      this.config.get<boolean>('allowGameSubdomains') ?? true,
    )) throw new ForbiddenException('Invalid request origin');
    const originHost = origin ? classifyWebHost(new URL(origin).hostname, this.config.getOrThrow<string>('baseDomain')) : undefined;
    if (originHost?.kind === 'GAME' && this.config.get<boolean>('allowGameSubdomains') !== false) {
      const game = await this.prisma.game.findFirst({ where: { subdomain: originHost.subdomain, isPublic: true }, select: { id: true } });
      if (!game) throw new ForbiddenException('Invalid request origin');
    }
    return true;
  }
}
