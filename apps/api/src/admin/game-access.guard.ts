import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthenticatedRequest } from '../auth/auth.guard';
import { DomainError, ErrorCode } from '../common/errors';
import { GameAccessService, GameAuthorizationAccess } from './game-access.service';

export type GameAdminRequest = AuthenticatedRequest & { gameAdmin: GameAuthorizationAccess };

@Injectable()
export class GameAccessGuard implements CanActivate {
  constructor(private readonly access: GameAccessService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<GameAdminRequest>();
    const rawGameId = request.params?.gameId ?? request.gameAdmin?.gameId;
    const gameId = Array.isArray(rawGameId) ? rawGameId[0] : rawGameId;
    if (!gameId) throw new DomainError(ErrorCode.GAME_NOT_FOUND, 'Game context is required', 404);
    request.gameAdmin = await this.access.getAccess(request.user.sub, gameId);
    return true;
  }
}
