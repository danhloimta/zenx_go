'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import { api } from '@/lib/api';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';
import { formatDate } from '@/lib/utils';

export default function GameSupportPage() {
  const { subdomain } = useParams<{ subdomain: string }>();

  const context = useQuery({
    queryKey: ['game-admin', 'context', subdomain],
    queryFn: () => api.gameAdmin.context(subdomain),
    retry: false,
  });

  const tickets = useQuery({
    queryKey: ['game-admin', 'support', context.data?.game.id],
    queryFn: () => api.gameAdmin.support.tickets(context.data!.game.id),
    enabled: Boolean(context.data),
    retry: false,
  });

  if (context.isLoading || tickets.isLoading) {
    return <Skeleton className="h-[560px] rounded-2xl" />;
  }

  if (context.isError || tickets.isError) {
    return <Alert>Không thể tải yêu cầu hỗ trợ.</Alert>;
  }

  const game = context.data?.game;

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        icon={MessageSquare}
        title={`Hỗ trợ người chơi · ${game?.name ?? 'Trò chơi'}`}
        badge={
          game?.code ? (
            <span className="rounded bg-emerald-100/90 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
              {game.code}
            </span>
          ) : undefined
        }
        description="Tiếp nhận và giải quyết khiếu nại, sự cố tài khoản, nạp coin và thắc mắc của cộng đồng người chơi."
        className="border-b border-slate-100 pb-3"
      />

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        {tickets.data?.items.length ? (
          <div className="divide-y divide-slate-100">
            {tickets.data.items.map((ticket) => (
              <Link
                key={ticket.ticketNo}
                href={`/admin/support/${encodeURIComponent(ticket.ticketNo)}`}
                className="flex items-center justify-between gap-4 p-4 sm:p-5 hover:bg-slate-50/80 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#00873E]">
                    {ticket.ticketNo} · {ticket.user.fullName ?? ticket.user.username}
                  </p>
                  <h2 className="mt-1 truncate font-bold text-slate-900">{ticket.subject}</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {ticket.category.name} · {formatDate(ticket.lastActivityAt ?? ticket.createdAt)}
                  </p>
                </div>
                <StatusBadge status={ticket.status} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-14 text-center text-slate-500">
            <MessageSquare className="mx-auto mb-3 size-8 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">Chưa có yêu cầu hỗ trợ nào</p>
            <p className="text-xs text-slate-400 mt-1">Tất cả ticket người chơi đã được xử lý xong.</p>
          </div>
        )}
      </div>
    </div>
  );
}
