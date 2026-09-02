'use client';

import { CheckCircle2, CircleDot, Map, Radio, Flame, Sparkles } from 'lucide-react';
import { useGame } from '@/components/game/game-context';
import { formatMilestoneStatus } from '@/lib/games-data';

export default function RoadmapPage() {
  const game = useGame();
  const completed = game.milestones.filter((milestone) => milestone.status === 'COMPLETED').length;
  const progress = game.milestones.length ? Math.round((completed / game.milestones.length) * 100) : 0;

  const isOrion = game.slug === 'chien-tuyen-orion' || game.subdomain === 'orion';
  const isHoaLong = game.slug === 'vuong-trieu-hoa-long' || game.subdomain === 'hoalong';
  const isLucDiaDamMe = game.slug === 'luc-dia-dam-me' || game.subdomain === 'lucdia';

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16 sm:px-6">
      {/* Badge */}
      <div>
        {isOrion ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
            <Radio className="size-3.5 animate-pulse text-cyan-400" />
            MISSION ROADMAP // TIẾN ĐỘ TÁC CHIẾN
          </span>
        ) : isHoaLong ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-serif font-bold uppercase tracking-wider bg-amber-950/80 border border-amber-500/40 text-amber-300">
            <Flame className="size-3.5 text-amber-400" />
            LỘ TRÌNH VƯƠNG TRIỀU
          </span>
        ) : isLucDiaDamMe ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-serif font-bold uppercase tracking-wider bg-[#f0efe9] border border-[#c69a58]/40 text-[#9d7d47]">
            <Sparkles className="size-3.5 text-[#9d7d47]" />
            LỘ TRÌNH PHÁT TRIỂN
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-50 border border-sky-200 text-[#118a94]">
            <Map className="size-3.5 text-[#118a94]" />
            LỘ TRÌNH VẬN HÀNH
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
        Lộ trình vận hành
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
        Các cột mốc được cập nhật theo lịch mùa và hoạt động thực tế của cộng đồng.
      </p>

      {game.milestones.length ? (
        <>
          {/* Progress Card */}
          <div className={`mt-8 rounded-2xl border p-5 sm:p-6 ${
            isOrion
              ? 'border-cyan-500/30 bg-slate-900 shadow-xl'
              : isHoaLong
              ? 'border-[#251b14] bg-[#121110] shadow-xl'
              : isLucDiaDamMe
              ? 'border-black/5 bg-white shadow-xs'
              : 'border-slate-200 bg-white shadow-xs'
          }`}>
            <div className="flex items-center justify-between text-sm font-bold">
              <span className={isOrion ? 'text-white font-mono' : isHoaLong ? 'text-white font-serif' : 'text-slate-900'}>
                Các mốc đã hoàn tất
              </span>
              <span className={`font-mono ${isOrion ? 'text-cyan-400' : isHoaLong ? 'text-amber-400' : 'text-slate-700'}`}>
                {progress}%
              </span>
            </div>

            <div className={`mt-3 h-2.5 overflow-hidden rounded-full ${
              isOrion ? 'bg-slate-800' : isHoaLong ? 'bg-black' : 'bg-slate-100'
            }`}>
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isOrion
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600'
                    : isHoaLong
                    ? 'bg-gradient-to-r from-[#c85a17] to-[#a53b13]'
                    : 'bg-[var(--game-primary)]'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Milestones List */}
          <div className="mt-8 space-y-4">
            {game.milestones.map((milestone) => {
              const isCompleted = milestone.status === 'COMPLETED';
              return (
                <div
                  key={milestone.title}
                  className={`flex gap-4 rounded-2xl border p-5 sm:p-6 transition-all ${
                    isOrion
                      ? 'border-slate-800 bg-slate-900/80 hover:border-cyan-500/40 text-white'
                      : isHoaLong
                      ? 'border-[#251b14] bg-[#121110] hover:border-amber-500/40 text-[#ead8b5]'
                      : isLucDiaDamMe
                      ? 'border-black/5 bg-white hover:border-[#c8c7be] shadow-xs text-[#152238]'
                      : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs text-slate-900'
                  }`}
                >
                  <div className={`mt-1 shrink-0 ${
                    isCompleted
                      ? isOrion
                        ? 'text-cyan-400'
                        : isHoaLong
                        ? 'text-amber-400'
                        : 'text-emerald-600'
                      : isOrion
                      ? 'text-slate-600'
                      : 'text-slate-400'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="size-5" /> : <CircleDot className="size-5" />}
                  </div>

                  <div className="flex-1">
                    <div className={`flex flex-wrap justify-between gap-2 text-xs font-bold uppercase tracking-wider ${
                      isOrion
                        ? 'text-slate-400 font-mono'
                        : isHoaLong
                        ? 'text-[#8a7a63]'
                        : 'text-slate-400'
                    }`}>
                      <span>{milestone.displayPeriod}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        isCompleted
                          ? isOrion
                            ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/30'
                            : isHoaLong
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isOrion
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {formatMilestoneStatus(milestone.status)}
                      </span>
                    </div>

                    <h2 className={`mt-3 text-lg sm:text-xl font-bold ${
                      isOrion ? 'text-white' : isHoaLong ? 'text-[#ead8b5] font-serif' : isLucDiaDamMe ? 'text-[#152238] font-serif' : 'text-slate-900'
                    }`}>
                      {milestone.title}
                    </h2>

                    <p className={`mt-1.5 text-xs sm:text-sm leading-relaxed ${
                      isOrion ? 'text-slate-300' : isHoaLong ? 'text-[#baa98a]' : 'text-slate-600'
                    }`}>
                      {milestone.description}
                    </p>

                    {milestone.checklist.length ? (
                      <ul className={`mt-4 grid gap-2 text-xs sm:text-sm sm:grid-cols-2 ${
                        isOrion ? 'text-slate-400 font-mono' : isHoaLong ? 'text-[#baa98a]' : 'text-slate-600'
                      }`}>
                        {milestone.checklist.map((item) => (
                          <li key={item} className="flex items-center gap-1.5">
                            <span className={isOrion ? 'text-cyan-400' : isHoaLong ? 'text-amber-400' : 'text-emerald-600'}>✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              );
            })}
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
          Lộ trình đang được cập nhật.
        </div>
      )}
    </div>
  );
}
