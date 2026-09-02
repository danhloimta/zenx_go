'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight, Clock3, Newspaper, Sparkles } from 'lucide-react';
import { NewsItem } from '@/lib/games-data';
import { gameUrl } from '@/lib/domain';

const NEWS_CATEGORIES = [
  'Tất cả',
  'Development Update',
  'Thông báo',
  'Sự kiện',
  'Bảo trì',
];

export function NewsSection({ news }: { news: NewsItem[] }) {
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');

  const filteredNews = selectedCategory === 'Tất cả'
    ? news
    : news.filter((item) => item.category === selectedCategory);

  const getCategoryBadgeClass = (color: NewsItem['categoryColor']) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30';
      case 'blue':
        return 'bg-sky-950/80 text-sky-300 border-sky-500/30';
      case 'purple':
        return 'bg-purple-950/80 text-purple-300 border-purple-500/30';
      case 'amber':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-950/80 text-slate-300 border-slate-700/60';
    }
  };

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
          href={gameUrl('lucdia', '/tin-tuc')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200/90 text-xs font-bold text-slate-700 hover:text-[#00873E] hover:border-[#00873E]/40 hover:bg-emerald-50/30 shadow-2xs transition-all w-fit shrink-0"
        >
          <span>Xem tất cả bài viết</span>
          <ChevronRight className="size-3.5" />
        </Link>
      </div>

      {/* Segmented Control Filter Bar */}
      <div className="mb-8 flex items-center overflow-x-auto pb-2 scrollbar-none">
        <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-slate-200/70 border border-slate-200/80">
          {NEWS_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-[#00873E] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modern 3-Column Editorial News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredNews.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            aria-label={`Đọc bài viết ${item.title}`}
            className="group relative flex flex-col justify-between rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:border-[#00873E]/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            <div>
              {/* Cover Image */}
              <div className="aspect-[16/10] w-full overflow-hidden relative bg-slate-900">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Gradient vignette on image */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                {/* Top Category Badge */}
                <div className="absolute top-3.5 left-3.5 z-10">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md border shadow-sm ${getCategoryBadgeClass(
                      item.categoryColor,
                    )}`}
                  >
                    <Sparkles className="size-3" />
                    {item.category}
                  </span>
                </div>

                {/* Bottom Game Title on Image */}
                <div className="absolute bottom-3 left-3.5 z-10">
                  <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-black/60 text-white backdrop-blur-md border border-white/10">
                    {item.gameTitle}
                  </span>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-5 sm:p-6">
                {/* Meta Row */}
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-2.5">
                  <span>{item.date}</span>
                  <div className="flex items-center gap-1">
                    <Clock3 className="size-3" />
                    <span>{item.readTime}</span>
                  </div>
                </div>

                {/* Article Title */}
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug group-hover:text-[#00873E] transition-colors line-clamp-2">
                  {item.title}
                </h3>

                {/* Excerpt */}
                <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-2">
                  {item.description}
                </p>
              </div>
            </div>

            {/* Card Footer Link */}
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
              <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00873E] group-hover:text-[#007033] transition-colors">
                  <span>Đọc bài viết</span>
                  <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="size-7 rounded-full bg-emerald-50 group-hover:bg-[#00873E] text-[#00873E] group-hover:text-white flex items-center justify-center transition-colors">
                  <ArrowRight className="size-3.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
