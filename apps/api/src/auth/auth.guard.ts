import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ACCESS_COOKIE } from '../common/constants';
import { PrismaService } from '../database/prisma.service';
import { ALLOW_PASSWORD_CHANGE_REQUIRED } from '../common/password-change-required.decorator';
import { DomainError, ErrorCode } from '../common/errors';

export type AuthenticatedRequest = Request & {
  user: { sub: string; username: string; authVersion: number; mustChangePassword: boolean };
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.cookies?.[ACCESS_COOKIE] as string | undefined;
    if (!token) throw new UnauthorizedException('Authentication required');
    let user: { sub: string; username: string; type?: string; av?: number };
    try {
      user = await this.jwt.verifyAsync<{
        sub: string;
        username: string;
        type?: string;
        av?: number;
      }>(token);
    } catch {
      throw new UnauthorizedException('Authentication required');
    }
    if (user.type !== 'access') throw new UnauthorizedException('Authentication required');
    const account = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { status: true, authVersion: true, mustChangePassword: true },
    });
    if (!account) throw new UnauthorizedException('Authentication required');
    if (account.status === 'LOCKED') throw new ForbiddenException('Account is locked');
    if (account.status === 'SUSPENDED') throw new ForbiddenException('Account is suspended');
    if ((user.av ?? 0) !== account.authVersion)
      throw new UnauthorizedException('Authentication required');
    request.user = {
      sub: user.sub,
      username: user.username,
      authVersion: account.authVersion,
      mustChangePassword: account.mustChangePassword,
    };
    const allowPending = this.reflector.getAllAndOverride<boolean>(ALLOW_PASSWORD_CHANGE_REQUIRED, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (account.mustChangePassword && !allowPending) {
      throw new DomainError(
        ErrorCode.PASSWORD_CHANGE_REQUIRED,
        'Password change is required before continuing',
        403,
      );
    }
    return true;
  }
}
