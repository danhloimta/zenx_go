'use client';

import Link from 'next/link';
import { ArrowRight, ChevronRight, Gamepad2, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccount } from '@/hooks/use-account';

export function CtaBannerSection() {
  const account = useAccount();
  const user = account.data;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#081524] via-[#040c17] to-[#02060c] border border-slate-800/80 shadow-2xl p-6 sm:p-12 lg:p-16 text-center">
        {/* Desktop Side Character Artworks (Hidden on Mobile to prevent overlapping seams) */}
        <div className="hidden md:block absolute left-0 bottom-0 top-0 w-80 lg:w-[420px] pointer-events-none overflow-hidden">
          <img
            src="/images/games/luc-dia-dam-me/nhan_vat3.png"
            alt="Lục Địa Đam Mê Knight"
            className="size-full object-cover object-[75%_25%] contrast-105 brightness-105"
          />
          {/* Smooth blend to center */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#040c17]/60 via-60% to-[#040c17]" />
        </div>

        <div className="hidden md:block absolute right-0 bottom-0 top-0 w-80 lg:w-[420px] pointer-events-none overflow-hidden">
          <img
            src="/images/games/vuong-trieu-hoa-long/hero-desktop.webp"
            alt="Vương Triều Hỏa Long"
            className="size-full object-cover object-right-center contrast-105 brightness-105"
          />
          {/* Smooth blend to center */}
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#040c17]/60 via-60% to-[#040c17]" />
        </div>

        {/* Mobile Background Atmosphere (Unified & Seamless) */}
        <div className="block md:hidden absolute inset-0 opacity-20 pointer-events-none">
          <img
            src="/images/games/luc-dia-dam-me/bg.png"
            alt="Gaming Background"
            className="size-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#081524]/90 via-[#040c17] to-[#02060c]" />
        </div>

        {/* Ambient Center Lighting Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-72 sm:size-[480px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 size-48 sm:size-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Center Content */}
        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
          {/* Top Badge */}
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 backdrop-blur-md shadow-lg mb-3 sm:mb-4">
            <Sparkles className="size-3.5" />
            BẮT ĐẦU HÀNH TRÌNH NGAY HÔM NAY
          </span>

          {/* Heading */}
          <h2 className="font-game-title text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-wide leading-[1.15] drop-shadow-md">
            Sẵn sàng bước vào <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-emerald-400 to-teal-200">
              thế giới của bạn?
            </span>
          </h2>

          {/* Subtitle */}
          <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg drop-shadow-sm">
            Tạo tài khoản ZENX GO để theo dõi dự án, nhận quà tặng tân thủ và sẵn sàng khi game chính thức mở cửa.
          </p>

          {/* Action CTAs */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
            {user ? (
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto h-11 sm:h-12 px-7 rounded-xl bg-[#00873E] hover:bg-[#007033] text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-950/50 active:scale-98 transition-all"
              >
                <Link href="/account" className="flex items-center justify-center gap-2">
                  <span>Trang quản lý tài khoản</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto h-11 sm:h-12 px-7 rounded-xl bg-[#00873E] hover:bg-[#007033] text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-950/50 active:scale-98 transition-all"
              >
                <Link href="/auth/register" className="flex items-center justify-center gap-2">
                  <span>Tạo tài khoản miễn phí</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            )}

            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-11 sm:h-12 px-6 rounded-xl bg-white/95 hover:bg-white text-slate-900 font-bold text-xs sm:text-sm shadow-md transition-all border-0"
            >
              <Link href="/games" className="flex items-center justify-center gap-2">
                <Gamepad2 className="size-4 text-[#00873E]" />
                <span>Khám phá trò chơi</span>
              </Link>
            </Button>
          </div>

          {/* Community Secondary Link */}
          <Link
            href="/community"
            className="mt-4 sm:mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <Users className="size-3.5" />
            <span>Tham gia cộng đồng ZENX GO</span>
            <ChevronRight className="size-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}
