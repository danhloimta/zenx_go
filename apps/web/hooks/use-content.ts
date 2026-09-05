'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  ContentPublishStatus,
  GameArticleCategory,
  GameLifecycleStatus,
  GameOperationalStatus,
} from '@zenx-go/api-client';

export function useAdminContentDashboard(enabled = true) {
  return useQuery({
    queryKey: ['admin', 'content', 'dashboard'],
    queryFn: api.admin.content.dashboard,
    enabled,
    retry: false,
  });
}

export function useAdminContentGames(
  query: {
    page?: number;
    pageSize?: number;
    search?: string;
    lifecycleStatus?: GameLifecycleStatus;
    operationalStatus?: GameOperationalStatus;
    isPublic?: boolean;
  } = {},
  enabled = true,
) {
  return useQuery({
    queryKey: ['admin', 'content', 'games', query],
    queryFn: () => api.admin.content.games(query),
    enabled,
    retry: false,
    placeholderData: (previous) => previous,
  });
}

export function useAdminContentGame(gameId: string, enabled = true) {
  return useQuery({
    queryKey: ['admin', 'content', 'game', gameId],
    queryFn: () => api.admin.content.game(gameId),
    enabled: enabled && Boolean(gameId),
    retry: false,
  });
}

export function useAdminContentGameOptions(enabled = true) {
  return useQuery({
    queryKey: ['admin', 'content', 'game-options'],
    queryFn: api.admin.content.gameOptions,
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminContentGameTemplates(enabled = true) {
  return useQuery({
    queryKey: ['admin', 'content', 'game-templates'],
    queryFn: api.admin.content.gameTemplates,
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminContentGameReadiness(gameId: string, enabled = true) {
  return useQuery({
    queryKey: ['admin', 'content', 'game-readiness', gameId],
    queryFn: () => api.admin.content.gameReadiness(gameId),
    enabled: enabled && Boolean(gameId),
    retry: false,
  });
}

export function useAdminContentArticles(
  query: {
    page?: number;
    pageSize?: number;
    search?: string;
    gameId?: string;
    category?: GameArticleCategory;
    status?: ContentPublishStatus;
  } = {},
  enabled = true,
) {
  return useQuery({
    queryKey: ['admin', 'content', 'articles', query],
    queryFn: () => api.admin.content.articles(query),
    enabled,
    retry: false,
    placeholderData: (previous) => previous,
  });
}

export function useAdminContentArticle(articleId: string, enabled = true) {
  return useQuery({
    queryKey: ['admin', 'content', 'article', articleId],
    queryFn: () => api.admin.content.article(articleId),
    enabled: enabled && Boolean(articleId),
    retry: false,
  });
}

export function useAdminContentEvents(
  query: {
    page?: number;
    pageSize?: number;
    search?: string;
    gameId?: string;
    status?: ContentPublishStatus;
  } = {},
  enabled = true,
) {
  return useQuery({
    queryKey: ['admin', 'content', 'events', query],
    queryFn: () => api.admin.content.events(query),
    enabled,
    retry: false,
    placeholderData: (previous) => previous,
  });
}

export function useAdminContentEvent(eventId: string, enabled = true) {
  return useQuery({
    queryKey: ['admin', 'content', 'event', eventId],
    queryFn: () => api.admin.content.event(eventId),
    enabled: enabled && Boolean(eventId),
    retry: false,
  });
}

export function useAdminContentAnnouncements(
  query: { page?: number; pageSize?: number; search?: string; status?: ContentPublishStatus } = {},
  enabled = true,
) {
  return useQuery({
    queryKey: ['admin', 'content', 'announcements', query],
    queryFn: () => api.admin.content.announcements(query),
    enabled,
    retry: false,
    placeholderData: (previous) => previous,
  });
}

export function useAdminUploadAsset() {
  return useMutation({
    mutationFn: (file: Blob | File) => api.admin.content.uploadAsset(file),
  });
}
