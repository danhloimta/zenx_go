'use client';

import { Suspense, useState, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  ArrowRight,
  Crosshair,
  Dices,
  Gamepad2,
  Globe,
  MapPin,
  Monitor,
  RotateCcw,
  Search,
  Smartphone,
  Sparkles,
  Swords
} from 'lucide-react';
import type { GameItem } from '@/lib/games-data';

const CATEGORIES = [
  { key: 'ALL', label: 'Tất cả thể loại', icon: Gamepad2 },
  { key: 'MMORPG', label: 'MMORPG', icon: Sparkles },
  { key: 'Chiến thuật', label: 'Chiến thuật', icon: Swords },
  { key: 'Casual', label: 'Casual', icon: Dices },
  { key: 'Bắn súng', label: 'Bắn súng', icon: Crosshair },
];

const PLATFORMS = [
  { key: 'ALL', label: 'Tất cả nền tảng' },
  { key: 'PC', label: 'PC' },
  { key: 'Mobile', label: 'Mobile' },
  { key: 'Web', label: 'Web' },
];

const STATUSES = [
  { key: 'ALL', label: 'Tất cả trạng thái' },
  { key: 'Đang hoạt động', label: 'Đang hoạt động' },
];

export function GamesCatalogClient({ initialGames }: { initialGames: GameItem[] }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8fafc] px-4 py-20 text-center text-sm text-slate-500">
          Đang tải kho trò chơi ZENX GO…
        </div>
      }
    >
      <GamesCatalogContent games={initialGames} />
    </Suspense>
  );
}

