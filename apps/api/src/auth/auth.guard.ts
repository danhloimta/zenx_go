import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ACCESS_COOKIE } from '../common/constants';
import { PrismaService } from '../database/prisma.service';

export type AuthenticatedRequest = Request & { user: { sub: string; username: string } };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.cookies?.[ACCESS_COOKIE] as string | undefined;
    if (!token) throw new UnauthorizedException('Authentication required');
    let user: { sub: string; username: string };
    try {
      user = await this.jwt.verifyAsync<{ sub: string; username: string }>(token);
    } catch {
      throw new UnauthorizedException('Authentication required');
    }
    const account = await this.prisma.user.findUnique({ where: { id: user.sub }, select: { status: true } });
    if (!account) throw new UnauthorizedException('Authentication required');
    if (account.status === 'LOCKED') throw new ForbiddenException('Account is locked');
    if (account.status === 'SUSPENDED') throw new ForbiddenException('Account is suspended');
    request.user = user;
    return true;
  }
}
