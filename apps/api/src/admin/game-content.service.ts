import { Injectable } from '@nestjs/common';
import { DomainError, ErrorCode } from '../common/errors';
import { PrismaService } from '../database/prisma.service';
import { ContentAdminService } from './content/content.service';
import { AdminContentArticleCreateDto, AdminContentArticleUpdateDto, AdminContentArticlesQueryDto, AdminContentEventCreateDto, AdminContentEventUpdateDto, AdminContentEventsQueryDto, AdminContentGamePresentationUpdateDto } from './content/content.dto';

@Injectable()
export class GameContentService {
  constructor(private readonly prisma: PrismaService, private readonly content: ContentAdminService) {}

  presentation(gameId: string) { return this.content.getGame(gameId); }
  async updatePresentation(gameId: string, dto: AdminContentGamePresentationUpdateDto, actorUserId: string) {
    const before = await this.content.getGame(gameId);
    const result = await this.content.updateGamePresentation(gameId, dto);
    await this.audit(actorUserId, gameId, 'GAME_PRESENTATION_UPDATED', 'GAME', gameId, before, result);
    return result;
  }
  listArticles(gameId: string, query: AdminContentArticlesQueryDto) { return this.content.listArticles({ ...query, gameId }); }
  async getArticle(gameId: string, articleId: string) { await this.article(gameId, articleId); return this.content.getArticle(articleId); }
  async createArticle(gameId: string, dto: AdminContentArticleCreateDto, actorUserId: string) {
    const result = await this.content.createArticle({ ...dto, gameId });
    await this.audit(actorUserId, gameId, 'GAME_ARTICLE_CREATED', 'GAME_ARTICLE', result.id, null, result);
    return result;
  }
  async updateArticle(gameId: string, articleId: string, dto: AdminContentArticleUpdateDto, actorUserId: string) {
    await this.article(gameId, articleId);
    const before = await this.content.getArticle(articleId);
    const result = await this.content.updateArticle(articleId, dto);
    await this.audit(actorUserId, gameId, 'GAME_ARTICLE_UPDATED', 'GAME_ARTICLE', articleId, before, result);
    return result;
  }
  async deleteArticle(gameId: string, articleId: string, actorUserId: string) { await this.article(gameId, articleId); const before = await this.content.getArticle(articleId); const result = await this.content.deleteArticle(articleId); await this.audit(actorUserId, gameId, 'GAME_ARTICLE_DELETED', 'GAME_ARTICLE', articleId, before, result); return result; }
  async restoreArticle(gameId: string, articleId: string, actorUserId: string) { await this.article(gameId, articleId); const result = await this.content.restoreArticle(articleId); await this.audit(actorUserId, gameId, 'GAME_ARTICLE_RESTORED', 'GAME_ARTICLE', articleId, null, result); return result; }
  listEvents(gameId: string, query: AdminContentEventsQueryDto) { return this.content.listEvents({ ...query, gameId }); }
  async getEvent(gameId: string, eventId: string) { await this.event(gameId, eventId); return this.content.getEvent(eventId); }
  async createEvent(gameId: string, dto: AdminContentEventCreateDto, actorUserId: string) { const result = await this.content.createEvent({ ...dto, gameId }); await this.audit(actorUserId, gameId, 'GAME_EVENT_CREATED', 'GAME_EVENT', result.id, null, result); return result; }
  async updateEvent(gameId: string, eventId: string, dto: AdminContentEventUpdateDto, actorUserId: string) { await this.event(gameId, eventId); const before = await this.content.getEvent(eventId); const { gameId: _ignored, ...safeDto } = dto; const result = await this.content.updateEvent(eventId, safeDto); await this.audit(actorUserId, gameId, 'GAME_EVENT_UPDATED', 'GAME_EVENT', eventId, before, result); return result; }

  private async article(gameId: string, articleId: string) { const found = await this.prisma.gameArticle.findFirst({ where: { id: articleId, gameId }, select: { id: true } }); if (!found) throw new DomainError(ErrorCode.GAME_ARTICLE_NOT_FOUND, 'Game article not found', 404); }
  private async event(gameId: string, eventId: string) { const found = await this.prisma.gameEvent.findFirst({ where: { id: eventId, gameId }, select: { id: true } }); if (!found) throw new DomainError(ErrorCode.PORTAL_EVENT_NOT_FOUND, 'Game event not found', 404); }
  private audit(actorUserId: string, gameId: string, action: string, targetType: string, targetId: string, before: unknown, after: unknown) { return this.prisma.authorizationAuditLog.create({ data: { actorUserId, gameId, action, targetType, targetId, beforeData: before ? JSON.stringify(before) : null, afterData: after ? JSON.stringify(after) : null } }); }
}
