'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import { gameUrl } from '@/lib/domain';

export function TopAnnouncementRibbon() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative z-50 bg-gradient-to-r from-[#005c2a] via-[#00873E] to-[#005c2a] text-white text-xs font-semibold py-2 px-4 shadow-sm animate-in slide-in-from-top-1 duration-300">
      <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center justify-center gap-2 text-center text-[11px] sm:text-xs">
          <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
            <Sparkles className="size-3" />
            SỰ KIỆN ALPHA TEST
          </span>
          <span className="truncate">
            Đăng ký sớm <strong>Lục Địa Đam Mê</strong> để nhận <strong>1,000 ZENX Coin</strong> & Cánh Ánh Sáng!
          </span>
          <Link
            href={gameUrl('lucdia', '/tin-tuc')}
            className="hidden sm:inline-flex items-center gap-1 underline underline-offset-2 hover:text-emerald-200 transition-colors font-bold ml-1"
          >
            <span>Tham gia ngay</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="flex size-5 shrink-0 items-center justify-center rounded-md text-white/80 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
          aria-label="Đóng thông báo"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
