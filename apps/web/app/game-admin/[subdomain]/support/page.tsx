'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import { api } from '@/lib/api';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/status-badge';
import { formatDate } from '@/lib/utils';

export default function GameSupportPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const context = useQuery({ queryKey: ['game-admin', 'context', subdomain], queryFn: () => api.gameAdmin.context(subdomain), retry: false });
  const tickets = useQuery({ queryKey: ['game-admin', 'support', context.data?.game.id], queryFn: () => api.gameAdmin.support.tickets(context.data!.game.id), enabled: Boolean(context.data), retry: false });
  if (context.isLoading || tickets.isLoading) return <Skeleton className="h-[560px] rounded-2xl" />;
  if (context.isError || tickets.isError) return <Alert>Không thể tải yêu cầu hỗ trợ.</Alert>;
  return <div className="mx-auto max-w-6xl space-y-6"><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">{context.data?.game.name}</p><h1 className="mt-2 text-2xl font-black">Hỗ trợ người chơi</h1></div><div className="rounded-2xl border border-slate-200 bg-white shadow-sm">{tickets.data?.items.length ? <div className="divide-y divide-slate-100">{tickets.data.items.map((ticket) => <Link key={ticket.ticketNo} href={`/admin/support/${encodeURIComponent(ticket.ticketNo)}`} className="flex items-center justify-between gap-4 p-5 hover:bg-slate-50"><div className="min-w-0"><p className="text-xs font-bold text-emerald-700">{ticket.ticketNo} · {ticket.user.fullName ?? ticket.user.username}</p><h2 className="mt-1 truncate font-bold text-slate-900">{ticket.subject}</h2><p className="mt-1 text-xs text-slate-500">{ticket.category.name} · {formatDate(ticket.lastActivityAt ?? ticket.createdAt)}</p></div><StatusBadge status={ticket.status} /></Link>)}</div> : <div className="p-14 text-center text-slate-500"><MessageSquare className="mx-auto mb-3 size-8 text-slate-300" />Chưa có yêu cầu hỗ trợ cho game này.</div>}</div></div>;
}
