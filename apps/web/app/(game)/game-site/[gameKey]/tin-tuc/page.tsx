'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Clock3, Newspaper, Radio, Flame, Sparkles } from 'lucide-react';
import { gameUrl } from '@/lib/domain';
import { useGame } from '@/components/game/game-context';
import { formatCategoryLabel } from '@/lib/games-data';

export default function NewsPage() {
  const game = useGame();
  const [category, setCategory] = useState('ALL');

  const isOrion = game.slug === 'chien-tuyen-orion' || game.subdomain === 'orion';
  const isHoaLong = game.slug === 'vuong-trieu-hoa-long' || game.subdomain === 'hoalong';
  const isLucDiaDamMe = game.slug === 'luc-dia-dam-me' || game.subdomain === 'lucdia';

  const categories = useMemo(
    () => ['ALL', ...Array.from(new Set(game.articles.map((article) => article.category)))],
    [game.articles]
  );

  const articles = category === 'ALL'
    ? game.articles
    : game.articles.filter((article) => article.category === category);

  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
      {/* 1. Header Section */}
      <div className={`pb-8 border-b ${
        isOrion
          ? 'border-slate-800'
          : isHoaLong
          ? 'border-[#251b14]'
          : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          {isOrion ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
              <Radio className="size-3.5 animate-pulse text-cyan-400" />
              SYS.LOG // BẢN TIN CHIẾN SỰ
            </span>
          ) : isHoaLong ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-serif font-bold uppercase tracking-wider bg-amber-950/80 border border-amber-500/40 text-amber-300">
              <Flame className="size-3.5 text-amber-400" />
              HOÀNG THÀNH // CHIẾU CHỈ MỚI
            </span>
          ) : isLucDiaDamMe ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-serif font-bold uppercase tracking-wider bg-[#f0efe9] border border-[#c69a58]/40 text-[#9d7d47]">
              <Sparkles className="size-3.5 text-[#9d7d47]" />
              LỤC ĐỊA // SEASON 6
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-50 border border-sky-200 text-[#118a94]">
              <Newspaper className="size-3.5 text-[#118a94]" />
              BẢN TIN THỊ TRẤN
            </span>
          )}
        </div>

        <h1 className={`mt-4 text-3xl sm:text-5xl font-black tracking-tight ${
          isOrion
            ? 'text-white font-mono uppercase'
            : isHoaLong
            ? 'text-white font-serif'
            : isLucDiaDamMe
            ? 'text-[#152238] font-serif'
            : 'text-[#123b63] font-serif'
        }`}>
          {isOrion
            ? 'Nhật Ký Tác Chiến'
            : isHoaLong
            ? 'Tin Tức Vương Triều'
            : isLucDiaDamMe
            ? 'Tin Tức Lục Địa'
            : 'Tin Tức Mới Nhất'}
        </h1>

        <p className={`mt-3 max-w-2xl text-sm sm:text-base leading-relaxed ${
          isOrion
            ? 'text-slate-300'
            : isHoaLong
            ? 'text-[#baa98a]'
            : isLucDiaDamMe
            ? 'text-[#526478] font-serif'
            : 'text-slate-600'
        }`}>
          {isOrion
            ? 'Theo dõi các báo cáo chiến thuật, cập nhật vũ khí và thông báo vận hành từ Vành Đai Orion.'
            : isHoaLong
            ? 'Cập nhật chiến sự liên minh, sự kiện Long Thần và các chiếu chỉ mới nhất từ hoàng triều.'
            : isLucDiaDamMe
            ? 'Theo dõi các thay đổi, hoạt động mùa và thông báo mới nhất của thế giới Lục Địa Đam Mê.'
            : `Theo dõi các thay đổi, hoạt động mùa và thông báo mới nhất của thế giới ${game.name}.`}
        </p>
      </div>

      {/* 2. Category Filter Tabs */}
      <div className="mt-8 flex flex-wrap gap-2.5">
        {categories.map((item) => {
          const isSelected = category === item;
          const label = item === 'ALL' ? 'Tất cả' : formatCategoryLabel(item);

          let buttonClasses = '';
          if (isOrion) {
            buttonClasses = isSelected
              ? 'border-cyan-400 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-mono shadow-md shadow-cyan-950/60'
              : 'border-slate-800 bg-slate-900/90 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 font-mono';
          } else if (isHoaLong) {
            buttonClasses = isSelected
              ? 'border-amber-500 bg-gradient-to-r from-[#c85a17] to-[#a53b13] text-white font-serif shadow-md shadow-amber-950/60'
              : 'border-[#251b14] bg-[#121110] text-[#baa98a] hover:border-amber-500/50 hover:text-amber-200 font-serif';
          } else if (isLucDiaDamMe) {
            buttonClasses = isSelected
              ? 'border-[#4b5638] bg-[#4b5638] text-white font-serif shadow-xs'
              : 'border-black/10 bg-white/90 text-[#152238] hover:border-[#4b5638] font-serif';
          } else {
            buttonClasses = isSelected
              ? 'border-[#118a94] bg-[#118a94] text-white font-bold shadow-xs'
              : 'border-slate-200 bg-white text-slate-700 hover:border-[#118a94]';
          }

          return (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`rounded-xl border px-4 py-2 text-xs font-bold transition-all cursor-pointer ${buttonClasses}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* 3. Featured Article */}
      {featured ? (
        <>
          <Link
            href={gameUrl(game.subdomain, `/tin-tuc/${featured.slug}`)}
            className={`group mt-10 grid overflow-hidden rounded-3xl border transition-all hover:-translate-y-1 md:grid-cols-[1.15fr_0.85fr] ${
              isOrion
                ? 'border-cyan-500/30 bg-slate-900/90 shadow-2xl hover:border-cyan-400/60 hover:shadow-cyan-950/50'
                : isHoaLong
                ? 'border-[#251b14] bg-[#121110] shadow-xl hover:border-amber-500/50'
                : isLucDiaDamMe
                ? 'border-black/5 bg-white shadow-xs hover:border-[#c8c7be] hover:shadow-md'
                : 'border-slate-200 bg-white shadow-xs hover:border-[#118a94]/40 hover:shadow-md'
            }`}
          >
            <div className="aspect-[16/9] overflow-hidden bg-slate-950 md:aspect-auto relative">
              {featured.coverImageUrl ? (
                <img
                  src={featured.coverImageUrl}
                  alt={featured.title}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : null}
            </div>

            <div className="flex flex-col justify-center p-6 sm:p-8">
              <span className={`text-xs font-bold uppercase tracking-wider ${
                isOrion
                  ? 'text-cyan-400 font-mono'
                  : isHoaLong
                  ? 'text-amber-400 font-serif'
                  : isLucDiaDamMe
                  ? 'text-[#9d7d47] font-serif'
                  : 'text-[#118a94]'
              }`}>
                {formatCategoryLabel(featured.category)}
              </span>

              <h2 className={`mt-3 text-2xl sm:text-3xl font-black leading-snug transition-colors ${
                isOrion
                  ? 'text-white group-hover:text-cyan-300'
                  : isHoaLong
                  ? 'text-white group-hover:text-amber-300 font-serif'
                  : isLucDiaDamMe
                  ? 'text-[#152238] group-hover:text-[#9d7d47] font-serif'
                  : 'text-slate-900 group-hover:text-[#118a94]'
              }`}>
                {featured.title}
              </h2>

              <p className={`mt-4 text-sm leading-relaxed ${
                isOrion
                  ? 'text-slate-300'
                  : isHoaLong
                  ? 'text-[#baa98a]'
                  : isLucDiaDamMe
                  ? 'text-[#63758a] font-serif'
                  : 'text-slate-600'
              }`}>
                {featured.excerpt}
              </p>

              <div className={`mt-6 flex flex-wrap items-center gap-4 text-xs ${
                isOrion
                  ? 'text-slate-400 font-mono'
                  : isHoaLong
                  ? 'text-[#8a7a63]'
                  : 'text-slate-500'
              }`}>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" /> {formatDate(featured.publishedAt)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="size-3.5" /> {readTime(featured.excerpt)} phút đọc
                </span>
              </div>

              <span className={`mt-6 inline-flex items-center gap-2 text-xs font-bold transition-transform duration-200 group-hover:translate-x-1 ${
                isOrion
                  ? 'text-cyan-400 font-mono'
                  : isHoaLong
                  ? 'text-amber-400 font-serif'
                  : isLucDiaDamMe
                  ? 'text-[#9d7d47] font-serif'
                  : 'text-[#118a94]'
              }`}>
                <span>Đọc bài viết</span>
                <ArrowRight className="size-4" />
              </span>
            </div>
          </Link>

          {/* 4. Articles Grid (Remaining) */}
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((article) => (
              <Link
                key={article.slug}
                href={gameUrl(game.subdomain, `/tin-tuc/${article.slug}`)}
                className={`group overflow-hidden rounded-2xl border transition-all hover:-translate-y-1 flex flex-col justify-between ${
                  isOrion
                    ? 'border-slate-800 bg-slate-900/80 hover:border-cyan-500/50 hover:bg-slate-900 shadow-md hover:shadow-cyan-950/40'
                    : isHoaLong
                    ? 'border-[#251b14] bg-[#121110] hover:border-amber-500/40 shadow-sm'
                    : isLucDiaDamMe
                    ? 'border-black/5 bg-white hover:border-[#c8c7be] shadow-xs hover:shadow-md'
                    : 'border-slate-200 bg-white hover:border-[#118a94]/40 shadow-xs hover:shadow-md'
                }`}
              >
                <div>
                  <div className="aspect-[16/9] overflow-hidden bg-slate-950 relative">
                    {article.coverImageUrl ? (
                      <img
                        src={article.coverImageUrl}
                        alt={article.title}
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : null}
                  </div>

                  <div className="p-5 sm:p-6">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      isOrion
                        ? 'text-cyan-400 font-mono'
                        : isHoaLong
                        ? 'text-amber-400 font-serif'
                        : isLucDiaDamMe
                        ? 'text-[#9d7d47] font-serif'
                        : 'text-[#118a94]'
                    }`}>
                      {formatCategoryLabel(article.category)}
                    </span>

                    <h2 className={`mt-2 text-base sm:text-lg font-bold line-clamp-2 transition-colors ${
                      isOrion
                        ? 'text-white group-hover:text-cyan-300'
                        : isHoaLong
                        ? 'text-[#ead8b5] group-hover:text-amber-300 font-serif'
                        : isLucDiaDamMe
                        ? 'text-[#152238] group-hover:text-[#9d7d47] font-serif'
                        : 'text-slate-900 group-hover:text-[#118a94]'
                    }`}>
                      {article.title}
                    </h2>

                    <p className={`mt-2 line-clamp-2 text-xs sm:text-sm leading-relaxed ${
                      isOrion
                        ? 'text-slate-400'
                        : isHoaLong
                        ? 'text-[#baa98a]'
                        : isLucDiaDamMe
                        ? 'text-[#63758a] font-serif'
                        : 'text-slate-600'
                    }`}>
                      {article.excerpt}
                    </p>
                  </div>
                </div>

                <div className={`px-5 sm:px-6 pb-5 pt-3 border-t flex items-center justify-between text-xs ${
                  isOrion
                    ? 'border-slate-800/80 text-slate-400 font-mono'
                    : isHoaLong
                    ? 'border-[#251b14] text-[#8a7a63]'
                    : isLucDiaDamMe
                    ? 'border-black/5 text-[#9d7d47] font-serif'
                    : 'border-slate-100 text-slate-500'
                }`}>
                  <span>{formatDate(article.publishedAt)}</span>
                  <ArrowRight className={`size-4 transition-transform group-hover:translate-x-1 ${
                    isOrion
                      ? 'text-cyan-400'
                      : isHoaLong
                      ? 'text-amber-400'
                      : isLucDiaDamMe
                      ? 'text-[#9d7d47]'
                      : 'text-[#118a94]'
                  }`} />
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className={`mt-10 rounded-2xl border border-dashed p-10 text-center ${
          isOrion
            ? 'border-slate-800 text-slate-400 font-mono'
            : isHoaLong
            ? 'border-[#251b14] text-[#8a7a63]'
            : 'border-slate-200 text-slate-500'
        }`}>
          Chưa có bài viết nào trong danh mục này.
        </div>
      )}
    </div>
  );
}

function formatDate(value?: string | null | Date) {
  if (!value) return 'Chưa cập nhật';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function readTime(value: string) {
  return Math.max(1, Math.ceil(value.trim().split(/\s+/).filter(Boolean).length / 35));
}
