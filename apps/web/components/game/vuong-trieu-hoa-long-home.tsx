'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Shield,
  Flame,
  Castle,
  Swords,
  Crown,
  Smartphone,
  Globe,
  Sparkles,
  ChevronRight,
  X,
  Users,
  Compass,
} from 'lucide-react';
import { gameUrl, portalUrl } from '@/lib/domain';
import { useGame } from '@/components/game/game-context';
import { formatCategoryLabel } from '@/lib/games-data';

const GALLERY_ITEMS = [
  {
    id: 'dragon',
    title: 'Long Thần Thức Tỉnh',
    subtitle: 'Thực thể nguyên tố lửa và sức mạnh tối thượng',
    fullSrc: '/images/games/vuong-trieu-hoa-long/detail-v1/dragon.webp',
    thumbSrc: '/images/games/vuong-trieu-hoa-long/detail-v1/dragon-thumb.webp',
    alt: 'Hỏa long thức tỉnh trên đỉnh núi lửa',
    description: 'Những con rồng đầu tiên của Vương Triều Hỏa Long được tạo hình như các thực thể có lịch sử và cá tính riêng, mang lại lợi thế chiến thuật đảo ngược cục diện trận đánh.',
  },
  {
    id: 'fortress',
    title: 'Pháo Đài & Thành Trì',
    subtitle: 'Hệ thống phòng thủ và kiến trúc vương triều',
    fullSrc: '/images/games/vuong-trieu-hoa-long/detail-v1/fortress.webp',
    thumbSrc: '/images/games/vuong-trieu-hoa-long/detail-v1/fortress-thumb.webp',
    alt: 'Pháo đài kiên cố giữa thung lũng đá và nham thạch',
    description: 'Bản đồ chiến thuật được xây dựng xoay quanh các điểm nghẽn, tuyến tiếp tế và vị trí phòng thủ có thể thay đổi linh hoạt theo từng mùa giải.',
  },
  {
    id: 'battlefield',
    title: 'Chiến Địa Rực Lửa',
    subtitle: 'Nơi các liên minh tranh đoạt ngai vàng',
    fullSrc: '/images/games/vuong-trieu-hoa-long/detail-v1/battlefield.webp',
    thumbSrc: '/images/games/vuong-trieu-hoa-long/detail-v1/battlefield-thumb.webp',
    alt: 'Chiến trường liên minh rực lửa trong đêm',
    description: 'Chiến trường quy mô lớn nơi hàng trăm vương triều cùng phối hợp tấn công, chiếm lĩnh cứ điểm và bảo vệ long mạch.',
  },
];

const PILLARS = [
  {
    number: '01',
    title: 'Long Thần & Nguyên Tố',
    desc: 'Thuần hóa rồng thiêng, kết hợp kỹ năng nguyên tố lửa, dung nham và sấm sét để định hình chiến trường.',
    icon: Flame,
  },
  {
    number: '02',
    title: 'Xây Dựng Pháo Đài',
    desc: 'Thiết kế bố cục thành trì, củng cố phòng tuyến và tối ưu chuỗi cung ứng tài nguyên phục vụ chiến tranh.',
    icon: Castle,
  },
  {
    number: '03',
    title: 'Liên Minh Vương Quyền',
    desc: 'Gia nhập bang hội, hoạch định chiến lược chung và chia sẻ quyền kiểm soát các cứ điểm huyết mạch.',
    icon: Swords,
  },
];

