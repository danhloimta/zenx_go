'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import type { PortalAnnouncement } from '@zenx-go/api-client';

export function TopAnnouncementRibbon({ announcement }: { announcement: PortalAnnouncement | null }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !announcement) return null;
  const href = announcement.ctaPath?.startsWith('/') ? announcement.ctaPath : null;

  return (
    <div className="relative z-50 w-full overflow-hidden bg-gradient-to-r from-[#005c2a] via-[#00873E] to-[#005c2a] text-white text-xs font-semibold py-2 px-3 sm:px-4 shadow-sm">
      <div className="mx-auto max-w-7xl flex items-center justify-between gap-2 sm:gap-4 min-w-0">
        <div className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 text-center text-[11px] sm:text-xs min-w-0 overflow-hidden">
          <span className="shrink-0 inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider">
            <Sparkles className="size-2.5 sm:size-3" />
            {announcement.title}
          </span>
          <span className="truncate">
            {announcement.message}
          </span>
          {href && announcement.ctaLabel ? (
            <Link
              href={href}
              className="hidden sm:inline-flex shrink-0 items-center gap-1 underline underline-offset-2 hover:text-emerald-200 transition-colors font-bold ml-1"
            >
              <span>{announcement.ctaLabel}</span>
              <ArrowRight className="size-3" />
            </Link>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-white/80 hover:text-white hover:bg-white/20 transition-all cursor-pointer ml-1"
          aria-label="Đóng thông báo"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
