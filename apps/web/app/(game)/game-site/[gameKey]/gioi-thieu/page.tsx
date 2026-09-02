'use client';

import { useGame } from '@/components/game/game-context';

export default function AboutGamePage() {
  const game = useGame();
  return <article className="mx-auto max-w-4xl px-4 py-16 sm:px-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--game-primary)]">Giới thiệu</p><h1 className="mt-4 text-4xl font-black sm:text-6xl">{game.name}</h1><p className="mt-6 text-xl leading-9 opacity-75">{game.tagline}</p><div className="mt-12 space-y-6 text-base leading-8 opacity-80"><p>{game.longDescription ?? game.shortDescription}</p><p>Đây là không gian chính thức để theo dõi định hướng, hình ảnh và những cập nhật trong quá trình phát triển {game.name}.</p><h2 className="pt-6 text-2xl font-black opacity-100">Triết lý xây dựng</h2><p>Mỗi quyết định thiết kế đều hướng đến một thế giới có cá tính, dễ tiếp cận và đủ chiều sâu để cộng đồng cùng khám phá.</p></div></article>;
}
