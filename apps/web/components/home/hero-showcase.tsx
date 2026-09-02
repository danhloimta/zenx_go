'use client';

import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Globe,
  Monitor,
  Play,
  Smartphone,
  ShieldAlert
} from 'lucide-react';
import { GameItem } from '@/lib/games-data';

export function HeroShowcase({ games }: { games: GameItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const currentGame = games[activeIndex] ?? games[0];

  // Auto slide every 7 seconds
  useEffect(() => {
    if (!games.length) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % games.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [games.length]);

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + games.length) % games.length);
  };

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % games.length);
  };

  if (!currentGame) return null;

  // Determine if active game is a dark artwork (e.g. Orion, Hỏa Long) or light artwork (Lục Địa, Thị Trấn Mây)
  const isDarkTheme =
    currentGame.themePreset === 'DARK_STRATEGY' ||
    currentGame.themePreset === 'SCI_FI_SHOOTER' ||
    currentGame.slug === 'vuong-trieu-hoa-long' ||
    currentGame.slug === 'chien-tuyen-orion';

  return (
    <section className="relative w-full overflow-hidden min-h-[540px] sm:min-h-[600px] lg:min-h-[660px] flex items-center bg-slate-950 group">
      {/* 100% Pure, Unaltered, High-Saturation Game Artwork */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          key={currentGame.id}
          src={currentGame.assets.heroDesktop}
          alt={currentGame.alt}
          className="size-full object-cover object-center scale-100 contrast-[1.04] brightness-[1.02] transition-all duration-700 ease-out"
          style={{ objectPosition: currentGame.focalPoint || 'center' }}
        />

        {/* Adaptive Theme Vignette - Only softly enhances readability without washing out colors */}
        {isDarkTheme ? (
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 via-35% to-transparent pointer-events-none" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/20 via-30% to-transparent pointer-events-none" />
        )}
      </div>

      {/* Floating Left Nav Arrow */}
      <button
        type="button"
        onClick={prevSlide}
        className="absolute left-3 sm:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-30 flex size-11 sm:size-12 items-center justify-center rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-slate-950 shadow-xl border border-slate-200/90 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="size-5 sm:size-6" />
      </button>

      {/* Floating Right Nav Arrow */}
      <button
        type="button"
        onClick={nextSlide}
        className="absolute right-3 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-30 flex size-11 sm:size-12 items-center justify-center rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-slate-950 shadow-xl border border-slate-200/90 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        aria-label="Next Slide"
      >
        <ChevronRight className="size-5 sm:size-6" />
      </button>

      {/* Aligned Inner Content Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-16 sm:py-20 lg:py-24">
        <div className="max-w-xl lg:max-w-2xl">
          {/* Top Tag: GAME MỚI / NỔI BẬT */}
          <span className={`inline-block text-xs font-black tracking-widest uppercase mb-2 ${
            isDarkTheme ? 'text-[#22c55e]' : 'text-[#00873E]'
          }`}>
            {currentGame.featuredBadge ? 'GAME MỚI' : 'NỔI BẬT'}
          </span>

          {/* Main Title */}
          <h1 className={`font-game-title text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight uppercase leading-[1.06] ${
            isDarkTheme ? 'text-white drop-shadow-md' : 'text-slate-950 drop-shadow-xs'
          }`}>
            {currentGame.titleLines ? (
              currentGame.titleLines.map((line, idx) => (
                <span key={idx} className="block">
                  {line}
                </span>
              ))
            ) : (
              currentGame.title
            )}
          </h1>

          {/* Slogan */}
          <p className={`mt-3 sm:mt-3.5 text-lg sm:text-xl font-bold tracking-tight ${
            isDarkTheme ? 'text-slate-200 drop-shadow-sm' : 'text-slate-900 drop-shadow-2xs'
          }`}>
            {currentGame.slogan}
          </p>

          {/* Synopsis / Description */}
          <p className={`mt-2.5 text-xs sm:text-sm font-medium leading-relaxed max-w-lg line-clamp-2 sm:line-clamp-3 ${
            isDarkTheme ? 'text-slate-300 drop-shadow-sm' : 'text-slate-700'
          }`}>
            {currentGame.synopsis || 'Thế giới mở rộng lớn, đồ họa chân thực và chiến trường đỉnh cao mang đến trải nghiệm nhập vai tuyệt đỉnh.'}
          </p>

          {/* Meta Tags Row (Genre, Platforms, Age Rating) */}
          <div className="mt-5 sm:mt-6 flex flex-wrap items-center gap-2.5">
            {/* Category Tag */}
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md shadow-2xs ${
              isDarkTheme
                ? 'bg-slate-900/80 border border-slate-700 text-slate-200'
                : 'bg-white/90 border border-slate-200/90 text-slate-800'
            }`}>
              <Gamepad2 className={`size-3.5 ${isDarkTheme ? 'text-[#22c55e]' : 'text-[#00873E]'}`} />
              <span>{currentGame.categoryDisplay}</span>
            </span>

            {/* Platforms Tag */}
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md shadow-2xs ${
              isDarkTheme
                ? 'bg-slate-900/80 border border-slate-700 text-slate-200'
                : 'bg-white/90 border border-slate-200/90 text-slate-800'
            }`}>
              {currentGame.platforms.includes('PC') && <Monitor className="size-3.5 text-slate-400" />}
              {currentGame.platforms.includes('Mobile') && <Smartphone className="size-3.5 text-slate-400" />}
              {currentGame.platforms.includes('Web') && <Globe className="size-3.5 text-slate-400" />}
              <span>{currentGame.platforms.join(' • ')}</span>
            </span>

            {/* 18+ / Age Rating Badge */}
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md shadow-2xs ${
              isDarkTheme
                ? 'bg-slate-900/80 border border-slate-700 text-slate-200'
                : 'bg-white/90 border border-slate-200/90 text-slate-800'
            }`}>
              <ShieldAlert className="size-3.5 text-amber-500" />
              <span>18+</span>
            </span>
          </div>

          {/* CTA Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href={currentGame.websiteUrl}
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-[#00873E] hover:bg-[#007033] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg active:scale-98 transition-all"
            >
              <Play className="size-4 fill-white text-white" />
              <span>Chơi ngay</span>
            </a>

            <a
              href={currentGame.roadmapUrl ?? currentGame.websiteUrl}
              className={`inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl text-xs sm:text-sm font-bold shadow-2xs hover:shadow-xs active:scale-98 transition-all ${
                isDarkTheme
                  ? 'bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-white backdrop-blur-md'
                  : 'bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-800'
              }`}
            >
              <span>Khám phá thêm</span>
            </a>
          </div>
        </div>
      </div>

      {/* Centered Pagination Dots at Bottom */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5">
        {games.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveIndex(idx)}
            className={`rounded-full transition-all duration-300 cursor-pointer ${
              idx === activeIndex
                ? 'w-7 h-2.5 bg-[#00873E]'
                : isDarkTheme
                  ? 'size-2.5 bg-white/40 hover:bg-white/60'
                  : 'size-2.5 bg-slate-400/80 hover:bg-slate-500'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
