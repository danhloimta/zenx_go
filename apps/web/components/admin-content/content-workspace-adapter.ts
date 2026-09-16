import type { AdminContentArticleCreateRequest, AdminContentArticleUpdateRequest, AdminContentEventCreateRequest, AdminContentEventUpdateRequest, ContentPublishStatus, GameArticleCategory } from '@zenx-go/api-client';
import { api } from '@/lib/api';

/** Fixed game context and every scoped CMS operation used by shared CMS UI. */
export type ContentWorkspaceAdapter = {
  gameId: string;
  gameName: string;
  subdomain: string;
  articlesPath: string;
  eventsPath: string;
  articles: (query?: { page?: number; pageSize?: number; search?: string; category?: GameArticleCategory; status?: ContentPublishStatus; deletedOnly?: boolean }) => ReturnType<typeof api.gameAdmin.content.articles>;
  article: (articleId: string) => ReturnType<typeof api.gameAdmin.content.article>;
  createArticle: (input: Omit<AdminContentArticleCreateRequest, 'gameId'>) => ReturnType<typeof api.gameAdmin.content.createArticle>;
  updateArticle: (articleId: string, input: AdminContentArticleUpdateRequest) => ReturnType<typeof api.gameAdmin.content.updateArticle>;
  deleteArticle: (articleId: string) => ReturnType<typeof api.gameAdmin.content.deleteArticle>;
  restoreArticle: (articleId: string) => ReturnType<typeof api.gameAdmin.content.restoreArticle>;
  events: (query?: { page?: number; pageSize?: number; search?: string; status?: ContentPublishStatus }) => ReturnType<typeof api.gameAdmin.content.events>;
  event: (eventId: string) => ReturnType<typeof api.gameAdmin.content.event>;
  createEvent: (input: Omit<AdminContentEventCreateRequest, 'gameId'>) => ReturnType<typeof api.gameAdmin.content.createEvent>;
  updateEvent: (eventId: string, input: Omit<AdminContentEventUpdateRequest, 'gameId'>) => ReturnType<typeof api.gameAdmin.content.updateEvent>;
};

export function gameContentWorkspace(gameId: string, gameName: string, subdomain: string): ContentWorkspaceAdapter {
  const base = `/game-admin/${encodeURIComponent(subdomain)}`;
  return {
    gameId, gameName, subdomain, articlesPath: `${base}/articles`, eventsPath: `${base}/events`,
    articles: (query) => api.gameAdmin.content.articles(gameId, query), article: (id) => api.gameAdmin.content.article(gameId, id), createArticle: (input) => api.gameAdmin.content.createArticle(gameId, input), updateArticle: (id, input) => api.gameAdmin.content.updateArticle(gameId, id, input), deleteArticle: (id) => api.gameAdmin.content.deleteArticle(gameId, id), restoreArticle: (id) => api.gameAdmin.content.restoreArticle(gameId, id),
    events: (query) => api.gameAdmin.content.events(gameId, query), event: (id) => api.gameAdmin.content.event(gameId, id), createEvent: (input) => api.gameAdmin.content.createEvent(gameId, input), updateEvent: (id, input) => { const { gameId: requestedGameId, ...scoped } = input as AdminContentEventUpdateRequest; void requestedGameId; return api.gameAdmin.content.updateEvent(gameId, id, scoped); },
  };
}
