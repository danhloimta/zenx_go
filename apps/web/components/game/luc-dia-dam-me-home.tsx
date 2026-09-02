'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  User,
  X,
} from 'lucide-react';
import { portalUrl, gameUrl } from '@/lib/domain';
import { useGame } from '@/components/game/game-context';

// Gold Diamond Divider
function DiamondDivider({ className = 'my-4' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 text-[#c69a58] ${className}`}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c69a58]/40 to-transparent" />
      <span className="text-[9px]">✦</span>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c69a58]/40 to-transparent" />
    </div>
  );
}

export function LucDiaDamMeHome() {
  const game = useGame();
  const [lightboxImage, setLightboxImage] = useState<{ src: string; title: string } | null>(null);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf8] text-[#12243d] font-sans selection:bg-[#9d7d47]/20 selection:text-[#12243d]">
      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-5xl overflow-hidden rounded-3xl bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/90"
              aria-label="Đóng"
            >
              <X className="size-5" />
            </button>
            <img
              src={lightboxImage.src}
              alt={lightboxImage.title}
              className="max-h-[80vh] w-auto object-contain"
            />
            <div className="p-4 text-center text-sm font-semibold text-white/90 bg-slate-950">
              {lightboxImage.title}
            </div>
          </div>
        </div>
      )}

      {/* 1. HERO SECTION */}
      <section className="relative isolate overflow-hidden min-h-[580px] sm:min-h-[640px] lg:h-[calc(100vh-104px)] lg:min-h-[600px] lg:max-h-[780px] flex items-center">
        {/* Full Bleed Background Art */}
        <div className="absolute inset-0 -z-20 overflow-hidden">
          <img
            src="/images/games/luc-dia-dam-me/hero.webp"
            alt="Lục Địa Đam Mê - Kỵ sĩ thiên thần"
            className="size-full object-cover object-[78%_center] sm:object-[70%_center] lg:object-[68%_32%]"
            fetchPriority="high"
          />
        </div>

        {/* Hero Content */}
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-14">
          <div className="max-w-xl lg:max-w-2xl">
            {/* Tagline */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f0efe9]/90 border border-[#c69a58]/40 mb-2 sm:mb-3 shadow-2xs backdrop-blur-xs">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#9d7d47]">
                MMORPG • SEASON 6
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-[64px] font-normal tracking-tight text-[#152238] font-serif leading-[1.08] drop-shadow-sm">
              LỤC ĐỊA<br />ĐAM MÊ
            </h1>

            {/* Subtitle */}
            <p className="mt-2.5 sm:mt-3 text-xs sm:text-base text-[#1c2e44] font-medium leading-relaxed max-w-md font-serif drop-shadow-xs">
              Lục địa huyền thoại đã trở lại.
            </p>

            {/* Divider */}
            <div className="w-36 sm:w-48 my-2 sm:my-3">
              <DiamondDivider className="my-1" />
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2 text-xs font-bold text-[#1e523b]">
              <span>Đang hoạt động</span>
              <span className="text-emerald-600 text-[10px]">◆</span>
            </div>

            {/* CTA Buttons */}
            <div className="mt-4 sm:mt-6 flex flex-row flex-wrap items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => scrollToSection('gioi-thieu')}
                className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-lg sm:rounded-xl bg-[#4b5638] hover:bg-[#3d472d] px-3.5 sm:px-5 text-xs font-medium text-white shadow-xs transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>Khám phá thế giới</span>
                <ArrowRight className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('roadmap')}
                className="inline-flex h-9 sm:h-10 items-center justify-center rounded-lg sm:rounded-xl border border-[#c8c7be] bg-white/90 hover:bg-white px-3.5 sm:px-5 text-xs font-medium text-[#152238] shadow-xs backdrop-blur-xs transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>Xem roadmap</span>
              </button>
            </div>

            {/* Platforms Note */}
            <p className="mt-3 sm:mt-5 text-[10px] sm:text-xs text-[#2b3e54] font-medium drop-shadow-2xs">
              Định hướng đa nền tảng: PC · Mobile · Web
            </p>
          </div>
        </div>
      </section>

      {/* 2. SECTION: "Hoài niệm cũ. Hành trình mới." */}
      <section id="gioi-thieu" className="relative isolate overflow-hidden bg-[#f0efe9] py-14 sm:py-20 lg:py-24 border-t border-black/5">
        {/* Full Bleed Right Artwork - Perfectly Framed Character on Desktop */}
        <div className="absolute inset-y-0 right-0 -z-20 hidden lg:block lg:w-[56%] xl:w-[54%] overflow-hidden pointer-events-none">
          <img
            src="/images/games/luc-dia-dam-me/assets/sec2-art.webp"
            alt="Kỵ sĩ Lục Địa Đam Mê trên ban công thành phố mây"
            className="size-full object-cover object-right"
            loading="lazy"
          />
        </div>

        {/* Soft Left Side Background & Seamless Blend */}
        <div className="absolute inset-y-0 left-0 -z-10 hidden lg:block lg:w-[56%] xl:w-[54%] bg-gradient-to-r from-[#f0efe9] via-[#f0efe9] to-transparent pointer-events-none" />

        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-12">
            {/* Left Content */}
            <div className="lg:col-span-6 max-w-xl">
              <h2 className="text-3xl sm:text-5xl lg:text-[52px] font-normal tracking-tight text-[#152238] font-serif leading-[1.12]">
                Hoài niệm cũ.<br />Hành trình mới.
              </h2>

              <div className="w-36 sm:w-48 my-3 sm:my-4">
                <DiamondDivider className="my-1.5 sm:my-2" />
              </div>

              <p className="text-xs sm:text-base text-[#3d4e63] font-normal leading-relaxed font-serif">
                Lục Địa Đam Mê tái hiện tinh thần MU cổ điển,<br className="hidden sm:inline" />
                ưu tiên khám phá, cộng đồng và trải nghiệm bền vững.
              </p>

              {/* 3 Features with Genuine Asset Icons & Dividers */}
              <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
                {/* Feature 1 */}
                <div className="flex items-center gap-3.5 sm:gap-4 py-1.5 sm:py-2">
                  <div className="size-11 sm:size-14 shrink-0 overflow-hidden flex items-center justify-center">
                    <img
                      src="/images/games/luc-dia-dam-me/assets/icon-season6.webp"
                      alt="Tinh thần Season 6"
                      className="size-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-lg font-medium text-[#152238] font-serif">Tinh thần Season 6</h3>
                    <p className="mt-0.5 text-[11px] sm:text-sm text-[#63758a] leading-relaxed">
                      Giữ trọn cảm xúc nguyên bản, nâng tầm trải nghiệm.
                    </p>
                  </div>
                </div>

                <div className="w-full">
                  <DiamondDivider className="my-0.5 sm:my-1 opacity-70" />
                </div>

                {/* Feature 2 */}
                <div className="flex items-center gap-3.5 sm:gap-4 py-1.5 sm:py-2">
                  <div className="size-11 sm:size-14 shrink-0 overflow-hidden flex items-center justify-center">
                    <img
                      src="/images/games/luc-dia-dam-me/assets/icon-nhip-rieng.webp"
                      alt="Khám phá theo nhịp riêng"
                      className="size-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-lg font-medium text-[#152238] font-serif">Khám phá theo nhịp riêng</h3>
                    <p className="mt-0.5 text-[11px] sm:text-sm text-[#63758a] leading-relaxed">
                      Tự do khám phá, cảm nhận thế giới theo cách của bạn.
                    </p>
                  </div>
                </div>

                <div className="w-full">
                  <DiamondDivider className="my-0.5 sm:my-1 opacity-70" />
                </div>

                {/* Feature 3 */}
                <div className="flex items-center gap-3.5 sm:gap-4 py-1.5 sm:py-2">
                  <div className="size-11 sm:size-14 shrink-0 overflow-hidden flex items-center justify-center">
                    <img
                      src="/images/games/luc-dia-dam-me/assets/icon-cong-dong.webp"
                      alt="Gắn kết cộng đồng"
                      className="size-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-lg font-medium text-[#152238] font-serif">Gắn kết cộng đồng</h3>
                    <p className="mt-0.5 text-[11px] sm:text-sm text-[#63758a] leading-relaxed">
                      Cộng đồng là trung tâm của mọi hành trình.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile / Tablet Image fallback */}
            <div className="lg:hidden relative flex flex-col items-center mt-2">
              <div
                className="relative w-full overflow-hidden rounded-2xl border border-black/5 shadow-sm cursor-pointer"
                onClick={() =>
                  setLightboxImage({
                    src: '/images/games/luc-dia-dam-me/bg2.webp',
                    title: 'Lục Địa Đam Mê - Kỵ sĩ trên ban công mây',
                  })
                }
              >
                <img
                  src="/images/games/luc-dia-dam-me/bg2.webp"
                  alt="Kỵ sĩ Lục Địa Đam Mê trên ban công thành phố mây"
                  className="w-full object-cover aspect-[16/10] sm:aspect-[4/3]"
                  loading="lazy"
                />
              </div>
              <p className="mt-2.5 text-center text-[11px] text-[#9d7d47] font-medium tracking-wide">
                ✦ Thư viện hình ảnh thế giới ✦
              </p>
            </div>
          </div>
        </div>

        {/* Caption on Desktop */}
        <div className="hidden lg:block absolute bottom-4 right-12 z-10">
          <p className="text-xs text-[#9d7d47] font-medium tracking-wide drop-shadow-xs">
            ✦ Thư viện hình ảnh thế giới ✦
          </p>
        </div>
      </section>

      {/* 3. SECTION: "Bước vào một lục địa được tái hiện" (Panorama Banner) */}
      <section id="the-gioi" className="relative isolate overflow-hidden min-h-[300px] sm:min-h-[400px] lg:min-h-[440px] flex items-center">
        {/* Full Bleed Panorama Art */}
        <div className="absolute inset-0 -z-20 overflow-hidden">
          <img
            src="/images/games/luc-dia-dam-me/bg.webp"
            alt="Lục địa trên mây"
            className="size-full object-cover object-[60%_center]"
            loading="lazy"
          />
        </div>

        {/* Soft Left Sky Gradient for text legibility */}
        <div className="absolute inset-0 sm:inset-y-0 sm:left-0 sm:w-[50%] -z-10 bg-gradient-to-r from-[#fafaf8]/90 via-[#fafaf8]/60 to-transparent pointer-events-none" />

        {/* Left Content */}
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="max-w-md lg:max-w-lg">
            <h2 className="text-2xl sm:text-4xl lg:text-[42px] font-normal tracking-tight text-[#15243b] font-serif leading-[1.2]">
              Bước vào một lục địa<br />được tái hiện
            </h2>

            <div className="mt-4 sm:mt-5">
              <button
                type="button"
                onClick={() =>
                  setLightboxImage({
                    src: '/images/games/luc-dia-dam-me/bg.webp',
                    title: 'Lục Địa Đam Mê - Toàn cảnh thành phố trên mây',
                  })
                }
                className="group inline-flex items-center gap-1.5 pb-0.5 border-b border-[#15243b]/60 text-xs sm:text-sm font-normal text-[#15243b] font-serif transition-colors hover:text-[#9d7d47] hover:border-[#9d7d47] cursor-pointer"
              >
                <span>Khám phá thế giới</span>
                <span className="text-base leading-none transition-transform group-hover:translate-x-0.5">→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION: "Một hành trình, nhiều cách trải nghiệm" (Platforms) */}
      <section className="py-14 sm:py-24 bg-[#fafaf8]">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-normal tracking-tight text-[#15243b] font-serif">
            Một hành trình, nhiều cách trải nghiệm
          </h2>

          {/* 3 Platforms */}
          <div className="mt-10 sm:mt-12 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 items-center justify-center">
            {/* PC */}
            <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/70 border border-black/5 md:bg-transparent md:border-0 md:p-0">
              <svg className="size-10 sm:size-12 text-[#15243b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                <rect x="2.5" y="3.5" width="19" height="13" rx="2" stroke="currentColor" />
                <path d="M8 20.5h8M12 16.5v4" stroke="currentColor" strokeLinecap="round" />
              </svg>
              <span className="mt-3 font-medium text-base sm:text-lg text-[#15243b] font-serif">PC</span>
              <span className="mt-1 text-xs font-medium text-[#2e624a] flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-600 inline-block" /> Đang hoạt động
              </span>
            </div>

            {/* Mobile */}
            <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/70 border border-black/5 md:bg-transparent md:border-x md:border-y-0 md:border-[#d9d5c7] md:rounded-none md:p-0">
              <svg className="size-10 sm:size-12 text-[#15243b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                <rect x="5.5" y="2.5" width="13" height="19" rx="2.5" stroke="currentColor" />
                <path d="M10 5.5h4" stroke="currentColor" strokeLinecap="round" />
              </svg>
              <span className="mt-3 font-medium text-base sm:text-lg text-[#15243b] font-serif">Mobile</span>
              <span className="mt-1 text-xs font-medium text-[#2e624a] flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-600 inline-block" /> Đang hoạt động
              </span>
            </div>

            {/* Web */}
            <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/70 border border-black/5 md:bg-transparent md:border-0 md:p-0">
              <svg className="size-10 sm:size-12 text-[#15243b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                <rect x="2.5" y="3.5" width="19" height="17" rx="2" stroke="currentColor" />
                <path d="M2.5 8.5h19" stroke="currentColor" strokeLinecap="round" />
              </svg>
              <span className="mt-3 font-medium text-base sm:text-lg text-[#15243b] font-serif">Web</span>
              <span className="mt-1 text-xs font-medium text-[#2e624a] flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-600 inline-block" /> Đang hoạt động
              </span>
            </div>
          </div>

          <p className="mt-8 sm:mt-10 text-xs text-[#63758a]">
            Khả năng hỗ trợ và lịch mở thử nghiệm sẽ được công bố sau.
          </p>
        </div>
      </section>

      {/* 5. SECTION: "Lộ trình phát triển" (Timeline) */}
      <section id="roadmap" className="py-14 sm:py-20 bg-[#f0efe9] border-y border-black/5">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-normal tracking-tight text-[#152238] font-serif">
            Lộ trình phát triển
          </h2>

          {/* 4 Steps Roadmap */}
          <div className="mt-10 sm:mt-14 max-w-4xl mx-auto relative">
            <div className="hidden md:block absolute top-6 left-12 right-12 h-0.5 bg-[#c8cfbe] -z-0" />
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4 md:gap-4 relative z-10">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/70 border border-black/5 md:bg-transparent md:border-0 md:p-0">
                <div className="flex size-11 sm:size-12 items-center justify-center rounded-full bg-[#4b5638] text-white font-bold text-sm sm:text-base shadow-sm ring-4 sm:ring-6 ring-[#f0efe9]">
                  1
                </div>
                <h3 className="mt-3.5 text-xs sm:text-sm font-medium text-[#152238] font-serif">Thế giới đã mở cửa</h3>
                <p className="mt-1 text-[11px] sm:text-xs text-[#2e624a] font-medium">Đã hoàn tất</p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/70 border border-black/5 md:bg-transparent md:border-0 md:p-0">
                <div className="flex size-11 sm:size-12 items-center justify-center rounded-full bg-[#4b5638] text-white font-bold text-sm sm:text-base shadow-sm ring-4 sm:ring-6 ring-[#f0efe9]">
                  2
                </div>
                <h3 className="mt-3.5 text-xs sm:text-sm font-medium text-[#152238] font-serif">Season 6 vận hành</h3>
                <p className="mt-1 text-[11px] sm:text-xs text-[#2e624a] font-medium">Đang hoạt động</p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/70 border border-black/5 md:bg-transparent md:border-0 md:p-0">
                <div className="flex size-11 sm:size-12 items-center justify-center rounded-full border border-[#b8c2ad] bg-white text-[#152238]/70 font-bold text-sm sm:text-base shadow-xs ring-4 sm:ring-6 ring-[#f0efe9]">
                  3
                </div>
                <h3 className="mt-3.5 text-xs sm:text-sm font-medium text-[#152238] font-serif">Công thành chiến</h3>
                <p className="mt-1 text-[11px] sm:text-xs text-[#2e624a]">Đang hoạt động</p>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/70 border border-black/5 md:bg-transparent md:border-0 md:p-0">
                <div className="flex size-11 sm:size-12 items-center justify-center rounded-full border border-[#b8c2ad] bg-white text-[#152238]/70 font-bold text-sm sm:text-base shadow-xs ring-4 sm:ring-6 ring-[#f0efe9]">
                  4
                </div>
                <h3 className="mt-3.5 text-xs sm:text-sm font-medium text-[#152238] font-serif">Vùng trời mới</h3>
                <p className="mt-1 text-[11px] sm:text-xs text-[#718294]">Cập nhật tiếp theo</p>
              </div>
            </div>

            <p className="mt-8 sm:mt-10 text-center text-xs text-[#718294]">
              Lịch vận hành được cập nhật theo từng mùa.
            </p>
          </div>
        </div>
      </section>

      {/* 6. SECTION: "Nhật ký phát triển" (Articles) */}
      <section id="nhat-ky" className="py-14 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-normal tracking-tight text-[#152238] font-serif">
            Tin tức mới nhất
          </h2>

          {/* 3 Articles Grid */}
          <div className="mt-10 sm:mt-12 grid gap-6 sm:grid-cols-3 text-left">
            {game.articles.slice(0, 3).map((article) => (
              <Link
                key={article.slug}
                href={gameUrl(game.subdomain, `/tin-tuc/${article.slug}`)}
                className="group rounded-2xl bg-white border border-[#e5e4de] overflow-hidden shadow-xs transition-all hover:shadow-md hover:-translate-y-1"
              >
                <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                  {article.coverImageUrl ? <img src={article.coverImageUrl} alt={article.title} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" /> : null}
                </div>
                <div className="p-4 sm:p-5">
                  <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#9d7d47]">
                    {article.category.replaceAll('_', ' ')}
                  </p>
                  <h3 className="mt-1.5 sm:mt-2 text-sm sm:text-base font-medium text-[#152238] font-serif line-clamp-2">
                    {article.title}
                  </h3>
                  <div className="mt-3 sm:mt-4 flex items-center text-[#9d7d47] text-xs sm:text-sm font-bold gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Đọc thêm</span>
                    <span>→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 sm:mt-10">
            <Link
              href={gameUrl(game.subdomain, '/tin-tuc')}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#9d7d47] hover:underline font-serif"
            >
              Xem tất cả bài viết <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. SECTION: Bottom CTA Banner */}
      <section className="relative isolate overflow-hidden w-full border-t border-black/5 py-16 sm:py-28 lg:py-32 flex items-center justify-center">
        {/* Full-Width Panoramic Background Art */}
        <div className="absolute inset-0 -z-20 overflow-hidden">
          <img
            src="/images/games/luc-dia-dam-me/bg2.webp"
            alt="Lục Địa Đam Mê toàn cảnh"
            className="size-full object-cover object-[50%_40%]"
            loading="lazy"
          />
        </div>

        {/* Subtle Light Overlay to keep background image clear & readable on mobile */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#eaf2f8]/75 via-[#eaf2f8]/50 to-[#eaf2f8]/80 sm:from-[#eaf2f8]/30 sm:via-[#eaf2f8]/15 sm:to-[#eaf2f8]/35 pointer-events-none" />

        {/* Centered Content Container */}
        <div className="mx-auto max-w-4xl px-5 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-2xl sm:text-4xl lg:text-[50px] font-normal tracking-tight text-[#15243b] font-serif leading-[1.15] drop-shadow-xs">
            Cùng viết tiếp hành trình đam mê.
          </h2>
          <p className="mt-3 sm:mt-4 text-xs sm:text-base lg:text-lg text-[#253952] font-serif leading-relaxed max-w-xl mx-auto font-medium">
            Theo dõi những cập nhật mới nhất và đồng hành cùng cộng đồng trong từng mùa vận hành.
          </p>

          {/* Centered Action Buttons */}
          <div className="mt-7 sm:mt-9 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
            <Link
              href={gameUrl(game.subdomain, '/tin-tuc')}
              className="inline-flex min-h-11 sm:min-h-12 items-center justify-center gap-2 rounded-xl border border-[#cbb37e] bg-[#50603c] px-8 text-xs sm:text-sm font-medium text-white shadow-md transition-all hover:bg-[#435231] active:scale-[0.98] cursor-pointer"
            >
              <span>Xem tin tức</span>
              <span className="text-sm">🪶</span>
            </Link>
            <Link
              href={portalUrl('/auth/register')}
              className="inline-flex min-h-11 sm:min-h-12 items-center justify-center gap-2 rounded-xl border border-[#c4ced7] bg-white/95 px-8 text-xs sm:text-sm font-medium text-[#15243b] shadow-md transition-all hover:bg-white active:scale-[0.98] font-serif backdrop-blur-sm"
            >
              <User className="size-4 text-[#15243b]" />
              <span>Tạo tài khoản ZENX GO</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