function GamesCatalogContent({ games }: { games: GameItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');

  const selectedCategory = searchParams.get('category') || 'ALL';
  const selectedPlatform = searchParams.get('platform') || 'ALL';
  const selectedStatus = searchParams.get('status') || 'ALL';

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value && value !== 'ALL') {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    router.replace(`${pathname}${next.toString() ? `?${next.toString()}` : ''}`, { scroll: false });
  };

  const clearFilters = () => {
    setSearchQuery('');
    router.replace(pathname, { scroll: false });
  };

  const filteredGames = useMemo(() => {
    return games.filter((game: GameItem) => {
      // Category filter
      if (selectedCategory !== 'ALL' && game.category !== selectedCategory) {
        return false;
      }
      // Platform filter
      if (selectedPlatform !== 'ALL' && !game.platforms.includes(selectedPlatform)) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'ALL' && game.status !== selectedStatus) {
        return false;
      }
      // Search text filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = game.title.toLowerCase().includes(q);
        const matchesSlogan = (game.slogan || '').toLowerCase().includes(q);
        const matchesSynopsis = (game.synopsis || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesSlogan && !matchesSynopsis) return false;
      }
      return true;
    });
  }, [games, selectedCategory, selectedPlatform, selectedStatus, searchQuery]);

  const hasActiveFilters =
    selectedCategory !== 'ALL' ||
    selectedPlatform !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    Boolean(searchQuery.trim());

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
    <div className="min-h-screen bg-[#f8fafc] px-4 py-10 sm:px-6 lg:px-8 sm:py-14">
      <div className="mx-auto max-w-7xl">
          {/* Hero Header Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-emerald-100/80 bg-gradient-to-br from-white via-emerald-50/40 to-sky-50/50 p-8 sm:p-12 shadow-sm">
            <div className="relative z-10 max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#00873E] shadow-2xs mb-4">
                <Gamepad2 className="size-4" /> KHO TRÒ CHƠI ZENX GO
              </span>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                Khám phá thế giới của bạn
              </h1>

              <p className="mt-3.5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                Tất cả các tựa game trong hệ sinh thái ZENX GO — từ MMORPG thần thoại, chiến thuật hoàng triều đến thị trấn mây và chiến tuyến không gian.
              </p>
            </div>

            {/* Quick Search Input */}
            <div className="mt-8 relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên game hoặc từ khóa..."
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white/95 text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-2xs focus:border-[#00873E] focus:outline-none focus:ring-2 focus:ring-[#00873E]/20 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  Xóa
                </button>
              )}
            </div>
          </div>

          {/* Primary Filter Tabs: Category */}
          <div className="mt-8 flex items-center overflow-x-auto pb-2 scrollbar-none gap-2.5 sm:gap-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => updateParam('category', cat.key)}
                  className={`inline-flex items-center gap-2 h-10 sm:h-11 px-5 sm:px-6 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#00873E] text-white shadow-sm border border-[#00873E]'
                      : 'bg-white border border-slate-200 text-slate-700 hover:text-slate-950 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
                  }`}
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Secondary Filter Dropdowns & Reset */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-6">
            <div className="flex flex-wrap items-center gap-3">
              {/* Platform Select */}
              <label className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-500 shadow-2xs">
                <span>Nền tảng:</span>
                <select
                  aria-label="Nền tảng"
                  value={selectedPlatform}
                  onChange={(e) => updateParam('platform', e.target.value)}
                  className="bg-transparent py-1 text-xs sm:text-sm font-bold text-slate-800 outline-none cursor-pointer"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>

              {/* Status Select */}
              <label className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-500 shadow-2xs">
                <span>Trạng thái:</span>
                <select
                  aria-label="Trạng thái"
                  value={selectedStatus}
                  onChange={(e) => updateParam('status', e.target.value)}
                  className="bg-transparent py-1 text-xs sm:text-sm font-bold text-slate-800 outline-none cursor-pointer"
                >
                  {STATUSES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Total Results & Clear Filters Button */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500">
                Hiển thị <strong className="text-slate-900 font-bold">{filteredGames.length}</strong> trò chơi
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:text-[#00873E] hover:border-[#00873E]/40 transition-all shadow-2xs"
                >
                  <RotateCcw className="size-3.5" /> Xóa bộ lọc
                </button>
              )}
            </div>
          </div>

          {/* Games Grid */}
          {filteredGames.length ? (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredGames.map((game: GameItem) => (
                <div
                  key={game.id}
                  className="group relative flex flex-col justify-between rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-1.5"
                >
                  {/* Poster Image Container */}
                  <a
                    href={game.websiteUrl}
                    aria-label={`Trang chủ ${game.title}`}
                    className="relative aspect-[3/4.2] w-full overflow-hidden block cursor-pointer"
                  >
                    <img
                      src={game.assets.thumbnail}
                      alt={game.alt}
                      className="size-full object-cover object-center scale-100 contrast-[1.03] brightness-[1.02] transition-transform duration-700 ease-out group-hover:scale-108"
                      style={{ objectPosition: game.focalPoint || 'center' }}
                      loading="lazy"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 via-35% to-transparent pointer-events-none" />

                    {/* Top Floating Badges */}
                    <div className="absolute top-3 inset-x-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase bg-black/60 text-slate-200 backdrop-blur-md border border-white/10 shadow-sm">
                        <span>{game.categoryDisplay}</span>
                      </span>

                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-black/60 text-slate-200 backdrop-blur-md border border-white/10 shadow-sm">
                        <span className={`size-1.5 rounded-full ${getStatusDot(game.statusColor)}`} />
                        <span>{game.status}</span>
                      </span>
                    </div>

                    {/* Bottom Info inside Artwork */}
                    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 z-10 flex flex-col justify-end">
                      {/* Platforms Row */}
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-300 mb-1 drop-shadow">
                        {game.platforms.includes('PC') && <Monitor className="size-3 text-slate-400" />}
                        {game.platforms.includes('Mobile') && <Smartphone className="size-3 text-slate-400" />}
                        {game.platforms.includes('Web') && <Globe className="size-3 text-slate-400" />}
                        <span>{game.platforms.join(' • ')}</span>
                      </div>

                      {/* Game Title */}
                      <h3 className="font-game-title text-base sm:text-lg font-black text-white uppercase tracking-wide leading-snug drop-shadow-md group-hover:text-emerald-300 transition-colors">
                        {game.title}
                      </h3>

                      {/* Slogan */}
                      <p className="mt-1 text-xs text-slate-300 line-clamp-1 drop-shadow">
                        {game.slogan}
                      </p>
                    </div>
                  </a>

                  {/* Card Bottom Actions */}
                  <div className="p-4 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <a
                      href={game.websiteUrl}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <span>Trang chủ</span>
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </a>

                    {game.roadmapUrl && (
                      <a
                        href={game.roadmapUrl}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        <MapPin className="size-3" />
                        <span>Lộ trình</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-12 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#00873E]">
                <Gamepad2 className="size-7" />
              </div>
              <h3 className="mt-4 text-lg font-black text-slate-900">Không tìm thấy trò chơi phù hợp</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Không có game nào khớp với các tiêu chí tìm kiếm hiện tại. Hãy thử thay đổi bộ lọc hoặc tìm kiếm từ khóa khác.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#00873E] px-5 text-xs font-bold text-white hover:bg-[#007033] shadow-xs transition-all"
              >
                <RotateCcw className="size-3.5" /> Đặt lại bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>
    );
}
