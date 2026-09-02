'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Shield,
  Crosshair,
  Radio,
  Zap,
  Smartphone,
  Globe,
  ChevronRight,
  X,
  Users,
  Sparkles,
  Cpu,
} from 'lucide-react';
import { gameUrl, portalUrl } from '@/lib/domain';
import { useGame } from '@/components/game/game-context';

const ROLES = [
  {
    id: 'assault',
    code: 'CLASS.01 // ASSAULT',
    title: 'Tiên Phong Đột Kích',
    tagline: 'Hỏa lực áp đảo & Cận chiến linh hoạt',
    desc: 'Trang bị giáp phản lực và súng trường xung kích plasma, đột phá các phòng tuyến kiên cố và tạo khoảng trống tác chiến cho toàn đội.',
    img: '/images/games/chien-tuyen-orion/detail-v3-light/role-assault.webp',
    thumb: '/images/games/chien-tuyen-orion/detail-v3-light/role-assault-thumb.webp',
    stats: { firepower: 95, mobility: 85, defense: 75 },
  },
  {
    id: 'recon',
    code: 'CLASS.02 // RECON',
    title: 'Trinh Sát Điện Tử',
    tagline: 'Xạ thủ tầm xa & Phân tích chiến trường',
    desc: 'Sở hữu thiết bị ngụy trang quang học và súng bắn tỉa điện từ trường, vô hiệu hóa mục tiêu trọng yếu và làm mù radar của địch.',
    img: '/images/games/chien-tuyen-orion/detail-v3-light/role-recon.webp',
    thumb: '/images/games/chien-tuyen-orion/detail-v3-light/role-recon-thumb.webp',
    stats: { firepower: 90, mobility: 95, defense: 60 },
  },
  {
    id: 'support',
    code: 'CLASS.03 // SUPPORT',
    title: 'Hỗ Trợ Phòng Thủ',
    tagline: 'Lá chắn năng lượng & Hồi phục cấu trúc',
    desc: 'Triển khai drone phòng thủ, khiên photon và trạm nạp năng lượng di động giúp củng cố cứ điểm và duy trì khả năng chiến đấu bền bỉ.',
    img: '/images/games/chien-tuyen-orion/detail-v3-light/role-support.webp',
    thumb: '/images/games/chien-tuyen-orion/detail-v3-light/role-support-thumb.webp',
    stats: { firepower: 70, mobility: 65, defense: 100 },
  },
];

const LOCATIONS = [
  {
    id: 'orion-belt',
    title: 'Vành Đai Thiên Thể Orion',
    subtitle: 'Mỏ khai thác năng lượng lõi',
    fullSrc: '/images/games/chien-tuyen-orion/detail-v3-light/location-orion-belt.webp',
    thumbSrc: '/images/games/chien-tuyen-orion/detail-v3-light/location-orion-belt-thumb.webp',
    alt: 'Vành đai tiểu hành tinh Orion ngoài không gian',
    desc: 'Địa hình không trọng lực với hàng nghìn khối thiên thạch trôi nổi, nơi các chiến hạm đụng độ trong các trận không chiến nảy lửa.',
  },
  {
    id: 'helix',
    title: 'Trạm Nghiên Cứu Helix',
    subtitle: 'Căn cứ nghiên cứu quỹ đạo',
    fullSrc: '/images/games/chien-tuyen-orion/detail-v3-light/location-helix.webp',
    thumbSrc: '/images/games/chien-tuyen-orion/detail-v3-light/location-helix-thumb.webp',
    alt: 'Trạm không gian Helix trên quỹ đạo hành tinh',
    desc: 'Hành lang chật hẹp và các phòng thí nghiệm công nghệ cao đòi hỏi chiến thuật cận chiến chính xác và khả năng kiểm soát góc hẹp.',
  },
  {
    id: 'anomaly',
    title: 'Vùng Dị Thường Không Gian',
    subtitle: 'Vết nứt không - thời gian bí ẩn',
    fullSrc: '/images/games/chien-tuyen-orion/detail-v3-light/location-anomaly.webp',
    thumbSrc: '/images/games/chien-tuyen-orion/detail-v3-light/location-anomaly-thumb.webp',
    alt: 'Vùng dị thường năng lượng không gian',
    desc: 'Khu vực xảy ra các hiện tượng biến dạng từ trường ngẫu nhiên, thay đổi quỹ đạo đạn và làm gián đoạn liên lạc chiến thuật.',
  },
];

