import Link from 'next/link';
import {
  ArrowRight,
  ExternalLink,
  Gamepad2,
  HeartHandshake,
  Radio,
  ShieldCheck,
  Users
} from 'lucide-react';
import type { Metadata } from 'next';
import { PortalPageLayout } from '@/components/portal/portal-page-layout';
import { getPortalGames } from '@/lib/game-api';

export const metadata: Metadata = {
  title: 'Cộng đồng Game & Kênh chính thức | ZENX GO',
  description: 'Tham gia cộng đồng ZENX GO, kết nối với người chơi khác và đồng hành cùng các thế giới game.',
};

type SocialChannel = {
  name: string;
  tag: string;
  tagColor: string;
  desc: string;
  url?: string;
  stats: string;
  cta: string;
  bg: string;
  iconColor: string;
  borderColor: string;
};

const SOCIAL_CHANNELS: SocialChannel[] = [
  {
    name: 'Discord',
    tag: 'Cộng đồng sôi động nhất',
    tagColor: 'blue',
    desc: 'Trò chuyện voice, tìm đồng đội săn boss, tham gia hoạt động mùa và nhận thông báo trực tiếp từ đội ngũ vận hành.',
    url: process.env.NEXT_PUBLIC_DISCORD_URL,
    stats: '12,500+ Thành viên',
    cta: 'Tham gia Discord',
    bg: 'from-[#5865F2]/10 via-white to-white',
    iconColor: 'text-[#5865F2]',
    borderColor: 'hover:border-[#5865F2]/50',
  },
  {
    name: 'Facebook Group',
    tag: 'Giao lưu & Trao đổi',
    tagColor: 'blue',
    desc: 'Nơi chia sẻ kinh nghiệm chơi game, thảo luận chiến thuật, trao đổi mẹo vặt và tham gia mini-game nhận quà.',
    url: process.env.NEXT_PUBLIC_FACEBOOK_URL,
    stats: '25,000+ Người theo dõi',
    cta: 'Ghé thăm Fanpage',
    bg: 'from-[#1877F2]/10 via-white to-white',
    iconColor: 'text-[#1877F2]',
    borderColor: 'hover:border-[#1877F2]/50',
  },
  {
    name: 'YouTube Channel',
    tag: 'Trailer & Dev Log',
    tagColor: 'red',
    desc: 'Theo dõi trailer, bản tin vận hành tính năng mới, phỏng vấn đội ngũ và hướng dẫn tân thủ.',
    url: process.env.NEXT_PUBLIC_YOUTUBE_URL,
    stats: '45+ Video chất lượng',
    cta: 'Đăng ký kênh',
    bg: 'from-[#FF0000]/10 via-white to-white',
    iconColor: 'text-[#FF0000]',
    borderColor: 'hover:border-[#FF0000]/50',
  },
  {
    name: 'TikTok',
    tag: 'Khoảnh khắc Highlight',
    tagColor: 'purple',
    desc: 'Những pha highlight đỉnh cao, meme hài hước và video ngắn hấp dẫn về các thế giới game ZENX GO.',
    url: process.env.NEXT_PUBLIC_TIKTOK_URL,
    stats: '150,000+ Lượt xem',
    cta: 'Xem trên TikTok',
    bg: 'from-[#000000]/10 via-white to-white',
    iconColor: 'text-slate-900',
    borderColor: 'hover:border-slate-400',
  },
];

const activeSocialChannels = SOCIAL_CHANNELS.filter((channel): channel is SocialChannel & { url: string } => Boolean(channel.url));

const COMMUNITY_PILLARS = [
  {
    icon: HeartHandshake,
    title: 'Gắn kết & Tôn trọng',
    desc: 'Môi trường chơi game văn minh, tôn trọng người chơi khác và không phân biệt cấp bậc.',
  },
  {
    icon: Radio,
    title: 'Lắng nghe phản hồi',
    desc: 'Mọi ý kiến đóng góp cho mùa hiện tại và tính năng mới đều được đội ngũ ghi nhận và phản hồi.',
  },
  {
    icon: ShieldCheck,
    title: 'An toàn & Minh bạch',
    desc: 'Ban quản trị túc trực hỗ trợ 24/7 ngăn chặn hành vi lừa đảo, bảo vệ cộng đồng trong sạch.',
  },
];

