'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Smartphone,
  Globe,
  Sun,
  Sprout,
  Leaf,
  Cloud,
  Moon,
  ChevronDown,
  X,
  HelpCircle,
} from 'lucide-react';
import { gameUrl, portalUrl } from '@/lib/domain';
import { useGame } from '@/components/game/game-context';

// Leaf SVG icon with custom shape matching design
function LeafIcon({ className = 'size-5 text-emerald-500 shrink-0 inline-block' }: { className?: string }) {
  return (
    <svg
      className={`size-5 shrink-0 inline-block ${className}`}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ width: '20px', height: '20px', minWidth: '20px', minHeight: '20px', flexShrink: 0 }}
    >
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
    </svg>
  );
}

const GALLERY_ITEMS = [
  {
    id: 'town-square',
    title: 'Quảng trường',
    subtitle: 'Thư viện thế giới',
    fullSrc: '/images/games/thi-tran-may/detail-v1/town-square.webp',
    thumbSrc: '/images/games/thi-tran-may/detail-v1/town-square.webp',
    alt: 'Quảng trường và tháp đồng hồ của Thị Trấn Mây',
  },
  {
    id: 'garden',
    title: 'Khu vườn',
    subtitle: 'Thư viện thế giới',
    fullSrc: '/images/games/thi-tran-may/detail-v1/garden.webp',
    thumbSrc: '/images/games/thi-tran-may/detail-v1/garden.webp',
    alt: 'Khu vườn và những ngôi nhà trên đảo mây',
  },
  {
    id: 'airships',
    title: 'Khinh khí cầu',
    subtitle: 'Thư viện thế giới',
    fullSrc: '/images/games/thi-tran-may/detail-v1/airships.webp',
    thumbSrc: '/images/games/thi-tran-may/detail-v1/airships.webp',
    alt: 'Khinh khí cầu bay trên những tầng mây',
  },
];

const FAQS = [
  {
    id: 1,
    question: 'Thị Trấn Mây có những hoạt động nào?',
    answer: 'Bạn có thể chăm sóc khu vườn nổi, ghé thăm hàng xóm, trao đổi vật phẩm và tham gia các hoạt động theo mùa tại Quảng trường Mây.',
  },
  {
    id: 2,
    question: 'Làm thế nào để đồng bộ tiến trình?',
    answer: 'Đăng nhập cùng một tài khoản ZENX GO trên các thiết bị được hỗ trợ để đồng bộ tiến trình, vật phẩm và lịch hoạt động của thị trấn.',
  },
  {
    id: 3,
    question: 'Tôi có thể theo dõi tiến độ và đóng góp ý kiến ở đâu?',
    answer: 'Bạn có thể xem Tin tức để cập nhật mùa vụ, hoặc tham gia Cộng đồng ZENX GO để chia sẻ ảnh, mẹo chăm vườn và lịch ghé thăm.',
  },
];

