'use client';

import Link from 'next/link';
import { Crown, Gift, Headphones, Wallet } from 'lucide-react';
import { ZenxCoinGoldIcon } from '@/components/icons';

const UTILITY_ITEMS = [
  {
    id: 'topup',
    title: 'Nạp ZENX Coin',
    subtitle: 'Nạp nhanh, nhận ngay',
    href: '/payment',
    icon: (
      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100/80 group-hover:scale-105 transition-transform">
        <ZenxCoinGoldIcon className="size-6" />
      </div>
    ),
  },
  {
    id: 'wallet',
    title: 'Ví ZENX',
    subtitle: 'Quản lý Coin dễ dàng',
    href: '/wallet',
    icon: (
      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[#00873E] border border-emerald-100/80 group-hover:scale-105 transition-transform">
        <Wallet className="size-5.5" />
      </div>
    ),
  },
  {
    id: 'events',
    title: 'Sự kiện nổi bật',
    subtitle: 'Quà tặng mỗi ngày',
    href: '/events',
    icon: (
      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 border border-rose-100/80 group-hover:scale-105 transition-transform">
        <Gift className="size-5.5" />
      </div>
    ),
  },
  {
    id: 'vip',
    title: 'VIP & Ưu đãi',
    subtitle: 'Đặc quyền hấp dẫn',
    href: '/rewards',
    icon: (
      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100/80 group-hover:scale-105 transition-transform">
        <Crown className="size-5.5" />
      </div>
    ),
  },
  {
    id: 'support',
    title: 'Hỗ trợ 24/7',
    subtitle: 'Luôn sẵn sàng',
    href: '/support',
    icon: (
      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 border border-teal-100/80 group-hover:scale-105 transition-transform">
        <Headphones className="size-5.5" />
      </div>
    ),
  },
];

export function QuickUtilityStrip() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 relative z-30 pb-4">
      <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-3.5 sm:p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          {UTILITY_ITEMS.map((item, idx) => (
            <Link
              key={item.id}
              href={item.href}
              className={`group flex items-center gap-2.5 sm:gap-3.5 p-2 sm:p-2.5 rounded-2xl hover:bg-slate-50/90 transition-all min-w-0 ${
                idx !== 0 ? 'lg:border-l lg:border-slate-100 lg:pl-4' : ''
              } ${idx === 4 ? 'col-span-2 sm:col-span-1' : ''}`}
            >
              {item.icon}
              <div className="min-w-0 flex-1">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#00873E] transition-colors truncate">
                  {item.title}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                  {item.subtitle}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