export function VuongTrieuHoaLongHome() {
  const game = useGame();
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; title: string } | null>(null);

  const activeItem = GALLERY_ITEMS[activeGalleryIndex] ?? GALLERY_ITEMS[0];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#0b0b0a] text-[#ead8b5] min-h-screen selection:bg-[#c85a17]/30 selection:text-white font-sans overflow-x-hidden">
      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 z-50 size-11 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
            aria-label="Đóng ảnh"
          >
            <X className="size-6" />
          </button>
          <div className="relative max-w-5xl max-h-[85vh] overflow-hidden rounded-2xl border border-amber-500/30 shadow-2xl">
            <img
              src={lightboxImage.src}
              alt={lightboxImage.title}
              className="max-h-[85vh] w-auto object-contain"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 text-center text-amber-200 text-sm font-semibold">
              {lightboxImage.title}
            </div>
          </div>
        </div>
      )}

      {/* 1. HERO SECTION */}
      <section className="relative isolate overflow-hidden min-h-[580px] sm:min-h-[640px] lg:h-[calc(100vh-80px)] lg:min-h-[660px] lg:max-h-[840px] flex items-center bg-[#070706]">
        {/* Full-bleed Hero Artwork */}
        <div className="absolute inset-0 -z-20 overflow-hidden">
          <picture>
            <source
              media="(max-width: 767px)"
              srcSet="/images/games/vuong-trieu-hoa-long/detail-v1/hero-mobile.webp"
            />
            <img
              src="/images/games/vuong-trieu-hoa-long/detail-v1/hero.webp"
              alt="Vương Triều Hỏa Long - Long Thần Thức Tỉnh"
              className="size-full object-cover object-[70%_center] sm:object-center contrast-105 brightness-100"
              fetchPriority="high"
            />
          </picture>
        </div>

        {/* Cinematic Gradient Overlays */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0b0b0a]/95 via-[#0b0b0a]/75 via-45% to-transparent pointer-events-none hidden sm:block" />
        <div className="block sm:hidden absolute inset-0 -z-10 bg-gradient-to-t from-[#0b0b0a] via-[#0b0b0a]/80 via-60% to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-24 -z-10 bg-gradient-to-t from-[#0b0b0a] to-transparent pointer-events-none" />

        {/* Ambient Ember Glow */}
        <div className="absolute top-1/3 left-10 size-72 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Content */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12 py-12 sm:py-16">
          <div className="max-w-xl lg:max-w-2xl">
            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-amber-950/80 border border-amber-500/50 text-amber-400 backdrop-blur-md shadow-lg">
                <Crown className="size-3.5" />
                CHIẾN THUẬT SLG • ĐANG HOẠT ĐỘNG
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-[#1e1510] border border-[#5c3a1e] text-[#e57c23]">
                <Flame className="size-3 fill-current" />
                ĐANG VẬN HÀNH
              </span>
            </div>

            {/* Game Title */}
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-[1.08] drop-shadow-lg">
              VƯƠNG TRIỀU <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-[#e57c23]">
                HỎA LONG
              </span>
            </h1>

            {/* Slogan */}
            <p className="mt-3 sm:mt-4 text-base sm:text-xl font-medium text-amber-100/90 tracking-wide drop-shadow-sm font-serif">
              {game.tagline}
            </p>

            {/* Synopsis */}
            <p className="mt-2.5 text-xs sm:text-sm text-[#c5b597] leading-relaxed max-w-lg">
              Game chiến thuật mô phỏng thế giới thời trung cổ thần thoại, nơi ngọn lửa rồng thiêng và tham vọng vương quyền định hình cục diện các cuộc chiến tranh liên minh vĩ đại.
            </p>

            {/* CTA Buttons */}
            <div className="mt-7 sm:mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => scrollToSection('gioi-thieu')}
                className="inline-flex h-11 sm:h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#c85a17] to-[#a53b13] hover:from-[#d96620] hover:to-[#b74316] px-6 sm:px-8 text-xs sm:text-sm font-bold text-white shadow-xl shadow-amber-950/60 active:scale-98 transition-all cursor-pointer"
              >
                <span>Khám phá thế giới</span>
                <ArrowRight className="size-4" />
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('chien-truong')}
                className="inline-flex h-11 sm:h-12 items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-black/40 hover:bg-black/60 px-5 sm:px-7 text-xs sm:text-sm font-bold text-amber-200 backdrop-blur-md shadow-md transition-all active:scale-98 cursor-pointer"
              >
                <Castle className="size-4 text-amber-400" />
                <span>Xem chiến trường</span>
              </button>

              <Link
                href={portalUrl('/')}
                className="inline-flex h-11 sm:h-12 items-center justify-center gap-1.5 text-xs font-semibold text-[#a6967a] hover:text-amber-300 px-3 transition-colors"
              >
                <span>Về ZENX Portal</span>
                <ChevronRight className="size-3.5" />
              </Link>
            </div>

            {/* Platforms indicator */}
            <div className="mt-8 flex items-center gap-3 text-xs text-[#9d8a6b]">
              <span className="font-semibold uppercase tracking-wider text-amber-500/90 text-[10px]">NỀN TẢNG:</span>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1"><Smartphone className="size-3.5 text-amber-400" /> Mobile</span>
                <span className="text-amber-500/40">•</span>
                <span className="inline-flex items-center gap-1"><Globe className="size-3.5 text-amber-400" /> Web</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SECTION: VỀ VƯƠNG TRIỀU HỎA LONG (3 TRỤ CỘT CHIẾN THUẬT) */}
      <section id="gioi-thieu" className="py-16 sm:py-24 border-t border-[#251f19] relative bg-[#0e0e0c]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          {/* Section Header */}
          <div className="max-w-3xl mb-12 sm:mb-16">
            <div className="flex items-center gap-2 mb-2.5">
              <Flame className="size-4 text-[#e57c23]" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#e57c23]">
                DƯỚI BÓNG LONG THẦN
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
              Quyền lực được đúc từ ngọn lửa và lòng quả cảm
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[#baa98a] leading-relaxed">
              Mỗi quyết định từ việc nuôi dưỡng rồng chiến, củng cố thành trì cho tới liên minh lãnh thổ đều là chìa khóa định đoạt sự hưng thịnh của vương triều.
            </p>
          </div>

          {/* 3 Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.number}
                  className="group relative rounded-2xl border border-[#2d2218] bg-gradient-to-b from-[#181410] to-[#120f0c] p-6 sm:p-8 hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-amber-950/70 border border-amber-500/30 text-amber-400 group-hover:scale-110 transition-transform">
                      <Icon className="size-6" />
                    </div>
                    <span className="font-serif text-2xl font-black text-amber-500/30 group-hover:text-amber-500/60 transition-colors">
                      {pillar.number}
                    </span>
                  </div>

                  <h3 className="font-serif text-lg sm:text-xl font-bold text-white mb-2.5 group-hover:text-amber-200 transition-colors">
                    {pillar.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#baa98a] leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Featured Fortress Artwork Banner */}
          <div className="mt-12 sm:mt-16 rounded-3xl overflow-hidden border border-[#352518] bg-[#14100c] grid grid-cols-1 lg:grid-cols-12 shadow-2xl">
            <div className="lg:col-span-7 relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto overflow-hidden">
              <img
                src="/images/games/vuong-trieu-hoa-long/detail-v1/fortress.webp"
                alt="Pháo đài Vương Triều Hỏa Long"
                className="size-full object-cover object-center contrast-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-transparent via-transparent to-[#14100c] pointer-events-none" />
            </div>

            <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-center">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#e57c23] mb-2">
                HỆ THỐNG THỦ THÀNH & TÀI NGUYÊN
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-3 leading-snug">
                Pháo đài là trái tim của vương triều
              </h3>
              <p className="text-xs sm:text-sm text-[#baa98a] leading-relaxed mb-6">
                Bố trí cổng thành, kho lương và tháp bắn tỉa theo địa hình thực tế để tạo nên những cạm bẫy chiến thuật khiến bất kỳ đội quân xâm lược nào cũng phải chùn bước.
              </p>
              <div className="flex items-center gap-4 text-xs font-semibold text-amber-300">
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="size-4 text-amber-500" />
                  Độ bền phòng thủ
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Compass className="size-4 text-amber-500" />
                  Địa hình biến đổi
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION: CHIẾN TRƯỜNG & THẾ GIỚI (INTERACTIVE ARTWORK SHOWCASE) */}
      <section id="chien-truong" className="py-16 sm:py-24 border-t border-[#251f19] bg-[#090908] relative">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#e57c23]">
              THƯ VIỆN THẾ GIỚI HỎA LONG
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mt-2">
              Khám phá không gian Hỏa Long
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#baa98a]">
              Chọn từng khung cảnh để xem chi tiết chiến trường, thành trì và thế giới rồng lửa.
            </p>
          </div>

          {/* Interactive Artwork Display */}
          <div className="rounded-3xl overflow-hidden border border-[#3b2a1c] bg-[#120e0b] shadow-2xl">
            {/* Main Active Visual Frame */}
            <div
              className="relative aspect-[16/9] w-full overflow-hidden cursor-pointer group"
              onClick={() => setLightboxImage({ src: activeItem.fullSrc, title: activeItem.title })}
            >
              <img
                key={activeItem.id}
                src={activeItem.fullSrc}
                alt={activeItem.alt}
                className="size-full object-cover object-center transition-all duration-700 group-hover:scale-103"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

              {/* Artwork Info Overlay at Bottom */}
              <div className="absolute bottom-0 inset-x-0 p-5 sm:p-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="max-w-xl">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#e57c23]">
                    {activeItem.subtitle}
                  </span>
                  <h3 className="font-serif text-xl sm:text-3xl font-bold text-white mt-1">
                    {activeItem.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[#c7b799] line-clamp-2 sm:line-clamp-none">
                    {activeItem.description}
                  </p>
                </div>

                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-xs font-bold text-white shrink-0 group-hover:bg-amber-600/80 transition-colors">
                  <span>Xem phóng to</span>
                  <Sparkles className="size-3.5 text-amber-300" />
                </span>
              </div>
            </div>

            {/* Thumbnail Selectors Strip */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-5 bg-[#17130f] border-t border-[#291c13]">
              {GALLERY_ITEMS.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveGalleryIndex(idx)}
                  className={`relative rounded-xl overflow-hidden border-2 text-left transition-all cursor-pointer ${
                    idx === activeGalleryIndex
                      ? 'border-[#e57c23] shadow-lg scale-[1.02]'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="aspect-[16/9] w-full overflow-hidden">
                    <img
                      src={item.thumbSrc}
                      alt={item.title}
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="p-2 sm:p-2.5 bg-[#0f0c0a]">
                    <h4 className="text-[11px] sm:text-xs font-bold text-white truncate">
                      {item.title}
                    </h4>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION: NHẬT KÝ PHÁT TRIỂN & BÀI VIẾT (ARTICLE GRID) */}
      {game.articles.length > 0 && (
        <section id="tin-tuc" className="py-16 sm:py-24 border-t border-[#251f19] bg-[#0c0c0a]">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-12">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#e57c23]">
                  NHẬT KÝ THIẾT KẾ
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight mt-1.5">
                  Tiến độ & Bản tin mới nhất
                </h2>
              </div>

              <Link
                href={gameUrl(game.subdomain, '/tin-tuc')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
              >
                <span>Xem tất cả bài viết</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {game.articles.slice(0, 3).map((article) => (
                <Link
                  key={article.slug}
                  href={gameUrl(game.subdomain, `/tin-tuc/${article.slug}`)}
                  className="group rounded-2xl overflow-hidden border border-[#2d2218] bg-[#14100c] hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1 shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-[16/9] w-full overflow-hidden relative">
                      {article.coverImageUrl ? (
                        <img
                          src={article.coverImageUrl}
                          alt={article.title}
                          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="size-full bg-slate-900" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#14100c] via-transparent to-transparent pointer-events-none" />
                    </div>

                    <div className="p-5 sm:p-6">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#e57c23]">
                        {formatCategoryLabel(article.category)}
                      </span>

                      <h3 className="font-serif text-base sm:text-lg font-bold text-white mt-1.5 group-hover:text-amber-300 transition-colors line-clamp-2">
                        {article.title}
                      </h3>

                      <p className="mt-2 text-xs text-[#baa98a] leading-relaxed line-clamp-2">
                        {article.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 sm:px-6 pb-5 pt-0 flex items-center text-xs font-semibold text-amber-400 group-hover:text-amber-300">
                    <span>Đọc chi tiết</span>
                    <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. SECTION: CTA BANNER (THỐNG LĨNH CHIẾN TRƯỜNG) */}
      <section className="py-16 sm:py-20 border-t border-[#251f19] bg-[#070706]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="relative rounded-3xl overflow-hidden border border-[#3b2a1c] bg-gradient-to-b from-[#18110b] via-[#100b07] to-[#080604] p-8 sm:p-14 lg:p-16 text-center shadow-2xl">
            {/* Background Embers Artwork */}
            <div className="absolute inset-0 opacity-40 pointer-events-none overflow-hidden">
              <img
                src="/images/games/vuong-trieu-hoa-long/detail-v1/cta-embers.webp"
                alt=""
                className="size-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080604] via-transparent to-[#18110b]" />
            </div>

            {/* Ambient Radial Flame */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-72 sm:size-96 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold bg-amber-950/90 border border-amber-500/50 text-amber-300 backdrop-blur-md shadow-lg mb-4">
                <Crown className="size-3.5" />
                CẬP NHẬT VẬN HÀNH
              </span>

              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Sẵn sàng thống lĩnh <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-[#e57c23]">
                  Vương Triều Hỏa Long?
                </span>
              </h2>

              <p className="mt-3.5 text-xs sm:text-sm text-[#d4c3a3] leading-relaxed max-w-lg">
                Tạo tài khoản ZENX GO để theo dõi lịch mùa, phần thưởng và những cập nhật mới nhất của Vương Triều Hỏa Long.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
                <Link
                  href={portalUrl('/auth/register')}
                  className="w-full sm:w-auto h-11 sm:h-12 px-8 rounded-xl bg-gradient-to-r from-[#c85a17] to-[#a53b13] hover:from-[#d96620] hover:to-[#b74316] text-white font-bold text-xs sm:text-sm shadow-xl shadow-amber-950/60 flex items-center justify-center gap-2 active:scale-98 transition-all"
                >
                  <span>Tạo tài khoản ZENX</span>
                  <ArrowRight className="size-4" />
                </Link>

                <Link
                  href={portalUrl('/community')}
                  className="w-full sm:w-auto h-11 sm:h-12 px-6 rounded-xl bg-black/60 hover:bg-black/80 border border-amber-500/30 text-amber-200 font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 backdrop-blur-md transition-all"
                >
                  <Users className="size-4 text-amber-400" />
                  <span>Tham gia cộng đồng</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