const EQUIPMENTS = [
  {
    id: 'weapon',
    title: 'Vũ Khí Plasma & Động Năng',
    desc: 'Hệ thống súng module đa năng chuyển đổi chế độ bắn tức thì theo tình huống chiến đấu.',
    img: '/images/games/chien-tuyen-orion/detail-v3-light/equipment-weapon.webp',
    icon: Crosshair,
  },
  {
    id: 'armor',
    title: 'Giáp Khung Xương Exoskeleton',
    desc: 'Gia tăng sức bền, tốc độ di chuyển và tích hợp động cơ đẩy phản lực định hướng.',
    img: '/images/games/chien-tuyen-orion/detail-v3-light/equipment-armor.webp',
    icon: Shield,
  },
  {
    id: 'device',
    title: 'Thiết Bị Tác Chiến Điện Tử',
    desc: 'Drone hỗ trợ trinh sát, rada xuyên vật cản và công cụ gây nhiễu sóng tầm xa.',
    img: '/images/games/chien-tuyen-orion/detail-v3-light/equipment-device.webp',
    icon: Cpu,
  },
];

export function ChienTuyenOrionHome() {
  const game = useGame();
  const [activeRoleIndex, setActiveRoleIndex] = useState(0);
  const [activeLocationIndex, setActiveLocationIndex] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; title: string } | null>(null);

  const activeRole = ROLES[activeRoleIndex] ?? ROLES[0];
  const activeLocation = LOCATIONS[activeLocationIndex] ?? LOCATIONS[0];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="bg-[#f8fafc] text-[#0f172a] min-h-screen font-sans antialiased selection:bg-cyan-500/20 selection:text-[#0284c7]">
      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
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
          <div className="relative max-w-5xl max-h-[85vh] overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-900 shadow-2xl">
            <img
              src={lightboxImage.src}
              alt={lightboxImage.title}
              className="max-h-[85vh] w-auto object-contain"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent p-4 text-center text-cyan-200 text-sm font-semibold">
              {lightboxImage.title}
            </div>
          </div>
        </div>
      )}

      {/* 1. HERO SECTION */}
      <section className="relative isolate overflow-hidden min-h-[580px] sm:min-h-[640px] lg:h-[calc(100vh-80px)] lg:min-h-[640px] lg:max-h-[840px] flex items-center bg-[#070b14]">
        {/* Full-bleed Hero Artwork */}
        <div className="absolute inset-0 -z-20 overflow-hidden">
          <picture>
            <source
              media="(max-width: 767px)"
              srcSet="/images/games/chien-tuyen-orion/detail-v3-light/hero-mobile.webp"
            />
            <img
              src="/images/games/chien-tuyen-orion/detail-v3-light/hero.webp"
              alt="Chiến Tuyến Orion - Tác Chiến Không Gian"
              className="size-full object-cover object-[70%_center] sm:object-center brightness-100 contrast-105"
              fetchPriority="high"
            />
          </picture>
        </div>

        {/* Cinematic High-Tech Gradient Overlays */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#070b14]/95 via-[#070b14]/75 via-45% to-transparent pointer-events-none hidden sm:block" />
        <div className="block sm:hidden absolute inset-0 -z-10 bg-gradient-to-t from-[#070b14] via-[#070b14]/80 via-60% to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-24 -z-10 bg-gradient-to-t from-[#f8fafc] to-transparent pointer-events-none" />

        {/* Ambient Cyan Glow */}
        <div className="absolute top-1/4 left-10 size-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Content */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12 py-12 sm:py-16">
          <div className="max-w-xl lg:max-w-2xl">
            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3.5">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-widest bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 backdrop-blur-md shadow-lg">
                <Radio className="size-3.5 animate-pulse text-cyan-400" />
                SYS.ONLINE // DEMO PROTOTYPE
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-[#0d1f35] border border-cyan-800/60 text-cyan-200">
                <Zap className="size-3 fill-current text-cyan-400" />
                SCI-FI TACTICAL SHOOTER
              </span>
            </div>

            {/* Game Title */}
            <h1 className="font-sans text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-[1.08] drop-shadow-md">
              CHIẾN TUYẾN <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-cyan-400 to-blue-500">
                ORION
              </span>
            </h1>

            {/* Slogan */}
            <p className="mt-3 sm:mt-4 text-base sm:text-xl font-bold text-cyan-100/90 tracking-wide drop-shadow-sm font-mono">
              [ TIÊN PHONG KHÔNG GIAN • CHIẾN TRANH LIÊN MINH ]
            </p>

            {/* Synopsis */}
            <p className="mt-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
              Concept game bắn súng chiến thuật khoa học viễn tưởng tốc độ cao, nơi các biệt đội đặc nhiệm trang bị bộ giáp phản lực Exoskeleton tranh giành tài nguyên lõi trong vành đai Orion.
            </p>

            {/* CTA Buttons */}
            <div className="mt-7 sm:mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => scrollToSection('binh-chung')}
                className="inline-flex h-11 sm:h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-6 sm:px-8 text-xs sm:text-sm font-bold text-white shadow-xl shadow-cyan-950/50 active:scale-98 transition-all cursor-pointer"
              >
                <span>Khám phá binh chủng</span>
                <ArrowRight className="size-4" />
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('chien-dia')}
                className="inline-flex h-11 sm:h-12 items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-slate-900/60 hover:bg-slate-900/90 px-5 sm:px-7 text-xs sm:text-sm font-bold text-cyan-200 backdrop-blur-md shadow-md transition-all active:scale-98 cursor-pointer"
              >
                <Crosshair className="size-4 text-cyan-400" />
                <span>Xem chiến trường</span>
              </button>

              <Link
                href={portalUrl('/')}
                className="inline-flex h-11 sm:h-12 items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-300 px-3 transition-colors"
              >
                <span>Về ZENX Portal</span>
                <ChevronRight className="size-3.5" />
              </Link>
            </div>

            {/* Platforms indicator */}
            <div className="mt-8 flex items-center gap-3 text-xs text-slate-400">
              <span className="font-mono font-bold uppercase tracking-wider text-cyan-400/90 text-[10px]">PLATFORMS:</span>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1"><Smartphone className="size-3.5 text-cyan-400" /> Mobile</span>
                <span className="text-cyan-500/40">•</span>
                <span className="inline-flex items-center gap-1"><Globe className="size-3.5 text-cyan-400" /> Web (WebGL)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SECTION: HỆ THỐNG BINH CHỦNG (INTERACTIVE ROLES) */}
      <section id="binh-chung" className="py-16 sm:py-24 border-t border-slate-200 bg-white relative">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          {/* Section Header */}
          <div className="max-w-3xl mb-12 sm:mb-16">
            <div className="flex items-center gap-2 mb-2.5">
              <Crosshair className="size-4 text-cyan-600" />
              <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-cyan-600">
                TACTICAL ROLES // HỆ THỐNG BINH CHỦNG
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Phối hợp tác chiến theo từng vai trò chuyên biệt
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
              Mỗi thành viên trong biệt đội nắm giữ một vị trí chiến lược sống còn, kết hợp công nghệ vũ khí tương lai để kiểm soát hoàn toàn chiến trường.
            </p>
          </div>

          {/* Interactive Role Showcase Container */}
          <div className="rounded-3xl border border-slate-200 bg-[#f8fafc] p-5 sm:p-8 lg:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Role Artwork & Switcher */}
            <div className="lg:col-span-6 flex flex-col items-center">
              <div
                className="relative aspect-[4/3] w-full max-w-md overflow-hidden rounded-2xl bg-slate-950 border border-cyan-500/30 shadow-lg cursor-pointer group"
                onClick={() => setLightboxImage({ src: activeRole.img, title: activeRole.title })}
              >
                <img
                  key={activeRole.id}
                  src={activeRole.img}
                  alt={activeRole.title}
                  className="size-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/80 border border-cyan-500/30 text-[10px] font-mono font-bold text-cyan-300">
                  {activeRole.code}
                </div>
                <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-[11px] text-cyan-200 bg-slate-900/75 backdrop-blur-md px-3 py-1.5 rounded-lg">
                  <span>Bấm để xem phóng to</span>
                  <Sparkles className="size-3.5 text-cyan-400" />
                </div>
              </div>

              {/* Role Selectors */}
              <div className="mt-5 grid grid-cols-3 gap-3 w-full max-w-md">
                {ROLES.map((role, idx) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setActiveRoleIndex(idx)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      idx === activeRoleIndex
                        ? 'border-cyan-500 bg-cyan-50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="block text-xs font-bold text-slate-900 truncate">
                      {role.title.split(' ')[0]} {role.title.split(' ')[1]}
                    </span>
                    <span className="block text-[10px] font-mono text-cyan-700">
                      CLASS.0{idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Role Details & Combat Stats */}
            <div className="lg:col-span-6 flex flex-col justify-center">
              <span className="text-xs font-mono font-bold text-cyan-600 uppercase tracking-wider">
                {activeRole.code}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {activeRole.title}
              </h3>
              <p className="text-sm font-semibold text-cyan-700 mt-1">
                {activeRole.tagline}
              </p>
              <p className="mt-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                {activeRole.desc}
              </p>

              {/* Combat Stats Bars */}
              <div className="mt-6 space-y-3.5 pt-6 border-t border-slate-200">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>HỎA LỰC (FIREPOWER)</span>
                    <span className="font-mono text-cyan-700">{activeRole.stats.firepower}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${activeRole.stats.firepower}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>ĐỘ CƠ ĐỘNG (MOBILITY)</span>
                    <span className="font-mono text-cyan-700">{activeRole.stats.mobility}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${activeRole.stats.mobility}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>GIÁP & PHÒNG THỦ (DEFENSE)</span>
                    <span className="font-mono text-cyan-700">{activeRole.stats.defense}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${activeRole.stats.defense}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION: CHIẾN ĐỊA KHÔNG GIAN (LOCATIONS SHOWCASE) */}
      <section id="chien-dia" className="py-16 sm:py-24 border-t border-slate-200 bg-[#0a0f1d] text-white relative">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-cyan-400">
              SECTOR RECON // CHIẾN ĐỊA KHÔNG GIAN
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mt-2">
              Các tọa độ xung đột ác liệt
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-300">
              Khám phá các trạm không gian và vành đai thiên thể - bối cảnh của những cuộc giao tranh không hồi kết.
            </p>
          </div>

          {/* Interactive Artwork Display */}
          <div className="rounded-3xl overflow-hidden border border-cyan-500/30 bg-slate-900 shadow-2xl">
            {/* Main Active Visual Frame */}
            <div
              className="relative aspect-[16/9] w-full overflow-hidden cursor-pointer group"
              onClick={() => setLightboxImage({ src: activeLocation.fullSrc, title: activeLocation.title })}
            >
              <img
                key={activeLocation.id}
                src={activeLocation.fullSrc}
                alt={activeLocation.alt}
                className="size-full object-cover object-center transition-all duration-700 group-hover:scale-103"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent pointer-events-none" />

              {/* Artwork Info Overlay at Bottom */}
              <div className="absolute bottom-0 inset-x-0 p-5 sm:p-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="max-w-xl">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
                    {activeLocation.subtitle}
                  </span>
                  <h3 className="text-xl sm:text-3xl font-black text-white mt-1">
                    {activeLocation.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-300 line-clamp-2 sm:line-clamp-none">
                    {activeLocation.desc}
                  </p>
                </div>

                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800/80 backdrop-blur-md border border-cyan-500/30 text-xs font-bold text-white shrink-0 group-hover:bg-cyan-600 transition-colors">
                  <span>Phóng to tọa độ</span>
                  <Sparkles className="size-3.5 text-cyan-300" />
                </span>
              </div>
            </div>

            {/* Thumbnail Selectors Strip */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-5 bg-slate-950 border-t border-slate-800">
              {LOCATIONS.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveLocationIndex(idx)}
                  className={`relative rounded-xl overflow-hidden border-2 text-left transition-all cursor-pointer ${
                    idx === activeLocationIndex
                      ? 'border-cyan-400 shadow-lg scale-[1.02]'
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
                  <div className="p-2 sm:p-2.5 bg-slate-900">
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

      {/* 4. SECTION: TRANG BỊ & KHO VŨ KHÍ */}
      <section className="py-16 sm:py-24 border-t border-slate-200 bg-white relative">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-cyan-600">
              ARMORY & TECH // KHO TRANG BỊ
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mt-2">
              Công nghệ tương lai định hình chiến thắng
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {EQUIPMENTS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-[#f8fafc] overflow-hidden shadow-sm hover:border-cyan-500/50 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="aspect-[16/10] w-full overflow-hidden bg-slate-900 relative">
                    <img
                      src={item.img}
                      alt={item.title}
                      className="size-full object-cover"
                    />
                    <div className="absolute top-3 left-3 size-9 rounded-xl bg-slate-900/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <Icon className="size-5" />
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-lg text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. SECTION: NHẬT KÝ PHÁT TRIỂN & BÀI VIẾT */}
      {game.articles.length > 0 && (
        <section id="tin-tuc" className="py-16 sm:py-24 border-t border-slate-200 bg-[#f1f5f9]">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-12">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-cyan-600">
                  TRANSMISSION LOGS // BẢN TIN CHIẾN SỰ
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1.5">
                  Nhật ký phát triển & Cập nhật
                </h2>
              </div>

              <Link
                href={gameUrl(game.subdomain, '/tin-tuc')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-700 hover:text-cyan-800 transition-colors"
              >
                <span>Xem tất cả nhật ký</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {game.articles.slice(0, 3).map((article) => (
                <Link
                  key={article.slug}
                  href={gameUrl(game.subdomain, `/tin-tuc/${article.slug}`)}
                  className="group rounded-2xl overflow-hidden border border-slate-200 bg-white hover:border-cyan-500/50 transition-all duration-300 hover:-translate-y-1 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-[16/9] w-full overflow-hidden relative bg-slate-900">
                      {article.coverImageUrl ? (
                        <img
                          src={article.coverImageUrl}
                          alt={article.title}
                          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : null}
                    </div>

                    <div className="p-5 sm:p-6">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-600">
                        {article.category === 'DEVELOPMENT_UPDATE'
                          ? 'Tiến độ phát triển'
                          : article.category === 'EVENT'
                            ? 'Sự kiện'
                            : 'Thông báo'}
                      </span>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1.5 group-hover:text-cyan-600 transition-colors line-clamp-2">
                        {article.title}
                      </h3>

                      <p className="mt-2 text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {article.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 sm:px-6 pb-5 pt-0 flex items-center text-xs font-semibold text-cyan-600 group-hover:text-cyan-700">
                    <span>Đọc chi tiết</span>
                    <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. SECTION: CTA BANNER */}
      <section className="py-16 sm:py-20 border-t border-slate-800 bg-[#070b14] text-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="relative rounded-3xl overflow-hidden border border-cyan-500/30 bg-gradient-to-b from-[#0d1627] via-[#090e1a] to-[#050810] p-8 sm:p-14 lg:p-16 text-center shadow-2xl">
            {/* Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-72 sm:size-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-mono font-bold bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 backdrop-blur-md shadow-lg mb-4">
                <Radio className="size-3.5 text-cyan-400" />
                JOIN THE FRONTLINE // EARLY ACCESS
              </span>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Sẵn sàng bước vào <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-cyan-400 to-blue-500">
                  Chiến Tuyến Orion?
                </span>
              </h2>

              <p className="mt-3.5 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
                Tạo tài khoản ZENX GO ngay hôm nay để nhận thông báo sớm nhất khi đợt thử nghiệm Closed Beta của Chiến Tuyến Orion chính thức khởi động.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
                <Link
                  href={portalUrl('/auth/register')}
                  className="w-full sm:w-auto h-11 sm:h-12 px-8 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-cyan-950/60 flex items-center justify-center gap-2 active:scale-98 transition-all"
                >
                  <span>Tạo tài khoản ZENX</span>
                  <ArrowRight className="size-4" />
                </Link>

                <Link
                  href={portalUrl('/community')}
                  className="w-full sm:w-auto h-11 sm:h-12 px-6 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-cyan-500/40 text-cyan-200 font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 backdrop-blur-md transition-all"
                >
                  <Users className="size-4 text-cyan-400" />
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
