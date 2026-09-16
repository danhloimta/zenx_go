'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Users,
  FileText,
  CalendarDays,
  Palette,
  History,
  ArrowLeft,
  Globe,
  Gamepad2,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getPublicBaseDomain, portalUrl } from '@/lib/domain';

export function GameAdminShell({ children }: { children: React.ReactNode }) {
  const params = useParams<{ subdomain: string }>();
  const subdomain = params.subdomain;
  const pathname = usePathname();

  const context = useQuery({
    queryKey: ['game-admin', 'context', subdomain],
    queryFn: () => api.gameAdmin.context(subdomain),
    retry: false,
  });

  useEffect(() => {
    if (context.error && typeof window !== 'undefined') {
      const origin = new URL(window.location.href);
      origin.hostname = getPublicBaseDomain();
      origin.pathname = '/auth/login';
      origin.search = `returnTo=${encodeURIComponent(window.location.href)}`;
      window.location.replace(origin.toString());
    }
  }, [context.error]);

  if (context.isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm text-center space-y-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-2xs">
            <Gamepad2 className="size-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Đang tải khu vực quản trị game</h3>
            <p className="mt-1 text-xs text-slate-500">Đang đồng bộ dữ liệu và quyền truy cập…</p>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full w-2/5 bg-[#00873E] rounded-full animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  if (!context.data) {
    return (
      <main className="min-h-screen bg-slate-50 p-8 text-sm text-slate-500 flex items-center justify-center">
        Không thể truy cập khu vực quản trị game.
      </main>
    );
  }

  const game = context.data.game;
  const can = (action: string, subject: string) =>
    context.data.isSuperAdmin ||
    context.data.abilityRules.some((rule) => rule.action === action && rule.subject === subject);

  const items = [{ href: '/admin', label: 'Tổng quan', icon: LayoutDashboard }]
    .concat(
      can('manage', 'GamePresentation')
        ? [{ href: '/admin/presentation', label: 'Giao diện', icon: Palette }]
        : [],
    )
    .concat(
      can('manage', 'GameContent')
        ? [{ href: '/admin/articles', label: 'Bài viết', icon: FileText }]
        : [],
    )
    .concat(
      can('manage', 'GameEvent')
        ? [{ href: '/admin/events', label: 'Sự kiện', icon: CalendarDays }]
        : [],
    )
    .concat(
      can('read', 'GamePlayer')
        ? [{ href: '/admin/players', label: 'Người chơi', icon: Users }]
        : [],
    )
    .concat(
      can('read', 'GameAudit')
        ? [{ href: '/admin/audit', label: 'Nhật ký hoạt động', icon: History }]
        : [],
    );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-slate-200/80 bg-white p-5 flex flex-col justify-between z-30 shadow-xs">
        <div>
          {/* Game Brand & Logo */}
          <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-sm ring-1 ring-emerald-500/30 overflow-hidden">
              {game.logoUrl ? (
                <img src={game.logoUrl} alt={game.name} className="size-full object-cover" />
              ) : (
                <Gamepad2 className="size-6" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-black text-slate-900 text-sm truncate">{game.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="rounded bg-emerald-100/80 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800 font-mono">
                  {game.code}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Quản trị Game
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition duration-150 ${
                    active
                      ? 'bg-emerald-50 text-[#00873E] shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`size-4 ${active ? 'text-[#00873E]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Actions */}
        <div className="border-t border-slate-100 pt-4 space-y-2">
          <a
            href={`http://${game.subdomain}.lvh.me:3001`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#00873E] transition"
          >
            <div className="flex items-center gap-2">
              <Globe className="size-3.5 text-emerald-600" />
              <span>Xem trang web game</span>
            </div>
            <ExternalLink className="size-3 text-slate-400" />
          </a>

          {context.data.isSuperAdmin && (
            <a
              href={portalUrl('/admin')}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition"
            >
              <ArrowLeft className="size-3.5" />
              <span>Về trang quản lý chung</span>
            </a>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 flex-1 min-w-0 p-5 sm:p-6 w-full">{children}</main>
    </div>
  );
}