export function ThiTranMayHome() {
  const game = useGame();
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({ 1: true });
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; title: string; alt: string } | null>(null);

  const activeGalleryItem = GALLERY_ITEMS[activeGalleryIndex];

  const toggleFaq = (id: number) => {
    setOpenFaqs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="bg-[#f0f8ff] text-[#123b63] font-sans antialiased selection:bg-[#cae8f7] selection:text-[#123b63]">
      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 z-50 size-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors cursor-pointer"
            aria-label="Đóng ảnh"
          >
            <X className="size-6" />
          </button>
          <div className="relative max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl">
            <img
              src={lightboxImage.src}
              alt={lightboxImage.alt}
              className="max-h-[85vh] w-auto object-contain"
            />
            <div className="p-4 text-center text-sm font-semibold text-[#10304f] bg-white">
              {lightboxImage.title}
            </div>
          </div>
        </div>
      )}

      {/* 1. HERO SECTION */}
      <section className="relative isolate overflow-hidden min-h-[540px] sm:min-h-[580px] lg:h-[calc(100vh-80px)] lg:min-h-[600px] lg:max-h-[780px] flex items-center bg-[#dff0fb]">
        <div className="absolute inset-0 -z-20 overflow-hidden">
          <picture>
            <source
              media="(max-width: 767px)"
              srcSet="/images/games/thi-tran-may/detail-v1/hero-mobile.webp"
            />
            <img
              src="/images/games/thi-tran-may/detail-v1/hero.webp"
              alt="Thị Trấn Mây - Hòn đảo bay kỳ diệu"
              className="size-full object-cover object-[70%_center] sm:object-center contrast-102 brightness-100"
              fetchPriority="high"
            />
          </picture>
        </div>

        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#e3f2fb]/95 via-[#e3f2fb]/70 via-40% to-transparent pointer-events-none hidden sm:block" />
        <div className="block sm:hidden absolute inset-0 -z-10 bg-gradient-to-t from-[#e3f2fb] via-[#e3f2fb]/80 via-60% to-transparent pointer-events-none" />

        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="max-w-xl lg:max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#cae8f7] px-3.5 py-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#165a88] shadow-2xs">
              <span>ĐANG HOẠT ĐỘNG • CASUAL MÔ PHỎNG</span>
            </div>

            <h1 className="mt-4 text-5xl sm:text-6xl lg:text-[76px] font-black tracking-tight text-[#10304f] font-serif leading-[1.04]">
              THỊ TRẤN MÂY
            </h1>

            <p className="mt-4 text-xl sm:text-2xl font-black text-[#10304f] leading-snug">
              {game.tagline}
            </p>

            <p className="mt-4 text-sm sm:text-base text-[#386284] leading-relaxed max-w-md">
              Chăm sóc một thị trấn nổi dành cho sáng tạo, kết nối và thư giãn mỗi ngày.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={gameUrl(game.subdomain, '/tin-tuc')}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0f828a] px-6 py-2.5 text-sm font-bold text-white shadow-xs transition-all hover:bg-[#0c6c73] active:scale-[0.98]"
              >
                Xem tin tức
              </Link>
              <Link
                href={portalUrl('/events?game=thi-tran-may')}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#0f828a] bg-white/90 px-6 py-2.5 text-sm font-bold text-[#0f828a] shadow-xs backdrop-blur-xs transition-all hover:bg-white active:scale-[0.98]"
              >
                Xem sự kiện
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION: 3 Pillar Cards */}
      <section id="thi-tran" className="py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#0f828a]">
              <LeafIcon className="size-5 text-emerald-500" />
              <span>Ý TƯỞNG TRẢI NGHIỆM</span>
              <LeafIcon className="size-5 text-emerald-500" />
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black text-[#10304f] font-serif">
              Ba điểm chạm nhẹ nhàng
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="flex flex-col justify-between rounded-[28px] bg-white border border-[#cbe5f5] p-6 sm:p-8 shadow-xs transition-all hover:shadow-md hover:-translate-y-1">
              <div>
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[#e3f2fb] text-[#0f828a]">
                  <Sun className="size-6" />
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[#10304f]">
                    Xây dựng & Sáng tạo
                  </h3>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                    <LeafIcon className="size-3.5 text-emerald-500" />
                    <span>01</span>
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#527797]">
                  Tự do sắp đặt từng góc nhỏ trên đảo mây: từ ngôi nhà mái ngói, khu vườn hoa đến con đường lát đá dẫn ra bến khinh khí cầu.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-sky-50 text-xs text-[#7395af]">
                Sắp đặt không gian thư giãn
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-[28px] bg-white border border-[#cbe5f5] p-6 sm:p-8 shadow-xs transition-all hover:shadow-md hover:-translate-y-1">
              <div>
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[#e3f2fb] text-[#0f828a]">
                  <Sprout className="size-6" />
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[#10304f]">
                    Nhịp sống êm ả
                  </h3>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                    <LeafIcon className="size-3.5 text-emerald-500" />
                    <span>02</span>
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#527797]">
                  Chăm sóc những mảnh vườn nhỏ, theo dõi cây cối lớn lên theo thời gian thực và tận hưởng nhịp ngày - đêm nhẹ nhàng.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-sky-50 text-xs text-[#7395af]">
                Vườn cây & Thời gian thực
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-[28px] bg-white border border-[#cbe5f5] p-6 sm:p-8 shadow-xs transition-all hover:shadow-md hover:-translate-y-1">
              <div>
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[#e3f2fb] text-[#0f828a]">
                  <Cloud className="size-6" />
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[#10304f]">
                    Ghé thăm bạn bè
                  </h3>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                    <LeafIcon className="size-3.5 text-emerald-500" />
                    <span>03</span>
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#527797]">
                  Ghé thăm hòn đảo của bạn bè bằng khinh khí cầu, để lại lời nhắn ấm áp và trao đổi những món quà lưu niệm độc đáo.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-sky-50 text-xs text-[#7395af]">
                Cộng đồng & Giao lưu
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION: Interactive Gallery (World library) */}
      <section id="y-tuong" className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#0f828a]">
              <LeafIcon className="size-5 text-emerald-500" />
              <span>THƯ VIỆN THẾ GIỚI</span>
              <LeafIcon className="size-5 text-emerald-500" />
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black text-[#10304f] font-serif">
              Thế giới trên những tầng mây
            </h2>
          </div>

          <div className="mt-10 overflow-hidden rounded-[28px] bg-white border border-[#cbe5f5] p-4 sm:p-6 shadow-sm">
            <div
              className="overflow-hidden rounded-2xl cursor-pointer group relative aspect-[16/9]"
              onClick={() =>
                setLightboxImage({
                  src: activeGalleryItem.fullSrc,
                  title: activeGalleryItem.title,
                  alt: activeGalleryItem.alt,
                })
              }
            >
              <img
                src={activeGalleryItem.fullSrc}
                alt={activeGalleryItem.alt}
                className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                <span className="text-white text-sm font-bold flex items-center gap-2">
                  <span>Phóng to hình ảnh</span>
                  <ArrowRight className="size-4" />
                </span>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-3 sm:gap-4">
              {GALLERY_ITEMS.map((item, index) => {
                const isActive = activeGalleryIndex === index;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveGalleryIndex(index)}
                    className={`rounded-2xl border-2 p-2 sm:p-3 text-left transition-all cursor-pointer ${
                      isActive
                        ? 'border-[#0f828a] bg-[#e3f2fb]/70 shadow-xs scale-[1.02]'
                        : 'border-[#d4eaf7] bg-white hover:bg-[#f4faff]'
                    }`}
                  >
                    <div className="aspect-[16/10] overflow-hidden rounded-xl">
                      <img
                        src={item.thumbSrc}
                        alt={item.title}
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <p className="mt-2 text-xs sm:text-sm font-bold text-[#10304f] truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-[#7395af] truncate hidden sm:block">
                      {item.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECTION: "Nhịp ngày & đêm" (Day & Night Rhythm) */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#0f828a]">
              <LeafIcon className="size-5 text-emerald-500" />
              <span>NHỊP NGÀY & ĐÊM</span>
              <LeafIcon className="size-5 text-emerald-500" />
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black text-[#10304f] font-serif">
              Thời gian trôi êm đềm
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-[28px] bg-white border border-[#cbe5f5] p-6 sm:p-8 shadow-xs">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#fef3c7] text-[#d97706]">
                <Sun className="size-6" />
              </div>
              <h3 className="mt-5 text-2xl font-black text-[#10304f] font-serif">
                Ban ngày rực rỡ
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#527797]">
                Ánh nắng chan hòa chiếu rọi từng luống rau, quảng trường rộn ràng tiếng chuông và những chuyến khinh khí cầu nhộn nhịp cập bến.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-[#0f828a]">
                <span className="rounded-full bg-[#e3f2fb] px-3 py-1">Tưới cây</span>
                <span className="rounded-full bg-[#e3f2fb] px-3 py-1">Thu hoạch</span>
                <span className="rounded-full bg-[#e3f2fb] px-3 py-1">Đón khách</span>
              </div>
            </div>

            <div className="rounded-[28px] bg-white border border-[#cbe5f5] p-6 sm:p-8 shadow-xs">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#e0e7ff] text-[#4f46e5]">
                <Moon className="size-6" />
              </div>
              <h3 className="mt-5 text-2xl font-black text-[#10304f] font-serif">
                Ban đêm thanh bình
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#527797]">
                Ánh đèn lồng ấm áp thắp sáng các ô cửa sổ, sao trời lấp lánh phản chiếu trên biển mây tĩnh lặng, mang lại cảm giác an yên sau ngày dài.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-[#4f46e5]">
                <span className="rounded-full bg-[#eef2ff] px-3 py-1">Thắp đèn</span>
                <span className="rounded-full bg-[#eef2ff] px-3 py-1">Ngắm sao</span>
                <span className="rounded-full bg-[#eef2ff] px-3 py-1">Thư giãn</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SECTION: Nền tảng & FAQ */}
      <section id="nen-tang" className="py-12 sm:py-20 bg-[#f7fbfe] border-t border-[#d8ebf7]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs mb-3">
              <Leaf className="size-3.5 text-emerald-600" />
              THÔNG TIN GAME & HỎI ĐÁP
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#10304f] font-serif tracking-tight leading-tight">
              Sẵn sàng đón bạn lên những tầng mây
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#386284] leading-relaxed">
              Thị Trấn Mây là game thư giãn đang hoạt động với mùa vụ, sự kiện và cộng đồng cư dân trên những tầng mây.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-12 items-stretch">
            {/* Left Card: Nền tảng hỗ trợ */}
            <div className="lg:col-span-5 rounded-3xl bg-white border border-[#cce4f5] p-6 sm:p-8 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-black text-[#10304f] font-serif flex items-center gap-2">
                  <Smartphone className="size-5 text-[#0f828a]" />
                  <span>Nền tảng hỗ trợ</span>
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-[#587e9e] leading-relaxed">
                  Trải nghiệm êm dịu, đồng bộ liền mạch trên mọi thiết bị bạn yêu thích.
                </p>

                <div className="mt-6 space-y-4">
                  <div className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-[#f2f8fc] border border-sky-100 hover:border-[#0f828a]/40 transition-colors">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0f828a] shadow-xs border border-sky-100">
                      <Smartphone className="size-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm sm:text-base text-[#10304f]">Ứng dụng Di động</h4>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">Đang hoạt động</span>
                      </div>
                      <p className="mt-1 text-xs text-[#527797] leading-relaxed">
                        Tối ưu cho những phiên chơi ngắn, dễ dàng chăm sóc vườn và ghé thăm bạn bè.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-[#f2f8fc] border border-sky-100 hover:border-[#0f828a]/40 transition-colors">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0f828a] shadow-xs border border-sky-100">
                      <Globe className="size-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm sm:text-base text-[#10304f]">Trình duyệt Web</h4>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">Đang hoạt động</span>
                      </div>
                      <p className="mt-1 text-xs text-[#527797] leading-relaxed">
                        Theo dõi lịch hoạt động và thư viện thế giới trên PC/Laptop với khung cảnh trọn vẹn.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-[#f2f8fc] border border-sky-100 hover:border-[#0f828a]/40 transition-colors">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0f828a] shadow-xs border border-sky-100">
                      <Cloud className="size-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm sm:text-base text-[#10304f]">Lưu trữ Đám mây</h4>
                        <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-bold text-sky-800">Đồng bộ</span>
                      </div>
                      <p className="mt-1 text-xs text-[#527797] leading-relaxed">
                        Tiến trình được liên kết với tài khoản ZENX GO, chơi tiếp tục mọi lúc mọi nơi.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-sky-100 flex items-center justify-between text-xs text-[#7395af]">
                <span>Trạng thái: <strong className="text-[#10304f]">Đang hoạt động</strong></span>
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">ZENX GO Ecosystem</span>
              </div>
            </div>

            {/* Right Card: FAQ */}
            <div className="lg:col-span-7 rounded-3xl bg-white border border-[#cce4f5] p-6 sm:p-8 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-black text-[#10304f] font-serif flex items-center gap-2">
                  <HelpCircle className="size-5 text-[#0f828a]" />
                  <span>Về game & Câu hỏi thường gặp</span>
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-[#587e9e] leading-relaxed mb-6">
                  Những giải đáp chi tiết về định hướng và quá trình xây dựng thế giới Thị Trấn Mây.
                </p>

                <div className="space-y-3.5">
                  {FAQS.map((faq) => {
                    const isOpen = !!openFaqs[faq.id];
                    return (
                      <div
                        key={faq.id}
                        className="rounded-2xl bg-[#f7fbfe] border border-sky-100/90 overflow-hidden transition-all duration-200 hover:border-sky-200 shadow-2xs"
                      >
                        <button
                          type="button"
                          onClick={() => toggleFaq(faq.id)}
                          className="flex w-full items-center justify-between p-4 sm:p-5 text-left font-bold text-xs sm:text-sm text-[#10304f] cursor-pointer hover:text-[#0f828a] transition-colors"
                        >
                          <span className="font-bold pr-3">{faq.question}</span>
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white border border-sky-100 shadow-2xs">
                            <ChevronDown
                              className={`size-4 text-[#0f828a] transition-transform duration-200 ${
                                isOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-5 text-xs sm:text-sm text-[#466a88] leading-relaxed border-t border-sky-100/60 pt-3 bg-white/40">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-sky-100 flex items-center justify-between text-xs text-[#7395af]">
                <span>Cần hỗ trợ thêm?</span>
                <Link href={portalUrl('/support')} className="text-[#0f828a] hover:underline font-semibold">
                  Gửi câu hỏi tới đội ngũ →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. SECTION: Development Updates */}
      {game.articles.length ? <section id="nhat-ky" className="py-10 sm:py-16"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0f828a]">Nhật ký vận hành</p><h2 className="mt-3 text-2xl font-black text-[#10304f] font-serif sm:text-3xl">Những ghi chú từ thị trấn</h2></div><Link href={portalUrl('/news?game=thi-tran-may')} className="hidden items-center gap-2 text-xs font-bold text-[#0f828a] sm:inline-flex">Xem tất cả <ArrowRight className="size-4" /></Link></div><div className="mt-7 grid gap-5 md:grid-cols-3">{game.articles.slice(0, 3).map((article) => <Link key={article.slug} href={gameUrl(game.subdomain, `/tin-tuc/${article.slug}`)} className="group overflow-hidden rounded-3xl border border-[#cbe5f5] bg-white shadow-xs transition-all hover:-translate-y-1 hover:shadow-lg"><div className="aspect-[16/9] overflow-hidden bg-[#d9effb]">{article.coverImageUrl ? <img src={article.coverImageUrl} alt={article.title} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" /> : null}</div><div className="p-5"><p className="text-[11px] font-bold uppercase tracking-wider text-[#0f828a]">{article.category.replaceAll('_', ' ')}</p><h3 className="mt-3 font-bold text-[#10304f]">{article.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-[#527797]">{article.excerpt}</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#0f828a]">Đọc bài viết <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span></div></Link>)}</div><Link href={portalUrl('/news?game=thi-tran-may')} className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-[#0f828a] sm:hidden">Xem tất cả bài viết <ArrowRight className="size-4" /></Link></div></section> : null}

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
                  Khám phá thêm những thế giới đang hoạt động trong hệ sinh thái ZENX GO.
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
