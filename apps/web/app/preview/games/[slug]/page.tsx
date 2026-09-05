'use client';

import Link from 'next/link';
import { ArrowLeft, Eye } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { GameShell } from '@/components/game/game-shell';
import GameHomePage from '@/app/(game)/game-site/[gameKey]/page';

export default function GamePreviewPage() {
  const params = useParams<{ slug: string }>();
  const gameId = typeof params.slug === 'string' ? decodeURIComponent(params.slug) : '';
  const query = useQuery({
    queryKey: ['admin', 'content', 'game-preview', gameId],
    queryFn: () => api.admin.content.previewGame(gameId),
    enabled: Boolean(gameId),
    retry: false,
  });

  if (query.isLoading) return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Đang tải bản xem trước…</div>;
  if (query.isError || !query.data) return <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center"><p className="text-sm font-semibold text-rose-600">{getErrorMessage(query.error, 'Không thể tải bản xem trước.')}</p><Link href="/admin/content/games" className="inline-flex items-center gap-2 text-sm font-bold text-[#00873E]"><ArrowLeft className="size-4" /> Quay lại CMS</Link></div>;

  return <GameShell game={query.data}><div className="relative"><div className="sticky top-0 z-[60] flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900"><span className="inline-flex items-center gap-2"><Eye className="size-4" /> BẢN XEM TRƯỚC · {query.data.name}</span><Link href={`/admin/content/games/${encodeURIComponent(gameId)}`} className="underline underline-offset-2">Quay lại chỉnh sửa</Link></div><GameHomePage /></div></GameShell>;
}
