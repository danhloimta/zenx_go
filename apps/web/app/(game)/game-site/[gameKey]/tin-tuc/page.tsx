'use client';

import Link from 'next/link';
import { gameUrl } from '@/lib/domain';
import { useGame } from '@/components/game/game-context';

export default function NewsPage() {
  const game = useGame();
  return <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--game-primary)]">Tin tức</p><h1 className="mt-4 text-4xl font-black sm:text-5xl">Development Updates</h1>{game.articles.length ? <div className="mt-10 grid gap-6 md:grid-cols-3">{game.articles.map((article) => <Link key={article.slug} href={gameUrl(game.subdomain, `/tin-tuc/${article.slug}`)} className="overflow-hidden rounded-2xl border border-black/10 bg-white/60 hover:border-[var(--game-primary)]">{article.coverImageUrl ? <img src={article.coverImageUrl} alt="" className="aspect-[16/9] w-full object-cover" /> : null}<div className="p-6"><p className="text-xs font-bold uppercase tracking-wider text-[var(--game-primary)]">{article.category.replaceAll('_', ' ')}</p><h2 className="mt-3 text-xl font-bold">{article.title}</h2><p className="mt-3 text-sm leading-6 opacity-70">{article.excerpt}</p></div></Link>)}</div> : <div className="mt-10 rounded-2xl border border-dashed border-black/20 p-10 text-center opacity-70">Chưa có bài viết cho game này.</div>}</div>;
}
