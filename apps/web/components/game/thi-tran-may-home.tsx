'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Smartphone,
  Globe,
  Sun,
  Sprout,
  Cloud,
  Moon,
  ChevronDown,
  Send,
  X,
} from 'lucide-react';
import { gameUrl, portalUrl } from '@/lib/domain';
import { useGame } from '@/components/game/game-context';

// Leaf SVG icon with custom shape matching design
function LeafIcon({ className = 'size-4 text-emerald-500 shrink-0 inline-block' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
    </svg>
  );
}

const GALLERY_ITEMS = [
  {
    id: 'town-square',
    title: 'Quảng trường',
    subtitle: 'Minh họa concept',
    fullSrc: '/images/games/thi-tran-may/detail-v1/town-square.webp',
    thumbSrc: '/images/games/thi-tran-may/detail-v1/town-square.webp',
    alt: 'Quảng trường và tháp đồng hồ của Thị Trấn Mây',
  },
  {
    id: 'garden',
    title: 'Khu vườn',
    subtitle: 'Minh họa concept',
    fullSrc: '/images/games/thi-tran-may/detail-v1/garden.webp',
    thumbSrc: '/images/games/thi-tran-may/detail-v1/garden.webp',
    alt: 'Khu vườn và những ngôi nhà trên đảo mây',
  },
  {
    id: 'airships',
    title: 'Khinh khí cầu',
    subtitle: 'Minh họa concept',
    fullSrc: '/images/games/thi-tran-may/detail-v1/airships.webp',
    thumbSrc: '/images/games/thi-tran-may/detail-v1/airships.webp',
    alt: 'Khinh khí cầu bay trên những tầng mây',
  },
];

const FAQS = [
  {
    id: 1,
    question: 'Đây có phải game đã phát hành?',
    answer: 'Chưa. Đây là bản concept minh họa.',
  },
  {
    id: 2,
    question: 'Đã có bản tải game chưa?',
    answer: 'Hiện chưa có bản tải hoặc bản chơi thử.',
  },
  {
    id: 3,
    question: 'Tôi có thể xem thêm ở đâu?',
    answer: 'Khám phá các dự án khác tại ZENX GO.',
  },
];

