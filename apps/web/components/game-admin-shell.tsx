'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, Users, ShieldCheck, FileText, CalendarDays, Palette, History, Settings2 } from 'lucide-react';
import { api } from '@/lib/api';
import { getPublicBaseDomain } from '@/lib/domain';
import { ApiError } from '@zenx-go/api-client';

export function GameAdminShell({ children }: { children: React.ReactNode }) {
  const params = useParams<{ subdomain: string }>();
  const subdomain = params.subdomain;
  const pathname = usePathname();
  const context = useQuery({ queryKey: ['game-admin', 'context', subdomain], queryFn: () => api.gameAdmin.context(subdomain), retry: false });
  useEffect(() => {
    if (context.error instanceof ApiError && context.error.status === 401 && typeof window !== 'undefined') {
      const origin = new URL(window.location.href);
      origin.hostname = getPublicBaseDomain();
      origin.pathname = '/auth/login';
      origin.search = `returnTo=${encodeURIComponent(window.location.href)}`;
      window.location.replace(origin.toString());
    }
  }, [context.error]);
  if (context.isLoading) return <main className="min-h-screen bg-slate-50 p-8 text-slate-500">Đang tải khu vực quản trị game…</main>;
  if (!context.data) return <main className="min-h-screen bg-slate-50 p-8 text-slate-500">Không thể truy cập khu vực quản trị game.</main>;
  const can = (action: string, subject: string) => context.data.isSuperAdmin || context.data.abilityRules.some((rule) => rule.action === action && rule.subject === subject);
  const items = [{ href: '/admin', label: 'Tổng quan', icon: LayoutDashboard }]
    .concat(can('manage', 'GamePresentation') ? [{ href: '/admin/presentation', label: 'Giao diện', icon: Palette }] : [])
    .concat(can('manage', 'GameContent') ? [{ href: '/admin/articles', label: 'Bài viết', icon: FileText }] : [])
    .concat(can('manage', 'GameEvent') ? [{ href: '/admin/events', label: 'Sự kiện', icon: CalendarDays }] : [])
    .concat(can('read', 'GamePlayer') ? [{ href: '/admin/players', label: 'Người chơi', icon: Users }] : [])
    .concat(can('manage', 'GameOperations') ? [{ href: '/admin/operations', label: 'Vận hành', icon: Settings2 }] : [])
    .concat(can('read', 'GameAudit') ? [{ href: '/admin/audit', label: 'Nhật ký hoạt động', icon: History }] : []);
  return <div className="min-h-screen bg-slate-50 text-slate-900"><aside className="fixed inset-y-0 left-0 w-64 border-r border-slate-200 bg-white p-5"><div className="mb-8 flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-emerald-700 text-white"><ShieldCheck className="size-5" /></div><div><p className="font-black">{context.data.game.name}</p><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Game Admin</p></div></div><nav className="space-y-1">{items.map((item) => { const Icon = item.icon; const active = pathname === item.href; return <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${active ? 'bg-emerald-50 font-bold text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}><Icon className="size-4" />{item.label}</Link>; })}</nav></aside><main className="ml-64 p-8">{children}</main></div>;
}
