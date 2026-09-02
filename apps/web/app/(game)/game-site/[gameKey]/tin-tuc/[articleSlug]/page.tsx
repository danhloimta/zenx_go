'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { gameUrl } from '@/lib/domain';
import { useGame } from '@/components/game/game-context';

export default function ArticlePage() {
  const game = useGame();
  const params = useParams<{ articleSlug: string }>();
  const slug = typeof params.articleSlug === 'string' ? decodeURIComponent(params.articleSlug) : '';
  const query = useQuery({ queryKey: ['game-article', game.slug, slug], queryFn: () => api.games.article(game.slug, slug), enabled: Boolean(slug), retry: false });
  if (query.isLoading) return <div className="mx-auto max-w-3xl px-4 py-20 text-center opacity-70">Đang tải bài viết…</div>;
  if (query.isError || !query.data) return <div className="mx-auto max-w-3xl px-4 py-20 text-center"><p>Không tìm thấy bài viết.</p><Link href={gameUrl(game.subdomain, '/tin-tuc')} className="mt-4 inline-flex text-sm font-bold text-[var(--game-primary)]">Quay lại tin tức</Link></div>;
  const article = query.data;
  return <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6"><Link href={gameUrl(game.subdomain, '/tin-tuc')} className="inline-flex items-center gap-2 text-sm font-semibold opacity-65 hover:opacity-100"><ArrowLeft className="size-4" /> Tất cả tin tức</Link><p className="mt-10 text-xs font-bold uppercase tracking-[0.2em] text-[var(--game-primary)]">{article.category.replaceAll('_', ' ')}</p><h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">{article.title}</h1><p className="mt-4 text-sm opacity-60">{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('vi-VN') : ''}</p>{article.coverImageUrl ? <img src={article.coverImageUrl} alt="" className="mt-8 aspect-[16/9] w-full rounded-3xl object-cover" /> : null}<div className="prose prose-slate mt-10 max-w-none leading-8" dangerouslySetInnerHTML={{ __html: article.contentHtml }} /></article>;
}
