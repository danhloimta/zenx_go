'use client';

import Link from 'next/link';
import { ArrowRight, Globe2, Sparkles, Radio, Flame } from 'lucide-react';
import { useGame } from '@/components/game/game-context';
import { gameUrl } from '@/lib/domain';

export default function AboutGamePage() {
  const game = useGame();
  const isOrion = game.slug === 'chien-tuyen-orion' || game.subdomain === 'orion';
  const isHoaLong = game.slug === 'vuong-trieu-hoa-long' || game.subdomain === 'hoalong';
  const isLucDiaDamMe = game.slug === 'luc-dia-dam-me' || game.subdomain === 'lucdia';

  return (
    <article className="mx-auto max-w-5xl px-4 py-12 sm:py-16 sm:px-6">
      {/* Badge */}
      <div>
        {isOrion ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
            <Radio className="size-3.5 animate-pulse text-cyan-400" />
            SYS.DOSSIER // TỔNG QUAN DỰ ÁN
          </span>
        ) : isHoaLong ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-serif font-bold uppercase tracking-wider bg-amber-950/80 border border-amber-500/40 text-amber-300">
            <Flame className="size-3.5 text-amber-400" />
            SỬ THI // KHỞI NGUYÊN VƯƠNG TRIỀU
          </span>
        ) : isLucDiaDamMe ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-serif font-bold uppercase tracking-wider bg-[#f0efe9] border border-[#c69a58]/40 text-[#9d7d47]">
            <Sparkles className="size-3.5 text-[#9d7d47]" />
            KHỞI ĐẦU MỚI // SEASON 6
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-50 border border-sky-200 text-[#118a94]">
            <Sparkles className="size-3.5 text-[#118a94]" />
            GIỚI THIỆU THỊ TRẤN
          </span>
        )}
      </div>

      {/* Title */}
      <h1 className={`mt-4 text-3xl sm:text-6xl font-black tracking-tight ${
        isOrion
          ? 'text-white font-mono uppercase'
          : isHoaLong
          ? 'text-white font-serif'
          : isLucDiaDamMe
          ? 'text-[#152238] font-serif'
          : 'text-[#123b63] font-serif'
      }`}>
        {game.name}
      </h1>

      {/* Tagline */}
      <p className={`mt-4 max-w-3xl text-lg sm:text-xl leading-relaxed ${
        isOrion
          ? 'text-cyan-200 font-mono'
          : isHoaLong
          ? 'text-[#ead8b5] font-serif'
          : isLucDiaDamMe
          ? 'text-[#3d4e63] font-serif'
          : 'text-slate-600'
      }`}>
        {game.tagline}
      </p>

      {/* Content Grid */}
      <div className="mt-12 grid gap-10 md:grid-cols-[1.15fr_0.85fr] md:items-start">
        <div className={`space-y-6 text-base leading-8 ${
          isOrion
            ? 'text-slate-300'
            : isHoaLong
            ? 'text-[#baa98a]'
            : isLucDiaDamMe
            ? 'text-[#2b3d56] font-serif'
            : 'text-slate-700'
        }`}>
          <p>{game.longDescription ?? game.shortDescription}</p>
          <p>Đây là không gian chính thức để theo dõi thế giới, hoạt động theo mùa và các cập nhật mới nhất của {game.name}.</p>
          <h2 className={`pt-4 text-2xl font-black ${
            isOrion
              ? 'text-white font-mono'
              : isHoaLong
              ? 'text-white font-serif'
              : isLucDiaDamMe
              ? 'text-[#152238] font-serif'
              : 'text-slate-900 font-serif'
          }`}>
            Tinh thần trải nghiệm
          </h2>
          <p>Mỗi quyết định thiết kế đều hướng đến một thế giới có cá tính, dễ tiếp cận và đủ chiều sâu để cộng đồng cùng khám phá.</p>
        </div>

        {/* Aside Sidebar */}
        <aside className={`rounded-3xl border p-6 sm:p-7 ${
          isOrion
            ? 'border-cyan-500/30 bg-slate-900 shadow-xl'
            : isHoaLong
            ? 'border-[#251b14] bg-[#121110] shadow-xl'
            : isLucDiaDamMe
            ? 'border-black/5 bg-white shadow-xs'
            : 'border-slate-200 bg-white shadow-xs'
        }`}>
          <div className="flex items-center gap-3">
            <Globe2 className={`size-6 ${
              isOrion ? 'text-cyan-400' : isHoaLong ? 'text-amber-400' : isLucDiaDamMe ? 'text-[#9d7d47]' : 'text-[#118a94]'
            }`} />
            <h2 className={`font-black text-lg ${
              isOrion
                ? 'text-white font-mono'
                : isHoaLong
                ? 'text-white font-serif'
                : isLucDiaDamMe
                ? 'text-[#152238] font-serif'
                : 'text-slate-900'
            }`}>
              Nền tảng hỗ trợ
            </h2>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {game.platforms.map((platform) => (
              <span
                key={platform}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
                  isOrion
                    ? 'border-cyan-500/30 bg-cyan-950/40 text-cyan-300 font-mono'
                    : isHoaLong
                    ? 'border-amber-500/30 bg-amber-950/40 text-amber-200 font-serif'
                    : isLucDiaDamMe
                    ? 'border-[#c8c7be] bg-[#fbf7ee] text-[#2a2115] font-serif'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                {platform}
              </span>
            ))}
          </div>

          <p className={`mt-5 text-sm leading-relaxed ${
            isOrion ? 'text-slate-400' : isHoaLong ? 'text-[#8a7a63]' : 'text-slate-600'
          }`}>
            Theo dõi lịch mùa, sự kiện và các cập nhật mới nhất trên trang Tin tức.
          </p>

          <Link
            href={gameUrl(game.subdomain, '/roadmap')}
            className={`mt-6 inline-flex items-center gap-2 text-sm font-bold transition-colors ${
              isOrion
                ? 'text-cyan-400 hover:text-cyan-300 font-mono'
                : isHoaLong
                ? 'text-amber-400 hover:text-amber-300 font-serif'
                : isLucDiaDamMe
                ? 'text-[#9d7d47] hover:text-[#7d6032] font-serif'
                : 'text-[#118a94] hover:text-[#0d6e76]'
            }`}
          >
            <span>Xem lộ trình</span>
            <ArrowRight className="size-4" />
          </Link>
        </aside>
      </div>
    </article>
  );
}
