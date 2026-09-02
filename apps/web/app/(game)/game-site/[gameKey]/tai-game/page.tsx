'use client';

import { Download } from 'lucide-react';
import { useGame } from '@/components/game/game-context';

export default function DownloadPage() {
  const game = useGame();
  return <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--game-primary)]">Tải game</p><h1 className="mt-4 text-4xl font-black sm:text-5xl">Sẵn sàng cho ngày ra mắt</h1><p className="mt-5 max-w-2xl leading-7 opacity-70">{game.name} đang được chuẩn bị trên các nền tảng dưới đây. Khi có bản tải chính thức, thông tin sẽ được cập nhật tại trang này.</p><div className="mt-10 grid gap-5 sm:grid-cols-3">{game.platforms.map((platform) => <div key={platform} className="rounded-2xl border border-black/10 bg-white/55 p-6"><Download className="size-6 text-[var(--game-primary)]" /><h2 className="mt-6 text-xl font-bold">{platform}</h2><p className="mt-2 text-sm opacity-65">COMING SOON</p><span className="mt-6 inline-flex rounded-full bg-black/5 px-3 py-1 text-xs font-semibold opacity-60">Chưa mở tải</span></div>)}</div></div>;
}
