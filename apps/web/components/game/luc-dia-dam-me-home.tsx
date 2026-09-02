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

      {/* 1. HERO SECTION - Fits 1 Desktop Viewport Height */}
      <section className="relative isolate overflow-hidden min-h-[560px] sm:min-h-[620px] lg:h-[calc(100vh-104px)] lg:min-h-[600px] lg:max-h-[780px] flex items-center">
        {/* Full Bleed Background Art */}
        <div className="absolute inset-0 -z-20 overflow-hidden">
          <img
            src="/images/games/luc-dia-dam-me/hero.png"
            alt="Lục Địa Đam Mê - Kỵ sĩ thiên thần"
            className="size-full object-cover object-[72%_35%] lg:object-[68%_32%]"
            fetchPriority="high"
          />
        </div>

        {/* Soft Left Side Gradient Overlay */}
        <div className="absolute inset-y-0 left-0 w-full lg:w-[56%] -z-10 bg-gradient-to-r from-[#fafaf8]/95 via-[#fafaf8]/80 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-20 -z-10 bg-gradient-to-t from-[#f0efe9] to-transparent pointer-events-none" />

        {/* Hero Content */}
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
          <div className="max-w-xl lg:max-w-2xl">
            {/* Tagline */}
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-[#9d7d47]">
              MMORPG • SEASON 6
            </p>

            {/* Title */}
            <h1 className="mt-2.5 text-4xl sm:text-5xl lg:text-[64px] font-normal tracking-tight text-[#152238] font-serif leading-[1.05]">
              LỤC ĐỊA<br />ĐAM MÊ
            </h1>

            {/* Subtitle */}
            <p className="mt-3 text-sm sm:text-base text-[#2b3d56] font-normal leading-relaxed max-w-md font-serif">
              Một thế giới đang được xây dựng lại.
            </p>

            {/* Divider */}
            <div className="w-48 my-3">
              <DiamondDivider className="my-1.5" />
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2 text-xs font-medium text-[#2e624a]">
              <span>Đang phát triển</span>
              <span className="text-emerald-600 text-[10px]">◆</span>
            </div>

            {/* CTA Buttons */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => scrollToSection('gioi-thieu')}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#4b5638] px-6 py-2.5 text-xs sm:text-sm font-medium text-white shadow-xs transition-all hover:bg-[#3d472d] active:scale-[0.98]"
              >
                Khám phá dự án <ArrowRight className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('roadmap')}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#c8c7be] bg-white/80 px-6 py-2.5 text-xs sm:text-sm font-medium text-[#152238] shadow-xs backdrop-blur-xs transition-all hover:bg-white active:scale-[0.98]"
              >
                Xem roadmap
              </button>
            </div>

            {/* Platforms Note */}
            <p className="mt-5 text-xs text-[#526478]">
              Định hướng đa nền tảng: PC · Mobile · Web
            </p>
          </div>
        </div>
      </section>

      {/* 2. SECTION: "Hoài niệm cũ. Hành trình mới." - Full Bleed Split Layout */}
      <section id="gioi-thieu" className="relative isolate overflow-hidden bg-[#f0efe9] py-16 sm:py-20 lg:py-24 border-t border-black/5">
        {/* Full Bleed Right Artwork - Perfectly Framed Character */}
        <div className="absolute inset-y-0 right-0 -z-20 hidden lg:block lg:w-[56%] xl:w-[54%] overflow-hidden pointer-events-none">
          <img
            src="/images/games/luc-dia-dam-me/assets/sec2-art.png"
            alt="Kỵ sĩ Lục Địa Đam Mê trên ban công thành phố mây"
            className="size-full object-cover object-right"
            loading="lazy"
          />
        </div>

        {/* Soft Left Side Background & Seamless Blend */}
        <div className="absolute inset-y-0 left-0 -z-10 hidden lg:block lg:w-[56%] xl:w-[54%] bg-gradient-to-r from-[#f0efe9] via-[#f0efe9] to-transparent pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            {/* Left Content */}
            <div className="lg:col-span-6 max-w-xl">
              <h2 className="text-4xl sm:text-5xl lg:text-[52px] font-normal tracking-tight text-[#152238] font-serif leading-[1.1]">
                Hoài niệm cũ.<br />Hành trình mới.
              </h2>

              <div className="w-48 my-4">
                <DiamondDivider className="my-2" />
              </div>

              <p className="text-sm sm:text-base text-[#3d4e63] font-normal leading-relaxed font-serif">
                Lục Địa Đam Mê tái hiện tinh thần MU cổ điển,<br className="hidden sm:inline" />
                ưu tiên khám phá, cộng đồng và trải nghiệm bền vững.
              </p>

              {/* 3 Features with Genuine Asset Icons & Dividers */}
              <div className="mt-8 space-y-4">
                {/* Feature 1 */}
                <div className="flex items-center gap-4 py-2">
                  <div className="size-12 sm:size-14 shrink-0 overflow-hidden flex items-center justify-center">
                    <img
                      src="/images/games/luc-dia-dam-me/assets/icon-season6.png"
                      alt="Tinh thần Season 6"
                      className="size-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-[#152238] font-serif">Tinh thần Season 6</h3>
                    <p className="mt-0.5 text-xs sm:text-sm text-[#63758a] leading-relaxed">
                      Giữ trọn cảm xúc nguyên bản, nâng tầm trải nghiệm.
                    </p>
                  </div>
                </div>

                <div className="w-full">
                  <DiamondDivider className="my-1 opacity-70" />
                </div>

                {/* Feature 2 */}
                <div className="flex items-center gap-4 py-2">
                  <div className="size-12 sm:size-14 shrink-0 overflow-hidden flex items-center justify-center">
                    <img
                      src="/images/games/luc-dia-dam-me/assets/icon-nhip-rieng.png"
                      alt="Khám phá theo nhịp riêng"
                      className="size-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-[#152238] font-serif">Khám phá theo nhịp riêng</h3>
                    <p className="mt-0.5 text-xs sm:text-sm text-[#63758a] leading-relaxed">
                      Tự do khám phá, cảm nhận thế giới theo cách của bạn.
                    </p>
                  </div>
                </div>

                <div className="w-full">
                  <DiamondDivider className="my-1 opacity-70" />
                </div>

                {/* Feature 3 */}
                <div className="flex items-center gap-4 py-2">
                  <div className="size-12 sm:size-14 shrink-0 overflow-hidden flex items-center justify-center">
                    <img
                      src="/images/games/luc-dia-dam-me/assets/icon-cong-dong.png"
                      alt="Gắn kết cộng đồng"
                      className="size-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-[#152238] font-serif">Gắn kết cộng đồng</h3>
                    <p className="mt-0.5 text-xs sm:text-sm text-[#63758a] leading-relaxed">
                      Cộng đồng là trung tâm của mọi hành trình.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile / Tablet Image fallback */}
            <div className="lg:hidden relative flex flex-col items-center">
              <div
                className="relative w-full overflow-hidden rounded-[24px] border border-black/5 shadow-sm cursor-pointer"
                onClick={() =>
                  setLightboxImage({
                    src: '/images/games/luc-dia-dam-me/bg2.png',
                    title: 'Lục Địa Đam Mê - Kỵ sĩ trên ban công mây',
                  })
                }
              >
                <img
                  src="/images/games/luc-dia-dam-me/bg2.png"
                  alt="Kỵ sĩ Lục Địa Đam Mê trên ban công thành phố mây"
                  className="w-full object-cover aspect-[4/3]"
                  loading="lazy"
                />
              </div>
              <p className="mt-3 text-center text-xs text-[#9d7d47] font-medium tracking-wide">
                ✦ Hình ảnh minh họa định hướng ✦
              </p>
            </div>
          </div>
        </div>

        {/* Caption on Desktop */}
        <div className="hidden lg:block absolute bottom-4 right-12 z-10">
          <p className="text-xs text-[#9d7d47] font-medium tracking-wide drop-shadow-xs">
            ✦ Hình ảnh minh họa định hướng ✦
          </p>
        </div>
      </section>

      {/* 3. SECTION: "Bước vào một lục địa được tái hiện" (Panorama Banner) */}
      <section id="the-gioi" className="relative isolate overflow-hidden min-h-[340px] sm:min-h-[400px] lg:min-h-[440px] flex items-center">
        {/* Full Bleed Panorama Art */}
        <div className="absolute inset-0 -z-20 overflow-hidden">
          <img
            src="/images/games/luc-dia-dam-me/bg.png"
            alt="Lục địa trên mây"
            className="size-full object-cover object-[60%_center]"
            loading="lazy"
          />
        </div>

        {/* Soft Left Sky Gradient for text legibility */}
        <div className="absolute inset-y-0 left-0 w-full lg:w-[48%] -z-10 bg-gradient-to-r from-[#fafaf8]/70 via-[#fafaf8]/40 to-transparent pointer-events-none" />

        {/* Left Content */}
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="max-w-md lg:max-w-lg">
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-normal tracking-tight text-[#15243b] font-serif leading-[1.18]">
              Bước vào một lục địa<br />được tái hiện
            </h2>

            <div className="mt-5">
              <button
                type="button"
                onClick={() =>
                  setLightboxImage({
                    src: '/images/games/luc-dia-dam-me/bg.png',
                    title: 'Lục Địa Đam Mê - Toàn cảnh thành phố trên mây',
                  })
                }
                className="group inline-flex items-center gap-1.5 pb-0.5 border-b border-[#15243b]/60 text-xs sm:text-sm font-normal text-[#15243b] font-serif transition-colors hover:text-[#9d7d47] hover:border-[#9d7d47]"
              >
                <span>Khám phá thế giới</span>
                <span className="text-base leading-none transition-transform group-hover:translate-x-0.5">→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION: "Một hành trình, nhiều cách trải nghiệm" (Platforms) */}
      <section className="py-16 sm:py-24 bg-[#fafaf8]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-normal tracking-tight text-[#15243b] font-serif">
            Một hành trình, nhiều cách trải nghiệm
          </h2>

          {/* 3 Platforms with Vertical Dividers */}
          <div className="mt-12 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8 md:gap-0">
            {/* PC */}
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              <svg className="size-12 text-[#15243b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                <rect x="2.5" y="3.5" width="19" height="13" rx="2" stroke="currentColor" />
                <path d="M8 20.5h8M12 16.5v4" stroke="currentColor" strokeLinecap="round" />
              </svg>
              <span className="mt-3.5 font-medium text-base sm:text-lg text-[#15243b] font-serif">PC</span>
              <span className="mt-1.5 text-xs font-medium text-[#2e624a] flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-600 inline-block" /> Đang phát triển
              </span>
            </div>

            {/* Vertical Divider 1 */}
            <div className="hidden md:block w-px h-14 bg-[#d9d5c7]" />

            {/* Mobile */}
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              <svg className="size-12 text-[#15243b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                <rect x="5.5" y="2.5" width="13" height="19" rx="2.5" stroke="currentColor" />
                <path d="M10 5.5h4" stroke="currentColor" strokeLinecap="round" />
              </svg>
              <span className="mt-3.5 font-medium text-base sm:text-lg text-[#15243b] font-serif">Mobile</span>
              <span className="mt-1.5 text-xs font-medium text-[#2e624a] flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-600 inline-block" /> Đang phát triển
              </span>
            </div>

            {/* Vertical Divider 2 */}
            <div className="hidden md:block w-px h-14 bg-[#d9d5c7]" />

            {/* Web */}
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              <svg className="size-12 text-[#15243b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                <rect x="2.5" y="3.5" width="19" height="17" rx="2" stroke="currentColor" />
                <path d="M2.5 8.5h19" stroke="currentColor" strokeLinecap="round" />
              </svg>
              <span className="mt-3.5 font-medium text-base sm:text-lg text-[#15243b] font-serif">Web</span>
              <span className="mt-1.5 text-xs font-medium text-[#2e624a] flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-600 inline-block" /> Đang phát triển
              </span>
            </div>
          </div>

          <p className="mt-10 text-xs text-[#63758a]">
            Khả năng hỗ trợ và lịch mở thử nghiệm sẽ được công bố sau.
          </p>
        </div>
      </section>

      {/* 5. SECTION: "Lộ trình phát triển" (Timeline) */}
      <section id="roadmap" className="py-14 sm:py-20 bg-[#f0efe9] border-y border-black/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-normal tracking-tight text-[#152238] font-serif">
            Lộ trình phát triển
          </h2>

          {/* 4 Steps Roadmap with horizontal line */}
          <div className="mt-14 max-w-4xl mx-auto relative">
            <div className="hidden md:block absolute top-6 left-12 right-12 h-0.5 bg-[#c8cfbe] -z-0" />
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-4 relative z-10">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-[#4b5638] text-white font-bold text-base shadow-sm ring-6 ring-[#f0efe9]">
                  1
                </div>
                <h3 className="mt-4 text-sm font-medium text-[#152238] font-serif">Xây dựng thế giới</h3>
                <p className="mt-1 text-xs text-[#2e624a] font-medium">Đang triển khai</p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-[#4b5638] text-white font-bold text-base shadow-sm ring-6 ring-[#f0efe9]">
                  2
                </div>
                <h3 className="mt-4 text-sm font-medium text-[#152238] font-serif">Hoàn thiện trải nghiệm</h3>
                <p className="mt-1 text-xs text-[#2e624a] font-medium">Đang triển khai</p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center">
                <div className="flex size-12 items-center justify-center rounded-full border border-[#b8c2ad] bg-white text-[#152238]/70 font-bold text-base shadow-xs ring-6 ring-[#f0efe9]">
                  3
                </div>
                <h3 className="mt-4 text-sm font-medium text-[#152238] font-serif">Thử nghiệm</h3>
                <p className="mt-1 text-xs text-[#718294]">Dự kiến</p>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center text-center">
                <div className="flex size-12 items-center justify-center rounded-full border border-[#b8c2ad] bg-white text-[#152238]/70 font-bold text-base shadow-xs ring-6 ring-[#f0efe9]">
                  4
                </div>
                <h3 className="mt-4 text-sm font-medium text-[#152238] font-serif">Ra mắt</h3>
                <p className="mt-1 text-xs text-[#718294]">Dự kiến</p>
              </div>
            </div>

            <p className="mt-10 text-center text-xs text-[#718294]">
              Lộ trình có thể thay đổi theo tiến độ phát triển.
            </p>
          </div>
        </div>
      </section>

      {/* 6. SECTION: "Nhật ký phát triển" (Articles) */}
      <section id="nhat-ky" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-normal tracking-tight text-[#152238] font-serif">
            Nhật ký phát triển
          </h2>

          {/* 3 Articles Grid */}
          <div className="mt-12 grid gap-6 sm:grid-cols-3 text-left">
            {game.articles.slice(0, 3).map((article) => (
              <Link
                key={article.slug}
                href={gameUrl(game.subdomain, `/tin-tuc/${article.slug}`)}
                className="group rounded-2xl bg-white border border-[#e5e4de] overflow-hidden shadow-xs transition-all hover:shadow-md hover:-translate-y-1"
              >
                <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                  {article.coverImageUrl ? <img src={article.coverImageUrl} alt={article.title} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" /> : null}
                </div>
                <div className="p-5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#9d7d47]">
                    {article.category.replaceAll('_', ' ')}
                  </p>
                  <h3 className="mt-2 text-base font-medium text-[#152238] font-serif line-clamp-1">
                    {article.title}
                  </h3>
                  <div className="mt-4 flex items-center text-[#9d7d47] text-sm font-bold gap-1 group-hover:translate-x-1 transition-transform">
                    <span>→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10">
            <Link
              href={gameUrl(game.subdomain, '/tin-tuc')}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#9d7d47] hover:underline font-serif"
            >
              Xem tất cả bài viết <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. SECTION: Bottom CTA Banner - 100% Full-Width Edge-to-Edge */}
      <section className="relative isolate overflow-hidden w-full border-t border-black/5 py-20 sm:py-28 lg:py-32 flex items-center justify-center">
        {/* Full-Width Panoramic Background Art */}
        <div className="absolute inset-0 -z-20 overflow-hidden">
          <img
            src="/images/games/luc-dia-dam-me/bg2.png"
            alt="Lục Địa Đam Mê toàn cảnh"
            className="size-full object-cover object-[50%_40%]"
            loading="lazy"
          />
        </div>

        {/* Subtle Ultra-Light Overlay to keep background image clear & vibrant */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#eaf2f8]/30 via-[#eaf2f8]/15 to-[#eaf2f8]/35 pointer-events-none" />

        {/* Centered Content Container */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-[50px] font-normal tracking-tight text-[#15243b] font-serif leading-[1.12] drop-shadow-xs">
            Cùng viết tiếp hành trình đam mê.
          </h2>
          <p className="mt-4 text-sm sm:text-base lg:text-lg text-[#253952] font-serif leading-relaxed max-w-xl mx-auto drop-shadow-2xs font-medium">
            Theo dõi những cập nhật mới nhất và đồng hành cùng dự án trong từng giai đoạn phát triển.
          </p>

          {/* Centered Action Buttons */}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl border border-[#cbb37e] bg-[#50603c] px-9 text-sm font-medium text-white shadow-md transition-all hover:bg-[#435231] active:scale-[0.98]"
            >
              <span>Theo dõi dự án</span>
              <span className="text-base">🪶</span>
            </button>
            <Link
              href={portalUrl('/auth/register')}
              className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl border border-[#c4ced7] bg-white/95 px-9 text-sm font-medium text-[#15243b] shadow-md transition-all hover:bg-white active:scale-[0.98] font-serif backdrop-blur-sm"
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
