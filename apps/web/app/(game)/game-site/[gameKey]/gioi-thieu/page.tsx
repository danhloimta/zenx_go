'use client';

import Link from 'next/link';
import { ArrowRight, Globe2, Sparkles } from 'lucide-react';
import { useGame } from '@/components/game/game-context';
import { gameUrl } from '@/lib/domain';

export default function AboutGamePage() {
  const game = useGame();
  return <article className="mx-auto max-w-5xl px-4 py-16 sm:px-6"><p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--game-primary)]"><Sparkles className="size-4" /> Giới thiệu</p><h1 className="mt-4 text-4xl font-black sm:text-6xl">{game.name}</h1><p className="mt-6 max-w-3xl text-xl leading-9 opacity-75">{game.tagline}</p><div className="mt-12 grid gap-10 md:grid-cols-[1.15fr_0.85fr] md:items-start"><div className="space-y-6 text-base leading-8 opacity-80"><p>{game.longDescription ?? game.shortDescription}</p><p>Đây là không gian chính thức để theo dõi định hướng, hình ảnh và những cập nhật trong quá trình phát triển {game.name}.</p><h2 className="pt-6 text-2xl font-black opacity-100">Triết lý xây dựng</h2><p>Mỗi quyết định thiết kế đều hướng đến một thế giới có cá tính, dễ tiếp cận và đủ chiều sâu để cộng đồng cùng khám phá.</p></div><aside className="rounded-3xl border border-black/10 bg-white/55 p-6"><div className="flex items-center gap-3"><Globe2 className="size-6 text-[var(--game-primary)]" /><h2 className="font-black">Nền tảng dự kiến</h2></div><div className="mt-5 flex flex-wrap gap-2">{game.platforms.map((platform) => <span key={platform} className="rounded-full border border-black/10 px-3 py-1.5 text-sm font-semibold">{platform}</span>)}</div><p className="mt-5 text-sm leading-6 opacity-70">Lịch mở thử nghiệm và thông tin phát hành sẽ được công bố theo từng mốc roadmap.</p><Link href={gameUrl(game.subdomain, '/roadmap')} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--game-primary)]">Xem roadmap <ArrowRight className="size-4" /></Link></aside></div></article>;
}
