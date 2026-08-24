import { Injectable } from '@nestjs/common';
import { SocialProvider } from '../common/domain';
import { DomainError, ErrorCode } from '../common/errors';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SocialService {
  constructor(private readonly prisma: PrismaService) {}

  async link(userId: string, provider: SocialProvider) {
    const existing = await this.prisma.socialIdentity.findFirst({ where: { userId, provider } });
    if (existing) throw new DomainError(ErrorCode.SOCIAL_ALREADY_LINKED, 'Social provider is already linked', 409);
    return { provider, status: 'oauth_adapter_pending', message: 'Start the provider OAuth flow before linking an identity.' };
  }

  async unlink(userId: string, provider: SocialProvider) {
    const identity = await this.prisma.socialIdentity.findFirst({ where: { userId, provider }, include: { user: { select: { passwordHash: true } } } });
    if (!identity) return { unlinked: true };
    const otherSocial = await this.prisma.socialIdentity.count({ where: { userId, NOT: { provider } } });
    if (!identity.user.passwordHash && otherSocial === 0) throw new DomainError(ErrorCode.CANNOT_UNLINK_LAST_LOGIN_METHOD, 'Create a password before unlinking the last social login', 409);
    await this.prisma.socialIdentity.delete({ where: { id: identity.id } });
    return { unlinked: true };
  }
}
