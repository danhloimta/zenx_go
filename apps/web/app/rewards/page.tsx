import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Coins,
  Crown,
  Gift,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  WalletCards
} from 'lucide-react';
import type { Metadata } from 'next';
import { PortalPageLayout } from '@/components/portal/portal-page-layout';
import { getPortalGames } from '@/lib/game-api';

export const metadata: Metadata = {
  title: 'VIP & Đặc quyền thành viên | ZENX GO',
  description: 'Khám phá các cấp bậc VIP, quà tân thủ và chính sách ưu đãi ZENX Coin dành riêng cho thành viên hệ sinh thái.',
};

const VIP_TIERS = [
  {
    tier: 'Thành viên',
    color: 'from-slate-100 to-slate-200 text-slate-800 border-slate-300',
    badgeBg: 'bg-slate-100 text-slate-700',
    minSpend: '0 Coin',
    perks: [
      'Tham gia tất cả thế giới game ZENX GO',
      'Nhận giftcode tân thủ khi đăng ký sớm',
      'Hỗ trợ kỹ thuật tiêu chuẩn qua Ticket',
    ],
  },
  {
    tier: 'VIP Đồng',
    color: 'from-amber-100/80 to-amber-200/90 text-amber-900 border-amber-300',
    badgeBg: 'bg-amber-100 text-amber-800',
    minSpend: '5,000 Coin',
    perks: [
      'Tất cả quyền lợi của Thành viên',
      'Tặng +2% giá trị nạp Coin định kỳ',
      'Quyền truy cập kênh Discord VIP',
      'Khung avatar VIP Đồng độc quyền',
    ],
  },
  {
    tier: 'VIP Bạc',
    color: 'from-sky-100 to-slate-200 text-slate-900 border-sky-300',
    badgeBg: 'bg-sky-100 text-sky-800',
    minSpend: '20,000 Coin',
    perks: [
      'Tất cả quyền lợi của VIP Đồng',
      'Tặng +5% giá trị nạp Coin định kỳ',
      'Ưu tiên mời tham gia Alpha/Beta Test sớm',
      'Quà tri ân sinh nhật tài khoản',
    ],
  },
  {
    tier: 'VIP Vàng',
    color: 'from-amber-200 via-amber-300 to-yellow-400 text-amber-950 border-amber-400 shadow-md',
    badgeBg: 'bg-amber-400 text-amber-950',
    minSpend: '100,000 Coin',
    featured: true,
    perks: [
      'Tất cả quyền lợi của VIP Bạc',
      'Tặng +8% giá trị nạp Coin định kỳ',
      'Hỗ trợ chăm sóc khách hàng 1-1 riêng',
      'Gói quà tặng vật phẩm độc bản hàng quý',
      'Tên nhân vật có hiệu ứng hào quang vàng',
    ],
  },
];

const REWARD_BENEFITS = [
  {
    icon: Gift,
    title: 'Quà tân thủ đăng ký sớm',
    desc: 'Nhận ngay Cánh Thiên Thần và 1,000 ZENX Coin tân thủ khi tham gia sự kiện mở rộng thế giới Lục Địa Đam Mê.',
    actionText: 'Xem sự kiện',
    actionHref: '/events',
  },
  {
    icon: WalletCards,
    title: 'Ưu đãi ví ZENX Coin',
    desc: 'Hệ thống chiết khấu khi nạp tích lũy và chuyển đổi liền mạch giữa tất cả các game mà không phát sinh phụ phí.',
    actionText: 'Nạp Coin ngay',
    actionHref: '/payment',
  },
  {
    icon: ShieldCheck,
    title: 'Bảo mật 2 lớp & An toàn',
    desc: 'Bảo vệ số dư Coin và tài khoản game an toàn tuyệt đối với xác thực đa yếu tố cùng thông báo biến động số dư tức thời.',
    actionText: 'Bảo mật tài khoản',
    actionHref: '/account/security',
  },
];

