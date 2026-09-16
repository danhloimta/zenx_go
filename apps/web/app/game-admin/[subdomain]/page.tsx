'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function GameAdminDashboardPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const context = useQuery({ queryKey: ['game-admin', 'context', subdomain], queryFn: () => api.gameAdmin.context(subdomain), retry: false });
  const dashboard = useQuery({ queryKey: ['game-admin', 'dashboard', context.data?.game.id], queryFn: () => api.gameAdmin.dashboard(context.data!.game.id), enabled: Boolean(context.data), retry: false });
  if (!context.data || dashboard.isLoading) return <p className="text-sm text-slate-500">Đang tải số liệu…</p>;
  if (dashboard.isError) return <p className="text-sm text-red-600">Không thể tải dashboard.</p>;
  const totals = dashboard.data!.totals;
  const cards = [['Tổng người chơi', totals.totalPlayers], ['Player mới 7 ngày', totals.new7d], ['Hoạt động 7 ngày', totals.active7d], ['Tổng lượt SSO', totals.totalSsoLogins]];
  return <><div className="mb-8"><p className="text-sm font-semibold text-emerald-700">{context.data.game.code}</p><h1 className="text-3xl font-black">Tổng quan {context.data.game.name}</h1></div><div className="grid gap-4 md:grid-cols-4">{cards.map(([label, value]) => <Card key={String(label)}><CardHeader><CardTitle className="text-sm text-slate-500">{label}</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{value}</p></CardContent></Card>)}</div><Card className="mt-6"><CardHeader><CardTitle>Player đăng nhập gần đây</CardTitle></CardHeader><CardContent><div className="space-y-3">{dashboard.data!.recentPlayers.length ? dashboard.data!.recentPlayers.map((player) => <div key={player.id} className="flex items-center justify-between border-b pb-3 text-sm"><span className="font-semibold">{player.user.profile?.fullName ?? player.user.username}</span><span className="text-slate-500">{new Date(player.lastLoginAt).toLocaleString('vi-VN')}</span></div>) : <p className="text-sm text-slate-500">Chưa có player hoàn tất SSO.</p>}</div></CardContent></Card></>;
}
