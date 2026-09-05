'use client';

import Link from 'next/link';
import { ArrowRight, Globe2, Sparkles } from 'lucide-react';
import { useGame } from '@/components/game/game-context';
import { gameUrl } from '@/lib/domain';

export default function AboutGamePage() {
  const game = useGame();
  const page = game.pageConfig;
  return <article className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
    <p className="inline-flex items-center gap-2 rounded-full border border-[var(--game-primary)]/30 bg-[var(--game-primary)]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--game-primary)]"><Sparkles className="size-3.5" /> {page.intro.eyebrow || 'Giới thiệu game'}</p>
    <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-6xl">{page.intro.title || game.name}</h1>
    <p className="mt-4 max-w-3xl text-lg leading-relaxed opacity-75 sm:text-xl">{game.tagline}</p>
    <div className="mt-12 grid gap-10 md:grid-cols-[1.15fr_0.85fr] md:items-start">
      <div className="space-y-6 text-base leading-8 opacity-80"><p>{page.intro.description || game.longDescription || game.shortDescription}</p><p>{game.shortDescription}</p>{page.featureCards.length ? <><h2 className="pt-4 text-2xl font-black">Điểm nổi bật</h2><div className="grid gap-4 sm:grid-cols-2">{page.featureCards.slice(0, 4).map((item, index) => <div key={`${item.title}-${index}`} className="rounded-2xl border border-black/10 bg-white/50 p-5"><p className="text-xs font-bold text-[var(--game-primary)]">0{index + 1}</p><h3 className="mt-3 font-bold">{item.title}</h3><p className="mt-2 text-sm opacity-70">{item.description}</p></div>)}</div></> : null}</div>
      <aside className="rounded-3xl border border-black/10 bg-white/55 p-6 shadow-sm sm:p-7"><div className="flex items-center gap-3"><Globe2 className="size-6 text-[var(--game-primary)]" /><h2 className="text-lg font-black">Nền tảng hỗ trợ</h2></div><div className="mt-5 flex flex-wrap gap-2">{game.platforms.map((platform) => <span key={platform} className="rounded-full border border-black/10 px-3.5 py-1.5 text-xs font-semibold">{platform}</span>)}</div><p className="mt-5 text-sm leading-relaxed opacity-70">Theo dõi lộ trình và các cập nhật mới nhất của {game.name}.</p><Link href={gameUrl(game.subdomain, '/roadmap')} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--game-primary)]"><span>Xem lộ trình</span><ArrowRight className="size-4" /></Link></aside>
    </div>
  </article>;
}
