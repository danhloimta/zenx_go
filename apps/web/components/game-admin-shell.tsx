'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, Users, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { getPublicBaseDomain } from '@/lib/domain';

export function GameAdminShell({ children }: { children: React.ReactNode }) {
  const params = useParams<{ subdomain: string }>();
  const subdomain = params.subdomain;
  const pathname = usePathname();
  const context = useQuery({ queryKey: ['game-admin', 'context', subdomain], queryFn: () => api.gameAdmin.context(subdomain), retry: false });
  useEffect(() => {
    if (context.error && typeof window !== 'undefined') {
      const origin = new URL(window.location.href);
      origin.hostname = getPublicBaseDomain();
      origin.pathname = '/auth/login';
      origin.search = `returnTo=${encodeURIComponent(window.location.href)}`;
      window.location.replace(origin.toString());
    }
  }, [context.error]);
  if (context.isLoading) return <main className="min-h-screen bg-slate-50 p-8 text-slate-500">Đang tải khu vực quản trị game…</main>;
  if (!context.data) return <main className="min-h-screen bg-slate-50 p-8 text-slate-500">Không thể truy cập khu vực quản trị game.</main>;
  const canPlayers = context.data.abilityRules.some((rule) => rule.action === 'read' && rule.subject === 'GamePlayer') || context.data.isSuperAdmin;
  const items = [{ href: `/game-admin/${subdomain}`, label: 'Tổng quan', icon: LayoutDashboard }].concat(canPlayers ? [{ href: `/game-admin/${subdomain}/players`, label: 'Người chơi', icon: Users }] : []);
  return <div className="min-h-screen bg-slate-50 text-slate-900"><aside className="fixed inset-y-0 left-0 w-64 border-r border-slate-200 bg-white p-5"><div className="mb-8 flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-emerald-700 text-white"><ShieldCheck className="size-5" /></div><div><p className="font-black">{context.data.game.name}</p><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Game Admin</p></div></div><nav className="space-y-1">{items.map((item) => { const Icon = item.icon; const active = pathname === item.href; return <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${active ? 'bg-emerald-50 font-bold text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}><Icon className="size-4" />{item.label}</Link>; })}</nav></aside><main className="ml-64 p-8">{children}</main></div>;
}
