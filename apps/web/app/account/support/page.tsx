'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, MessageSquarePlus, Ticket } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { formatDate } from '@/lib/utils';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/status-badge';

const pageSize = 10;

export default function SupportTicketsPage() {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['support', 'tickets', { page, pageSize }],
    queryFn: () => api.support.tickets({ page, pageSize }),
    retry: false,
  });
  const totalPages = useMemo(() => Math.max(1, query.data?.totalPages ?? 1), [query.data?.totalPages]);
  const items = query.data?.items ?? [];

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#00873E]">Hỗ trợ</p>
          <h1 className="mt-2 text-2xl font-black text-slate-900">Yêu cầu của tôi</h1>
          <p className="mt-1.5 text-sm text-slate-500">Theo dõi các vấn đề bạn đã gửi đến đội ngũ ZENX GO.</p>
        </div>
        <Button asChild className="w-full gap-2 sm:w-auto"><Link href="/support/report-issue"><MessageSquarePlus className="size-4" /> Tạo yêu cầu mới</Link></Button>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
        {query.isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-16 rounded-xl" />)}</div>
        ) : query.isError ? (
          <Alert>{getErrorMessage(query.error, 'Không thể tải danh sách yêu cầu hỗ trợ.')}</Alert>
        ) : !items.length ? (
          <EmptyState title="Bạn chưa có yêu cầu hỗ trợ nào" description="Nếu gặp vấn đề, hãy gửi yêu cầu để đội ngũ ZENX GO hỗ trợ." />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead><tr className="border-b border-slate-100 text-xs font-semibold text-slate-400"><th className="pb-3 pr-4">Mã yêu cầu</th><th className="px-4 pb-3">Nội dung</th><th className="px-4 pb-3">Danh mục</th><th className="px-4 pb-3">Ngày gửi</th><th className="pb-3 pl-4 text-right">Trạng thái</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((ticket) => <tr key={ticket.ticketNo} className="group hover:bg-slate-50"><td className="py-4 pr-4"><Link href={`/account/support/${encodeURIComponent(ticket.ticketNo)}`} className="font-bold text-[#00873E] hover:underline">{ticket.ticketNo}</Link></td><td className="max-w-[300px] px-4 py-4"><Link href={`/account/support/${encodeURIComponent(ticket.ticketNo)}`} className="block truncate font-semibold text-slate-800 group-hover:text-[#00873E]">{ticket.subject}</Link><p className="mt-1 truncate text-xs text-slate-400">{ticket.description}</p></td><td className="px-4 py-4"><Badge variant="secondary">{ticket.category.name}</Badge></td><td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">{formatDate(ticket.createdAt)}</td><td className="py-4 pl-4 text-right"><StatusBadge status={ticket.status} /></td></tr>)}
                </tbody>
              </table>
            </div>
            <div className="space-y-3 md:hidden">
              {items.map((ticket) => <Link key={ticket.ticketNo} href={`/account/support/${encodeURIComponent(ticket.ticketNo)}`} className="block rounded-xl border border-slate-100 p-4 transition hover:border-[#9CD7AB] hover:bg-[#F9FCFA]"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold text-[#00873E]">{ticket.ticketNo}</p><h2 className="mt-1 truncate font-bold text-slate-900">{ticket.subject}</h2></div><StatusBadge status={ticket.status} /></div><div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span>{ticket.category.name}</span><span>{formatDate(ticket.createdAt)}</span></div></Link>)}
            </div>
            <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>Hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, query.data?.total ?? 0)} của {query.data?.total ?? 0} yêu cầu</span><div className="flex items-center gap-2 self-center sm:self-auto"><button aria-label="Trang trước" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="size-4" /></button><span className="min-w-16 text-center font-semibold text-slate-700">Trang {page}/{totalPages}</span><button aria-label="Trang sau" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="size-4" /></button></div></div>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-[#DDF1E2] bg-[#F0FAF2] p-5 text-sm text-slate-600 sm:p-6"><div className="flex items-start gap-3"><Ticket className="mt-0.5 size-5 shrink-0 text-[#00873E]" /><div><p className="font-bold text-slate-900">Cần tìm câu trả lời nhanh?</p><p className="mt-1">Xem các câu hỏi thường gặp trước khi gửi yêu cầu mới.</p><Link href="/support" className="mt-2 inline-flex items-center gap-1 font-bold text-[#00873E] hover:underline">Xem trung tâm hỗ trợ <ArrowRight className="size-3.5" /></Link></div></div></div>
    </div>
  );
}