export default async function RewardsPage() {
  const games = await getPortalGames();

  return (
    <PortalPageLayout games={games}>
      <div className="min-h-screen bg-[#f8fafc] px-4 py-10 sm:px-6 lg:px-8 sm:py-14">
        <div className="mx-auto max-w-7xl">
          {/* Hero Header Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-amber-200/80 bg-gradient-to-br from-[#fffaf0] via-white to-emerald-50/50 p-8 sm:p-12 lg:p-14 shadow-sm">
            <div className="relative z-10 max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-800 shadow-2xs mb-4">
                <Crown className="size-4 text-amber-600" /> VIP & TRUNG TÂM ƯU ĐÃI
              </span>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                Đặc quyền thành viên & Ưu đãi
              </h1>

              <p className="mt-3.5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                Khám phá hệ thống cấp bậc VIP, các phần quà tặng tân thủ và ưu đãi giá trị cao khi sử dụng ví ZENX Coin trong toàn bộ hệ sinh thái.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  href="/payment"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#00873E] px-6 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-[#007033] transition-all"
                >
                  <Coins className="size-4" /> Nạp Coin nhận ưu đãi
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-xs sm:text-sm font-bold text-slate-700 shadow-xs hover:border-[#00873E]/40 hover:text-[#00873E] transition-all"
                >
                  <Gift className="size-4" /> Đăng ký nhận quà tân thủ
                </Link>
              </div>
            </div>

            {/* Sparkles Background Accent */}
            <Sparkles className="pointer-events-none absolute -bottom-10 right-8 size-64 text-amber-200/50 hidden md:block" strokeWidth={0.8} />
          </div>

          {/* Benefits 3 Columns */}
          <section className="mt-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-slate-200/80">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#00873E]">QUYỀN LỢI CỐT LÕI</span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                  Đồng hành cùng hành trình của bạn
                </h2>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {REWARD_BENEFITS.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={benefit.title}
                    className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-amber-300 flex flex-col justify-between"
                  >
                    <div>
                      <span className="flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 mb-5 group-hover:scale-105 transition-transform border border-amber-100">
                        <Icon className="size-7" />
                      </span>

                      <h3 className="text-lg font-black text-slate-900 tracking-tight">
                        {benefit.title}
                      </h3>

                      <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {benefit.desc}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <Link
                        href={benefit.actionHref}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00873E] hover:underline"
                      >
                        <span>{benefit.actionText}</span>
                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* VIP Tiers Showcase */}
          <section className="mt-16">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-slate-200/80">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">HỆ THỐNG CẤP BẬC</span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                  Bảng đặc quyền VIP Thành viên
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md">
                Tích lũy nạp ZENX Coin để tự động nâng hạng và nhận quyền lợi vĩnh viễn.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {VIP_TIERS.map((tier) => (
                <div
                  key={tier.tier}
                  className={`rounded-3xl border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl flex flex-col justify-between ${
                    tier.featured ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-slate-200'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${tier.badgeBg}`}>
                        {tier.tier}
                      </span>
                      {tier.featured && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-2xs">
                          Phổ biến nhất
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 mb-4">
                      Mốc tích lũy: <strong className="text-slate-900 font-bold">{tier.minSpend}</strong>
                    </p>

                    {/* Perks List */}
                    <ul className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
                      {tier.perks.map((perk) => (
                        <li key={perk} className="flex items-start gap-2 leading-relaxed">
                          <CheckCircle2 className="size-4 text-[#00873E] shrink-0 mt-0.5" />
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <Link
                      href="/payment"
                      className={`inline-flex w-full min-h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-all ${
                        tier.featured
                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-sm'
                          : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                      }`}
                    >
                      <span>Nâng hạng VIP</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Program Status Notice */}
          <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00873E] mb-2">
                <HelpCircle className="size-4" /> MINH BẠCH & THÔNG TIN CHÍNH THỨC
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                Chính sách áp dụng ưu đãi
              </h3>
              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-600">
                Toàn bộ các chiến dịch quà tân thủ, mã giftcode và chính sách tích lũy VIP sẽ được tự động cộng vào tài khoản ZENX GO khi hệ thống chính thức mở cửa. Đội ngũ cam kết minh bạch và công bằng cho mọi thành viên.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link
                href="/events"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#00873E] px-6 text-xs sm:text-sm font-bold text-white hover:bg-[#007033] shadow-xs transition-all"
              >
                <span>Xem sự kiện đang mở</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </PortalPageLayout>
  );
}
