'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Clock3, Newspaper } from 'lucide-react';
import { gameUrl } from '@/lib/domain';
import { useGame } from '@/components/game/game-context';

import { formatCategoryLabel } from '@/lib/games-data';

export default function NewsPage() {
  const game = useGame();
  const [category, setCategory] = useState('ALL');
  const categories = useMemo(() => ['ALL', ...Array.from(new Set(game.articles.map((article) => article.category)))], [game.articles]);
  const articles = category === 'ALL' ? game.articles : game.articles.filter((article) => article.category === category);
  const featured = articles[0];
  const rest = articles.slice(1);

  return <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><div className="border-b border-black/10 pb-8"><p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--game-primary)]"><Newspaper className="size-4" /> Tin tức {game.name}</p><h1 className="mt-4 text-4xl font-black sm:text-5xl">Tin tức mới nhất</h1><p className="mt-4 max-w-2xl text-base leading-7 opacity-70">Theo dõi các thay đổi, hoạt động mùa và thông báo mới nhất của thế giới {game.name}.</p></div><div className="mt-8 flex flex-wrap gap-2">{categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`rounded-xl border px-4 py-2.5 text-xs font-bold transition-colors ${category === item ? 'border-[var(--game-primary)] bg-[var(--game-primary)] text-white' : 'border-black/10 bg-white/60 hover:border-[var(--game-primary)]'}`}>{item === 'ALL' ? 'Tất cả' : formatCategoryLabel(item)}</button>)}</div>{featured ? <><Link href={gameUrl(game.subdomain, `/tin-tuc/${featured.slug}`)} className="group mt-10 grid overflow-hidden rounded-3xl border border-black/10 bg-white/60 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl md:grid-cols-[1.15fr_0.85fr]"><div className="aspect-[16/9] overflow-hidden bg-black/10 md:aspect-auto">{featured.coverImageUrl ? <img src={featured.coverImageUrl} alt={featured.title} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" /> : null}</div><div className="flex flex-col justify-center p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-wider text-[var(--game-primary)]">{formatCategoryLabel(featured.category)}</p><h2 className="mt-3 text-2xl font-black sm:text-3xl">{featured.title}</h2><p className="mt-4 text-sm leading-7 opacity-70">{featured.excerpt}</p><div className="mt-6 flex flex-wrap items-center gap-4 text-xs opacity-60"><span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" /> {formatDate(featured.publishedAt)}</span><span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5" /> {readTime(featured.excerpt)} phút đọc</span></div><span className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-[var(--game-primary)]">Đọc bài viết <ArrowRight className="size-4 transition-transform duration-200" /></span></div></Link><div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{rest.map((article) => <Link key={article.slug} href={gameUrl(game.subdomain, `/tin-tuc/${article.slug}`)} className="group overflow-hidden rounded-2xl border border-black/10 bg-white/55 transition-all hover:-translate-y-1 hover:border-[var(--game-primary)] hover:shadow-lg"><div className="aspect-[16/9] overflow-hidden bg-black/10">{article.coverImageUrl ? <img src={article.coverImageUrl} alt={article.title} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" /> : null}</div><div className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-[var(--game-primary)]">{formatCategoryLabel(article.category)}</p><h2 className="mt-3 text-xl font-bold">{article.title}</h2><p className="mt-3 line-clamp-2 text-sm leading-6 opacity-70">{article.excerpt}</p><div className="mt-5 flex items-center justify-between text-xs opacity-55"><span>{formatDate(article.publishedAt)}</span><ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></div></div></Link>)}</div></> : <div className="mt-10 rounded-2xl border border-dashed border-black/20 p-10 text-center opacity-70">Chưa có bài viết cho game này.</div>}</div>;
}

function formatDate(value?: string | null) {
  if (!value) return 'Chưa cập nhật';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function readTime(value: string) {
  return Math.max(1, Math.ceil(value.trim().split(/\s+/).filter(Boolean).length / 35));
}