export default async function CommunityPage() {
  const games = await getPortalGames();

  return (
    <PortalPageLayout games={games}>
      <div className="min-h-screen bg-[#f8fafc] px-4 py-10 sm:px-6 lg:px-8 sm:py-14">
        <div className="mx-auto max-w-7xl">
          {/* Hero Header Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-emerald-100/80 bg-gradient-to-br from-white via-emerald-50/40 to-sky-50/50 p-8 sm:p-12 lg:p-14 shadow-sm">
            <div className="relative z-10 max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#00873E] shadow-2xs mb-4">
                <Users className="size-4" /> CỘNG ĐỒNG ZENX GO
              </span>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                Cùng trải nghiệm những thế giới đáng nhớ
              </h1>

              <p className="mt-3.5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                Kết nối với hàng chục ngàn người chơi đam mê, theo dõi lịch vận hành và góp tiếng nói trực tiếp cho từng tựa game trong hệ sinh thái.
              </p>
            </div>
          </div>

          {/* Official Channels Grid */}
          <section className="mt-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-slate-200/80">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#00873E]">KÊNH CHÍNH THỨC</span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                  Tham gia cùng cộng đồng
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md">
                Lựa chọn nền tảng bạn thường dùng để kết nối và nhận thông báo mới nhất.
              </p>
            </div>

            {activeSocialChannels.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {activeSocialChannels.map((channel) => (
                <a
                  key={channel.name}
                  href={channel.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`group relative rounded-3xl border border-slate-200 bg-gradient-to-b ${channel.bg} p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${channel.borderColor} flex flex-col justify-between`}
                >
                  <div>
                    {/* Top Stats & Icon */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
                        {channel.stats}
                      </span>
                      <ExternalLink className="size-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
                    </div>

                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      {channel.name}
                    </h3>

                    <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {channel.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#00873E] group-hover:underline">
                      {channel.cta}
                    </span>
                    <ArrowRight className="size-4 text-[#00873E] transition-transform group-hover:translate-x-1" />
                  </div>
                </a>
              ))}
            </div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">Các kênh cộng đồng đang được cập nhật. Vui lòng quay lại sau.</div>}
          </section>

          {/* Game Community Hubs */}
          <section className="mt-16">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-slate-200/80">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#00873E]">HUB THEO GAME</span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                  Chọn thế giới bạn yêu thích
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md">
                Mỗi tựa game đều có không gian thảo luận riêng để bạn giao lưu cùng các đồng minh.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {games.map((game) => (
                <a
                  key={game.slug}
                  href={game.websiteUrl}
                  className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[#00873E]/40 hover:shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3.5 mb-4">
                      {game.assets.avatar ? (
                        <img
                          src={game.assets.avatar}
                          alt={game.title}
                          className="size-12 rounded-2xl object-cover border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#00873E]">
                          <Gamepad2 className="size-6" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-black text-slate-900 truncate group-hover:text-[#00873E] transition-colors">
                          {game.title}
                        </h3>
                        <span className="inline-block text-[11px] font-semibold text-slate-500">
                          {game.categoryDisplay} · {game.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {game.synopsis}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#00873E]">
                    <span>Trang chủ game</span>
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* Community Pillars */}
          <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-sm">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-[#00873E]">TIÊU CHUẨN CỘNG ĐỒNG</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                Nguyên tắc gắn kết bền vững
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {COMMUNITY_PILLARS.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div key={pillar.title} className="rounded-2xl bg-slate-50 p-6 border border-slate-100">
                    <span className="flex size-12 items-center justify-center rounded-xl bg-emerald-100/80 text-[#00873E] mb-4">
                      <Icon className="size-6" />
                    </span>
                    <h3 className="text-base font-black text-slate-900 mb-2">
                      {pillar.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Support CTA Banner */}
          <section className="mt-12 rounded-3xl bg-slate-950 p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="max-w-xl">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Cần hỗ trợ kỹ thuật hoặc báo lỗi?
              </h2>
              <p className="mt-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                Với vấn đề bảo mật tài khoản, nạp Coin hoặc báo cáo lỗi trong game, hãy liên hệ trực tiếp với Trung tâm hỗ trợ ZENX GO để được xử lý nhanh chóng.
              </p>
            </div>

            <Link
              href="/support"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-8 text-xs sm:text-sm font-bold text-slate-950 hover:bg-emerald-400 shadow-md transition-all shrink-0"
            >
              <span>Trung tâm hỗ trợ</span>
              <ArrowRight className="size-4" />
            </Link>
          </section>
        </div>
      </div>
    </PortalPageLayout>
  );
}
