'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight, Clock3, Newspaper, Sparkles } from 'lucide-react';
import { NewsItem } from '@/lib/games-data';

const NEWS_CATEGORIES = [
  'Tất cả',
  'Tiến độ phát triển',
  'Thông báo',
  'Sự kiện',
  'Bảo trì',
];

export function NewsSection({ news, dataUnavailable = false }: { news: NewsItem[]; dataUnavailable?: boolean }) {
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');

  const filteredNews = selectedCategory === 'Tất cả'
    ? news
    : news.filter((item) => item.category === selectedCategory);

  const featuredArticle = filteredNews[0];
  const sideArticles = filteredNews.slice(1, 3);

  return (
    <section id="news" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Section Header & Subtitle */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 pb-5 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-100/80 text-[#00873E]">
              <Newspaper className="size-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#00873E]">
              BẢN TIN CẬP NHẬT
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Tin mới từ các thế giới
          </h2>

          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-lg">
            Theo dõi tiến độ phát triển game, nhật ký dev log và thông báo sự kiện mới nhất.
          </p>
        </div>

        {/* View All Button */}
        <Link
          href="/news"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200/90 text-xs font-bold text-slate-700 hover:text-[#00873E] hover:border-[#00873E]/40 hover:bg-emerald-50/30 shadow-2xs transition-all w-fit shrink-0"
        >
          <span>Xem tất cả bài viết</span>
          <ChevronRight className="size-3.5" />
        </Link>
      </div>

      {/* Clean, Unified Filter Tabs with Generous Padding */}
      <div className="mb-8 flex items-center overflow-x-auto pb-2 scrollbar-none gap-2.5 sm:gap-3">
        {NEWS_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`inline-flex items-center justify-center h-10 sm:h-10.5 px-5 sm:px-6 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#00873E] text-white shadow-sm border border-[#00873E]'
                  : 'bg-white border border-slate-200 text-slate-700 hover:text-slate-950 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
              }`}
            >
              <span>{cat}</span>
            </button>
          );
        })}
      </div>

      {/* High-Clarity Spotlight News Layout */}
      {dataUnavailable ? (
        <div className="rounded-3xl border border-dashed border-amber-300 bg-amber-50 p-10 text-center text-sm text-amber-900">
          Không thể tải bản tin lúc này. Vui lòng thử lại sau.
        </div>
      ) : featuredArticle ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
          {/* Left Column (7/12): Featured Spotlight Hero Article */}
          <Link
            href={featuredArticle.href}
            aria-label={`Đọc bài viết nổi bật ${featuredArticle.title}`}
            className="group relative lg:col-span-7 rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-1.5 flex flex-col justify-end min-h-[380px] sm:min-h-[420px] lg:min-h-[450px] cursor-pointer"
          >
            {/* 100% Pure, Sharp High-Res Background Image */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              {featuredArticle.imageUrl ? <img src={featuredArticle.imageUrl} alt={featuredArticle.title} className="size-full object-cover object-center scale-100 contrast-[1.03] brightness-[1.02] transition-transform duration-700 ease-out group-hover:scale-108" /> : <div className="size-full bg-slate-800" />}

              {/* Minimal Bottom Vignette Only */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 via-35% to-transparent pointer-events-none" />
            </div>

            {/* Top Floating Badges */}
            <div className="absolute top-3.5 inset-x-3.5 z-10 flex items-center justify-between gap-2 pointer-events-none">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase bg-black/60 text-emerald-400 backdrop-blur-md border border-emerald-500/30 shadow-sm">
                <Sparkles className="size-3 text-[#22c55e]" />
                <span>TÂM ĐIỂM CẬP NHẬT</span>
              </span>

              <span className="inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-black/60 text-slate-200 backdrop-blur-md border border-white/10 shadow-sm">
                {featuredArticle.gameTitle}
              </span>
            </div>

            {/* Bottom Content Layer - Compact & Clean */}
            <div className="relative z-10 p-5 sm:p-6 flex flex-col justify-end">
              {/* Meta Row: Date & Reading Time */}
              <div className="flex items-center gap-2 text-[11px] font-medium text-slate-300 mb-1 drop-shadow">
                <span>{featuredArticle.date}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock3 className="size-3 text-slate-400" />
                  <span>{featuredArticle.readTime}</span>
                </div>
              </div>

              {/* Article Headline - Compact */}
              <h3 className="font-game-title text-lg sm:text-xl font-black text-white uppercase tracking-wide leading-snug drop-shadow-md group-hover:text-emerald-300 transition-colors">
                {featuredArticle.title}
              </h3>

              {/* Excerpt */}
              <p className="mt-1 text-xs text-slate-300 font-normal leading-relaxed max-w-lg line-clamp-2 drop-shadow-xs">
                {featuredArticle.description}
              </p>

              {/* Bottom Action Line */}
              <div className="mt-3.5 pt-2.5 border-t border-white/10 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors">
                  <span>Đọc toàn bộ bài viết</span>
                  <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                </span>

                <span className="size-6.5 rounded-full bg-white/10 group-hover:bg-[#00873E] text-white flex items-center justify-center transition-all border border-white/15">
                  <ArrowRight className="size-3" />
                </span>
              </div>
            </div>
          </Link>

          {/* Right Column (5/12): 2 Full-Poster Horizontal Cards */}
          <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-5 justify-between">
            {sideArticles.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                aria-label={`Đọc bài viết ${item.title}`}
                className="group relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 flex-1 flex flex-col justify-end min-h-[190px] sm:min-h-[210px] cursor-pointer"
              >
                {/* 100% Full-Bleed Artwork for Side Cards */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="size-full object-cover object-center scale-100 contrast-[1.03] brightness-[1.02] transition-transform duration-700 ease-out group-hover:scale-108" /> : <div className="size-full bg-slate-800" />}

                  {/* Minimal Bottom Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 via-40% to-transparent pointer-events-none" />
                </div>

                {/* Top Floating Badges */}
                <div className="absolute top-3 inset-x-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
                  <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold bg-black/60 text-slate-200 backdrop-blur-md border border-white/10">
                    {item.gameTitle}
                  </span>

                  <span className="text-[10px] font-medium text-slate-300 bg-black/50 px-2 py-0.5 rounded-lg backdrop-blur-md">
                    {item.date}
                  </span>
                </div>

                {/* Bottom Content Area */}
                <div className="relative z-10 p-4 sm:p-4.5 flex flex-col justify-end">
                  {/* Title */}
                  <h3 className="font-game-title text-sm sm:text-base font-black text-white uppercase tracking-tight leading-snug drop-shadow-md group-hover:text-emerald-300 transition-colors line-clamp-1">
                    {item.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="mt-0.5 text-[11px] text-slate-300 font-normal leading-relaxed line-clamp-1 drop-shadow-xs">
                    {item.description}
                  </p>

                  {/* Read Link */}
                  <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors">
                      <span>Đọc bài viết</span>
                      <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <span className="size-5.5 rounded-full bg-white/10 group-hover:bg-[#00873E] text-white flex items-center justify-center transition-all">
                      <ArrowRight className="size-2.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-600">
          Chưa có bài viết mới.
        </div>
      )}
    </section>
  );
}
