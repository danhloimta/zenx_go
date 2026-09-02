'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ChevronRight,
  Crosshair,
  Dices,
  Flame,
  Gamepad2,
  Globe,
  Monitor,
  Smartphone,
  Sparkles,
  Swords
} from 'lucide-react';
import { GameItem } from '@/lib/games-data';

const CATEGORIES = [
  { key: 'ALL', label: 'Tất cả', icon: null },
  { key: 'MMORPG', label: 'MMORPG', icon: Gamepad2 },
  { key: 'Chiến thuật', label: 'Chiến thuật', icon: Swords },
  { key: 'Casual', label: 'Casual', icon: Dices },
  { key: 'Bắn súng', label: 'Bắn súng', icon: Crosshair },
];

export function GamesSection({ games }: { games: GameItem[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredGames = selectedCategory === 'ALL'
    ? games
    : games.filter((game) => game.category === selectedCategory);

  const getGameIcon = (slug: string) => {
    switch (slug) {
      case 'luc-dia-dam-me':
        return <Sparkles className="size-3 text-[#22c55e]" />;
      case 'vuong-trieu-hoa-long':
        return <Flame className="size-3 text-amber-400" />;
      case 'thi-tran-may':
        return <Dices className="size-3 text-sky-400" />;
      case 'chien-tuyen-orion':
        return <Crosshair className="size-3 text-purple-400" />;
      default:
        return <Sparkles className="size-3 text-[#22c55e]" />;
    }
  };

  const getStatusDot = (color: GameItem['statusColor']) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]';
      case 'amber':
        return 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]';
      case 'blue':
        return 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]';
      case 'purple':
        return 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.9)]';
      default:
        return 'bg-emerald-400';
    }
  };

  return (
    <section id="games" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 pb-5 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-100/80 text-[#00873E]">
              <Gamepad2 className="size-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#00873E]">
              KHO TRÒ CHƠI ZENX
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Tìm game dành cho bạn
          </h2>

          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-lg">
            Khám phá các tựa game thế hệ mới từ nhập vai thần thoại đến chiến thuật không gian.
          </p>
        </div>

        {/* View All Button */}
        <Link
          href="/games"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200/90 text-xs font-bold text-slate-700 hover:text-[#00873E] hover:border-[#00873E]/40 hover:bg-emerald-50/30 shadow-2xs transition-all w-fit shrink-0"
        >
          <span>Xem tất cả trò chơi</span>
          <ChevronRight className="size-3.5" />
        </Link>
      </div>

      {/* Clean, Unified Filter Tabs with Generous Padding */}
      <div className="mb-8 flex items-center overflow-x-auto pb-2 scrollbar-none gap-2.5 sm:gap-3">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.key;

          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`inline-flex items-center justify-center gap-2 h-10 sm:h-10.5 px-5 sm:px-6 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#00873E] text-white shadow-sm border border-[#00873E]'
                  : 'bg-white border border-slate-200 text-slate-700 hover:text-slate-950 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
              }`}
            >
              {Icon && (
                <Icon
                  className={`size-4 ${
                    isActive ? 'text-white' : 'text-slate-500'
                  }`}
                />
              )}
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Pure High-Vibrancy Poster Cards Grid (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {filteredGames.map((game) => (
          <a
            key={game.id}
            href={game.websiteUrl}
            aria-label={`Mở trang chủ chính thức ${game.title}`}
            className="group relative flex flex-col justify-between rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer"
          >
            {/* Full Poster Container */}
            <div className="relative aspect-[3/4.2] w-full overflow-hidden">
              {/* 100% Pure, Unaltered, High-Saturation Game Artwork */}
              <img
                src={game.assets.thumbnail}
                alt={game.alt}
                className="size-full object-cover object-center scale-100 contrast-[1.03] brightness-[1.02] transition-transform duration-700 ease-out group-hover:scale-108"
                style={{ objectPosition: game.focalPoint || 'center' }}
              />

              {/* Minimal Bottom Vignette Only - No White Overlay anywhere */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 via-35% to-transparent pointer-events-none" />

              {/* Top Floating Glass Badges */}
              <div className="absolute top-3 inset-x-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
                {/* Category Badge */}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase bg-black/60 text-slate-200 backdrop-blur-md border border-white/10 shadow-sm">
                  {getGameIcon(game.slug)}
                  <span>{game.categoryDisplay}</span>
                </span>

                {/* Status Badge */}
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-black/60 text-slate-200 backdrop-blur-md border border-white/10 shadow-sm">
                  <span className={`size-1.5 rounded-full ${getStatusDot(game.statusColor)}`} />
                  <span>{game.status}</span>
                </span>
              </div>

              {/* Bottom Compact Info & Button */}
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-4.5 z-10 flex flex-col justify-end">
                {/* Platforms Row */}
                <div className="flex items-center gap-1 text-[10px] font-medium text-slate-300 mb-1 drop-shadow">
                  {game.platforms.includes('PC') && <Monitor className="size-2.5 text-slate-400" />}
                  {game.platforms.includes('Mobile') && <Smartphone className="size-2.5 text-slate-400" />}
                  {game.platforms.includes('Web') && <Globe className="size-2.5 text-slate-400" />}
                  <span>{game.platforms.join(' • ')}</span>
                </div>

                {/* Game Title - Compact & Crisp */}
                <h3 className="font-game-title text-base sm:text-lg font-black text-white uppercase tracking-wide leading-snug drop-shadow-md group-hover:text-emerald-300 transition-colors">
                  {game.title}
                </h3>

                {/* Slogan */}
                <p className="mt-0.5 text-[11px] font-medium text-slate-300 line-clamp-1 drop-shadow-xs">
                  {game.slogan}
                </p>

                {/* Compact Action Button */}
                <div className="mt-3">
                  <span
                    className="w-full h-8.5 sm:h-9 rounded-xl bg-[#00873E] hover:bg-[#007033] text-white font-bold text-[11px] sm:text-xs shadow-md group-hover:shadow-emerald-950/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>{game.ctaText || 'Truy cập trang chủ'}</span>
                    <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