export function ThiTranMayHome() {
  const game = useGame();
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({ 1: true, 2: true, 3: true });
  const [lightboxImage, setLightboxImage] = useState<{ src: string; title: string; alt: string } | null>(null);

  const toggleFaq = (id: number) => {
    setOpenFaqs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f9fd] text-[#123b63] font-sans selection:bg-[#118a94]/20 selection:text-[#123b63]">
      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-200"
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
              alt={lightboxImage.alt}
              className="max-h-[80vh] w-auto object-contain"
            />
            <div className="p-4 text-center text-sm font-semibold text-white/90 bg-slate-950">
              {lightboxImage.title}
            </div>
          </div>
        </div>
      )}

      {/* 1. HERO SECTION - Full Bleed Key Art Background matching design */}
      <section className="relative isolate overflow-hidden min-h-[640px] sm:min-h-[720px] lg:min-h-[820px] flex items-center">
        {/* Full Bleed Background Art */}
        <div className="absolute inset-0 -z-20 overflow-hidden">
          <picture>
            <source
              media="(max-width: 767px)"
              srcSet="/images/games/thi-tran-may/detail-v1/hero-mobile.webp"
            />
            <img
              src="/images/games/thi-tran-may/detail-v1/hero.webp"
              alt="Thị trấn nổi giữa bầu trời và những tầng mây"
              className="size-full object-cover object-[58%_40%] lg:object-[56%_38%]"
              fetchPriority="high"
            />
          </picture>
        </div>

        {/* Soft Left Side Gradient Overlay for Crisp Text Contrast */}
        <div className="absolute inset-y-0 left-0 w-full lg:w-[62%] -z-10 bg-gradient-to-r from-[#e3f2fb]/95 via-[#e3f2fb]/80 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-28 -z-10 bg-gradient-to-t from-[#f3f9fd] via-[#f3f9fd]/60 to-transparent pointer-events-none" />

        {/* Hero Content Container */}
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="max-w-xl lg:max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-[#cae8f7] px-3.5 py-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#165a88] shadow-2xs">
              <span>BẢN CONCEPT • CASUAL MÔ PHỎNG</span>
            </div>

            {/* Title */}
            <h1 className="mt-3 text-5xl sm:text-6xl lg:text-[76px] font-black tracking-tight text-[#123b63] font-serif leading-[1.04]">
              THỊ TRẤN MÂY
            </h1>

            {/* Subtitle */}
            <p className="mt-3 text-xl sm:text-2xl font-black text-[#10304f] leading-snug">
              Xây một góc nhỏ trên những tầng mây.
            </p>

            {/* Description */}
            <p className="mt-3 text-sm sm:text-base text-[#386284] leading-relaxed max-w-md">
              Khám phá ý tưởng về một thị trấn nổi dành cho sáng tạo và thư giãn.
            </p>

            {/* CTA Buttons */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => scrollToSection('y-tuong')}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0f828a] px-6 py-2.5 text-sm font-bold text-white shadow-xs transition-all hover:bg-[#0c6c73] active:scale-[0.98]"
              >
                Khám phá concept
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('thi-tran')}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#0f828a] bg-white/90 px-6 py-2.5 text-sm font-bold text-[#0f828a] shadow-xs backdrop-blur-xs transition-all hover:bg-white active:scale-[0.98]"
              >
                Xem ý tưởng trải nghiệm
              </button>
            </div>

            {/* Platform indicators inline */}
            <div className="mt-6 flex flex-wrap items-center gap-2 text-sm font-semibold text-[#2f5575]">
              <span>Nền tảng dự kiến:</span>
              <span className="inline-flex items-center gap-1.5 text-[#0f828a]">
                <Smartphone className="size-4" /> Mobile
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5 text-[#0f828a]">
                <Globe className="size-4" /> Web
              </span>
            </div>

            {/* Disclaimer */}
            <p className="mt-3.5 text-xs text-[#6285a2]">
              Hình ảnh và nội dung minh họa cho concept game.
            </p>
          </div>
        </div>
      </section>

      {/* 2. SECTION: "Một nơi bình yên để tự tay vun đắp." */}
      <section id="gioi-thieu" className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
            {/* Left Copy */}
            <div className="lg:col-span-5">
              <div className="flex items-start gap-2.5">
                <LeafIcon className="size-5 text-emerald-500 shrink-0 mt-1.5" />
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#10304f] font-serif leading-[1.15]">
                  Một nơi bình yên<br />để tự tay vun đắp.
                </h2>
              </div>
              <p className="mt-5 text-base sm:text-lg text-[#386284] leading-relaxed pl-8">
                Ý tưởng Thị Trấn Mây hướng tới nhịp trải nghiệm nhẹ nhàng, nơi mỗi lựa chọn góp phần tạo nên một thị trấn mang dấu ấn riêng.
              </p>
            </div>

            {/* Right Image */}
            <div className="lg:col-span-7">
              <div className="overflow-hidden rounded-[28px] shadow-sm">
                <img
                  src="/images/games/thi-tran-may/detail-v1/town-square.webp"
                  alt="Quảng trường và tháp đồng hồ của Thị Trấn Mây"
                  className="w-full object-cover transition-transform duration-500 hover:scale-[1.02] cursor-pointer"
                  onClick={() =>
                    setLightboxImage({
                      src: '/images/games/thi-tran-may/detail-v1/town-square.webp',
                      title: 'Minh họa concept thị trấn',
                      alt: 'Quảng trường và tháp đồng hồ của Thị Trấn Mây',
                    })
                  }
                  loading="lazy"
                />
              </div>
              <p className="mt-2.5 text-center text-xs text-[#7395af]">
                Minh họa concept thị trấn
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION: "Ba hướng trải nghiệm được đề xuất" */}
      <section id="y-tuong" className="py-12 sm:py-16 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Heading with Leaves */}
          <div className="text-center">
            <h2 className="inline-flex items-center justify-center gap-2.5 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#10304f] font-serif">
              <LeafIcon className="size-5 text-emerald-500" />
              <span>Ba hướng trải nghiệm được đề xuất</span>
              <LeafIcon className="size-5 text-emerald-500" />
            </h2>
          </div>

          {/* Cards with Left Thumbnail + Right Content & Paper Plane */}
          <div className="relative mt-10">
            {/* Paper Airplane decorative on top right */}
            <div className="hidden lg:flex items-center absolute -top-4 right-6 text-[#118a94] opacity-80">
              <Send className="size-6 -rotate-12" />
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {/* Card 01 */}
              <div className="flex items-center gap-4 rounded-[26px] bg-[#fffef9] border border-[#faecd8] p-3 shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5">
                <div className="w-[125px] sm:w-[140px] h-[115px] shrink-0 overflow-hidden rounded-[20px]">
                  <img
                    src="/images/games/thi-tran-may/detail-v1/town-square-thumb.webp"
                    alt="Xây dựng góc nhỏ"
                    className="size-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                    onClick={() =>
                      setLightboxImage({
                        src: '/images/games/thi-tran-may/detail-v1/town-square.webp',
                        title: '01 - Xây dựng góc nhỏ',
                        alt: 'Xây dựng góc nhỏ',
                      })
                    }
                    loading="lazy"
                  />
                </div>
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-black text-[#118a94] font-serif">01</span>
                    <LeafIcon className="size-3.5 text-emerald-500" />
                  </div>
                  <h3 className="text-base font-bold text-[#10304f] mt-0.5">Xây dựng góc nhỏ</h3>
                  <p className="text-xs text-[#527797] mt-1 leading-snug">
                    Sắp xếp công trình và tạo không gian theo phong cách riêng.
                  </p>
                </div>
              </div>

              {/* Card 02 */}
              <div className="flex items-center gap-4 rounded-[26px] bg-[#fffef9] border border-[#faecd8] p-3 shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5">
                <div className="w-[125px] sm:w-[140px] h-[115px] shrink-0 overflow-hidden rounded-[20px]">
                  <img
                    src="/images/games/thi-tran-may/detail-v1/garden-thumb.webp"
                    alt="Chăm sóc thị trấn"
                    className="size-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                    onClick={() =>
                      setLightboxImage({
                        src: '/images/games/thi-tran-may/detail-v1/garden.webp',
                        title: '02 - Chăm sóc thị trấn',
                        alt: 'Chăm sóc thị trấn',
                      })
                    }
                    loading="lazy"
                  />
                </div>
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-black text-[#118a94] font-serif">02</span>
                    <LeafIcon className="size-3.5 text-emerald-500" />
                  </div>
                  <h3 className="text-base font-bold text-[#10304f] mt-0.5">Chăm sóc thị trấn</h3>
                  <p className="text-xs text-[#527797] mt-1 leading-snug">
                    Theo dõi những hoạt động nhẹ nhàng trong ngày.
                  </p>
                </div>
              </div>

              {/* Card 03 */}
              <div className="flex items-center gap-4 rounded-[26px] bg-[#fffef9] border border-[#faecd8] p-3 shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5">
                <div className="w-[125px] sm:w-[140px] h-[115px] shrink-0 overflow-hidden rounded-[20px]">
                  <img
                    src="/images/games/thi-tran-may/detail-v1/floating-islands-thumb.webp"
                    alt="Kết nối đảo mây"
                    className="size-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                    onClick={() =>
                      setLightboxImage({
                        src: '/images/games/thi-tran-may/detail-v1/floating-islands.webp',
                        title: '03 - Kết nối đảo mây',
                        alt: 'Kết nối đảo mây',
                      })
                    }
                    loading="lazy"
                  />
                </div>
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-black text-[#118a94] font-serif">03</span>
                    <LeafIcon className="size-3.5 text-emerald-500" />
                  </div>
                  <h3 className="text-base font-bold text-[#10304f] mt-0.5">Kết nối đảo mây</h3>
                  <p className="text-xs text-[#527797] mt-1 leading-snug">
                    Khám phá ý tưởng giao lưu giữa các hòn đảo.
                  </p>
                </div>
              </div>
            </div>

            {/* Note below cards */}
            <p className="mt-6 text-center text-xs text-[#7395af]">
              Các hướng trải nghiệm đang ở mức ý tưởng.
            </p>
          </div>
        </div>
      </section>

      {/* 4. SECTION: "Trên những tầng mây" - Wrapped in Rounded Container */}
      <section id="thi-tran" className="py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[32px] bg-gradient-to-b from-[#f4f9fd] to-[#edf6fc] border border-[#d6ecf8] p-6 sm:p-10 shadow-xs">
            {/* Section Heading */}
            <div className="text-center">
              <h2 className="inline-flex items-center justify-center gap-2.5 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#10304f] font-serif">
                <LeafIcon className="size-5 text-emerald-500" />
                <span>Trên những tầng mây</span>
                <LeafIcon className="size-5 text-emerald-500" />
              </h2>
            </div>

            {/* Panorama Image */}
            <div className="mt-8 overflow-hidden rounded-[22px] shadow-xs">
              <img
                src="/images/games/thi-tran-may/detail-v1/floating-islands.webp"
                alt="Quần thể đảo mây kết nối quanh thị trấn"
                className="w-full max-h-[360px] object-cover transition-transform duration-700 hover:scale-[1.01] cursor-pointer"
                onClick={() =>
                  setLightboxImage({
                    src: '/images/games/thi-tran-may/detail-v1/floating-islands.webp',
                    title: 'Quần thể đảo mây kết nối quanh thị trấn',
                    alt: 'Quần thể đảo mây kết nối quanh thị trấn',
                  })
                }
                loading="lazy"
              />
            </div>

            {/* 3 Gallery Cards */}
            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              {GALLERY_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className="group cursor-pointer text-center"
                  onClick={() =>
                    setLightboxImage({
                      src: item.fullSrc,
                      title: item.title,
                      alt: item.alt,
                    })
                  }
                >
                  <div className="overflow-hidden rounded-[20px] shadow-xs transition-transform duration-300 group-hover:scale-[1.02]">
                    <img
                      src={item.thumbSrc}
                      alt={item.alt}
                      className="aspect-[16/9] w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="mt-2.5 text-base font-bold text-[#10304f]">{item.title}</h3>
                  <p className="text-xs text-[#7395af]">{item.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECTION: "Một ngày ở Thị Trấn Mây" (Daily Rhythm) - Wrapped in Rounded Container */}
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[32px] bg-gradient-to-b from-[#f4f9fd] to-[#edf6fc] border border-[#d6ecf8] p-8 sm:p-12 shadow-xs">
            {/* Eyebrow & Title */}
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#118a94]">
                HÌNH DUNG TRẢI NGHIỆM
              </p>
              <h2 className="mt-2.5 inline-flex items-center justify-center gap-2.5 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#10304f] font-serif">
                <LeafIcon className="size-5 text-emerald-500" />
                <span>Một ngày ở Thị Trấn Mây</span>
                <LeafIcon className="size-5 text-emerald-500" />
              </h2>
            </div>

            {/* 4 Steps Chain with connecting lines */}
            <div className="mt-12 sm:mt-14">
              <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-4 relative">
                {/* Step 1 */}
                <div className="flex flex-col items-center text-center">
                  <div className="flex size-18 sm:size-22 items-center justify-center rounded-full bg-[#fffcf3] text-amber-500 shadow-sm ring-6 ring-amber-100/70 transition-transform hover:scale-110">
                    <Sun className="size-9 sm:size-11" />
                  </div>
                  <div className="mt-4">
                    <div className="text-sm font-bold text-[#10304f]">
                      <span className="text-[#118a94]">01</span> Buổi sáng
                    </div>
                    <p className="mt-0.5 text-xs text-[#527797]">Đánh thức thị trấn</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center text-center">
                  <div className="flex size-18 sm:size-22 items-center justify-center rounded-full bg-[#f4fcf7] text-emerald-500 shadow-sm ring-6 ring-emerald-100/70 transition-transform hover:scale-110">
                    <Sprout className="size-9 sm:size-11" />
                  </div>
                  <div className="mt-4">
                    <div className="text-sm font-bold text-[#10304f]">
                      <span className="text-[#118a94]">02</span> Buổi trưa
                    </div>
                    <p className="mt-0.5 text-xs text-[#527797]">Chăm sóc khu vườn</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center text-center">
                  <div className="flex size-18 sm:size-22 items-center justify-center rounded-full bg-[#f2f9ff] text-sky-500 shadow-sm ring-6 ring-sky-100/70 transition-transform hover:scale-110">
                    <Cloud className="size-9 sm:size-11" />
                  </div>
                  <div className="mt-4">
                    <div className="text-sm font-bold text-[#10304f]">
                      <span className="text-[#118a94]">03</span> Buổi chiều
                    </div>
                    <p className="mt-0.5 text-xs text-[#527797]">Khám phá đảo mây</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex flex-col items-center text-center">
                  <div className="flex size-18 sm:size-22 items-center justify-center rounded-full bg-[#f9f5ff] text-purple-500 shadow-sm ring-6 ring-purple-100/70 transition-transform hover:scale-110">
                    <Moon className="size-9 sm:size-11" />
                  </div>
                  <div className="mt-4">
                    <div className="text-sm font-bold text-[#10304f]">
                      <span className="text-[#118a94]">04</span> Buổi tối
                    </div>
                    <p className="mt-0.5 text-xs text-[#527797]">Thu xếp góc nhỏ</p>
                  </div>
                </div>
              </div>

              <p className="mt-8 text-center text-xs text-[#7395af]">
                Minh họa nhịp trải nghiệm dự kiến.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SECTION: "Nền tảng dự kiến" & "Về bản concept" */}
      <section id="nen-tang" className="py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Card: Nền tảng dự kiến */}
            <div className="flex flex-col justify-between rounded-[28px] bg-[#edf6fc] border border-[#d3eaf8] p-6 sm:p-8 shadow-xs">
              <div>
                <div className="text-center">
                  <h2 className="inline-flex items-center justify-center gap-2 text-xl sm:text-2xl font-black text-[#10304f] font-serif">
                    <LeafIcon className="size-4.5 text-emerald-500" />
                    <span>Nền tảng dự kiến</span>
                    <LeafIcon className="size-4.5 text-emerald-500" />
                  </h2>
                </div>

                <div className="mt-7 grid grid-cols-2 gap-4">
                  {/* Mobile Box */}
                  <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-6 shadow-xs border border-sky-100/50">
                    <Smartphone className="size-11 text-[#0f828a]" />
                    <span className="mt-2.5 font-bold text-base text-[#10304f]">Mobile</span>
                    <span className="mt-2 rounded-full bg-[#0f828a] px-3 py-0.5 text-[11px] font-bold text-white">
                      Dự kiến
                    </span>
                  </div>

                  {/* Web Box */}
                  <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-6 shadow-xs border border-sky-100/50">
                    <Globe className="size-11 text-[#0f828a]" />
                    <span className="mt-2.5 font-bold text-base text-[#10304f]">Web</span>
                    <span className="mt-2 rounded-full bg-[#0f828a] px-3 py-0.5 text-[11px] font-bold text-white">
                      Dự kiến
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-6 text-center text-xs text-[#7395af]">
                Chưa có bản chơi thử hoặc lịch phát hành.
              </p>
            </div>

            {/* Right Card: Về bản concept */}
            <div className="flex flex-col justify-between rounded-[28px] bg-[#edf6fc] border border-[#d3eaf8] p-6 sm:p-8 shadow-xs">
              <div>
                <div className="text-center">
                  <h2 className="inline-flex items-center justify-center gap-2 text-xl sm:text-2xl font-black text-[#10304f] font-serif">
                    <LeafIcon className="size-4.5 text-emerald-500" />
                    <span>Về bản concept</span>
                    <LeafIcon className="size-4.5 text-emerald-500" />
                  </h2>
                </div>

                <div className="mt-7 space-y-3">
                  {FAQS.map((faq) => {
                    const isOpen = !!openFaqs[faq.id];
                    return (
                      <div
                        key={faq.id}
                        className="rounded-2xl bg-white border border-[#e2eff8] px-4 py-3.5 shadow-xs transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => toggleFaq(faq.id)}
                          className="flex w-full items-center justify-between text-left font-bold text-xs sm:text-sm text-[#10304f]"
                        >
                          <span className="font-bold">{faq.question}</span>
                          <span className="font-normal text-[#527797] text-xs sm:text-sm hidden sm:inline ml-auto mr-3">
                            {faq.answer}
                          </span>
                          <ChevronDown
                            className={`size-4 text-[#0f828a] transition-transform duration-200 shrink-0 ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {isOpen && (
                          <div className="mt-2 sm:hidden text-xs text-[#527797] border-t border-sky-50 pt-2">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 text-center text-xs text-[#7395af]">
                &nbsp;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. SECTION: Development Updates */}
      {game.articles.length ? <section id="nhat-ky" className="py-10 sm:py-16"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0f828a]">Nhật ký concept</p><h2 className="mt-3 text-2xl font-black text-[#10304f] font-serif sm:text-3xl">Những ghi chú từ thị trấn</h2></div><Link href={portalUrl('/news?game=thi-tran-may')} className="hidden items-center gap-2 text-xs font-bold text-[#0f828a] sm:inline-flex">Xem tất cả <ArrowRight className="size-4" /></Link></div><div className="mt-7 grid gap-5 md:grid-cols-3">{game.articles.slice(0, 3).map((article) => <Link key={article.slug} href={gameUrl(game.subdomain, `/tin-tuc/${article.slug}`)} className="group overflow-hidden rounded-3xl border border-[#cbe5f5] bg-white shadow-xs transition-all hover:-translate-y-1 hover:shadow-lg"><div className="aspect-[16/9] overflow-hidden bg-[#d9effb]">{article.coverImageUrl ? <img src={article.coverImageUrl} alt={article.title} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" /> : null}</div><div className="p-5"><p className="text-[11px] font-bold uppercase tracking-wider text-[#0f828a]">{article.category.replaceAll('_', ' ')}</p><h3 className="mt-3 font-bold text-[#10304f]">{article.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-[#527797]">{article.excerpt}</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#0f828a]">Đọc bài viết <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span></div></Link>)}</div><Link href={portalUrl('/news?game=thi-tran-may')} className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-[#0f828a] sm:hidden">Xem tất cả bài viết <ArrowRight className="size-4" /></Link></div></section> : null}

      {/* 8. SECTION: Bottom Banner CTA */}
      <section className="pb-14 sm:pb-20 pt-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative isolate overflow-hidden rounded-[28px] bg-gradient-to-r from-[#d9effb] via-[#e4f4fd] to-[#eff8fd] border border-[#cbe5f5] p-8 sm:p-12 lg:p-14 shadow-xs">
            {/* Background Panorama Accent on the right */}
            <div className="absolute inset-y-0 right-0 -z-10 w-full lg:w-3/5 opacity-40 lg:opacity-75 mix-blend-multiply overflow-hidden pointer-events-none">
              <img
                src="/images/games/thi-tran-may/detail-v1/floating-islands.webp"
                alt=""
                className="h-full w-full object-cover object-right"
              />
            </div>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
              {/* Left Content */}
              <div className="max-w-xl">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#10304f] font-serif">
                    Cùng xây nên một<br className="hidden sm:inline" /> thị trấn trên mây.
                  </h2>
                  <LeafIcon className="size-6 text-emerald-500 shrink-0 inline-block self-end mb-1" />
                </div>
                <p className="mt-2 text-sm sm:text-base text-[#386284] leading-relaxed">
                  Khám phá thêm những thế giới concept trong hệ sinh thái ZENX GO.
                </p>
              </div>

              {/* Right Buttons */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link
                  href={portalUrl('/games')}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0f828a] px-6 text-sm font-bold text-white shadow-xs transition-all hover:bg-[#0c6b71]"
                >
                  Về ZENX GO
                </Link>
                <Link
                  href={portalUrl('/auth/register')}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#9fd3f2] bg-white px-6 text-sm font-bold text-[#10304f] shadow-xs transition-all hover:bg-sky-50"
                >
                  Tạo tài khoản
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
