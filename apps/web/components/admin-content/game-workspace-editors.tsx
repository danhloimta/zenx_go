'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { gameContentWorkspace } from './content-workspace-adapter';
import { ArticleEditor } from './article-editor';
import { EventEditor } from './event-editor';

export function GameWorkspaceArticleEditor({ subdomain, articleId }: { subdomain: string; articleId?: string }) {
  const context = useQuery({ queryKey: ['game-admin', 'context', subdomain], queryFn: () => api.gameAdmin.context(subdomain), retry: false });
  if (!context.data) return <p className="text-sm text-slate-500">Đang tải game…</p>;
  return <ArticleEditor articleId={articleId} workspace={gameContentWorkspace(context.data.game.id, context.data.game.name, subdomain)} />;
}

export function GameWorkspaceEventEditor({ subdomain, eventId }: { subdomain: string; eventId?: string }) {
  const context = useQuery({ queryKey: ['game-admin', 'context', subdomain], queryFn: () => api.gameAdmin.context(subdomain), retry: false });
  if (!context.data) return <p className="text-sm text-slate-500">Đang tải game…</p>;
  return <EventEditor eventId={eventId} workspace={gameContentWorkspace(context.data.game.id, context.data.game.name, subdomain)} />;
}
