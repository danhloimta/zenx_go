'use client';

import Link from 'next/link';
import { ArrowRight, ChevronRight, Gamepad2, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccount } from '@/hooks/use-account';

export function CtaBannerSection() {
  const account = useAccount();
  const user = account.data;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#081827] via-[#040f1a] to-[#02070e] border border-[#172d47] shadow-2xl p-8 sm:p-14 text-center">
        {/* Left Side Character Artwork - Ultra Sharp & Clear */}
        <div className="absolute -left-6 sm:left-0 bottom-0 top-0 w-72 sm:w-[400px] lg:w-[440px] pointer-events-none overflow-hidden opacity-90 sm:opacity-100">
          <img
            src="/images/games/luc-dia-dam-me/hero-desktop.webp"
            alt="Lục Địa Đam Mê Knight"
            className="size-full object-cover object-left-center scale-100 contrast-105 brightness-105"
          />
          {/* Subtle gradient blend on inner edge only */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent via-55% to-[#040f1a]" />
        </div>

        {/* Right Side Character Artwork - Ultra Sharp & Clear */}
        <div className="absolute -right-6 sm:right-0 bottom-0 top-0 w-72 sm:w-[400px] lg:w-[440px] pointer-events-none overflow-hidden opacity-90 sm:opacity-100">
          <img
            src="/images/games/vuong-trieu-hoa-long/hero-desktop.webp"
            alt="Vương Triều Hỏa Long"
            className="size-full object-cover object-right-center scale-100 contrast-105 brightness-105"
          />
          {/* Subtle gradient blend on inner edge only */}
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent via-55% to-[#040f1a]" />
        </div>

        {/* Ambient Center Lighting Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 size-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Center Content */}
        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
          {/* Top Badge */}
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-950/90 border border-emerald-500/50 text-emerald-400 backdrop-blur-md shadow-lg mb-4">
            <Sparkles className="size-3.5" />
            BẮT ĐẦU HÀNH TRÌNH NGAY HÔM NAY
          </span>

          {/* Heading */}
          <h2 className="font-game-title text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-wide leading-[1.15] drop-shadow-lg">
            Sẵn sàng bước vào <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200">
              thế giới của bạn?
            </span>
          </h2>

          {/* Subtitle */}
          <p className="mt-3.5 text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl drop-shadow">
            Tạo tài khoản ZENX GO để theo dõi dự án, nhận quà tặng tân thủ và sẵn sàng khi game chính thức mở cửa.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-3.5">
            {user ? (
              <Button
                asChild
                size="lg"
                className="h-12 px-7 rounded-2xl bg-[#00873E] hover:bg-[#007033] text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-950/60 active:scale-98 transition-all"
              >
                <Link href="/account" className="flex items-center gap-2">
                  <span>Trang quản lý tài khoản</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                className="h-12 px-7 rounded-2xl bg-[#00873E] hover:bg-[#007033] text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-950/60 active:scale-98 transition-all"
              >
                <Link href="/auth/register" className="flex items-center gap-2">
                  <span>Tạo tài khoản miễn phí</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            )}

            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 px-6 rounded-2xl bg-white/95 hover:bg-white text-slate-900 font-bold text-xs sm:text-sm shadow-md transition-all"
            >
              <Link href="/games" className="flex items-center gap-2">
                <Gamepad2 className="size-4 text-[#00873E]" />
                <span>Khám phá trò chơi</span>
              </Link>
            </Button>

            <Link
              href="/support"
              className="inline-flex items-center gap-2 h-12 px-5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/90 text-slate-200 hover:text-white text-xs sm:text-sm font-bold backdrop-blur-md transition-all shadow-md"
            >
              <Users className="size-4 text-slate-400" />
              <span>Tham gia cộng đồng</span>
              <ChevronRight className="size-3.5 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
