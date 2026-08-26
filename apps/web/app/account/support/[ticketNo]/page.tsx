'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Check, CircleDot, Clock3, MessageSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { SupportTicketStatus } from '@zenx-go/api-client';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { formatDate } from '@/lib/utils';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/status-badge';

const statusSteps: Array<{ status: SupportTicketStatus; label: string }> = [
  { status: 'NEW', label: 'Mới tiếp nhận' },
  { status: 'IN_PROGRESS', label: 'Đang xử lý' },
  { status: 'RESOLVED', label: 'Đã giải quyết' },
  { status: 'CLOSED', label: 'Đã đóng' },
];

export default function SupportTicketDetailPage() {
  const params = useParams<{ ticketNo: string }>();
  const ticketNo = typeof params.ticketNo === 'string' ? decodeURIComponent(params.ticketNo) : '';
  const query = useQuery({ queryKey: ['support', 'ticket', ticketNo], queryFn: () => api.support.ticket(ticketNo), enabled: Boolean(ticketNo), retry: false });
  const ticket = query.data;
  const currentIndex = statusSteps.findIndex((step) => step.status === ticket?.status);

  return (
    <div className="mx-auto max-w-[960px] space-y-5 pb-10">
      <Link href="/account/support" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#00873E]"><ArrowLeft className="size-4" /> Quay lại yêu cầu của tôi</Link>
      {query.isLoading ? <Skeleton className="h-[560px] rounded-2xl" /> : query.isError ? <Alert>{getErrorMessage(query.error, 'Không thể tải yêu cầu hỗ trợ.')}</Alert> : ticket ? <>
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-bold text-[#00873E]">{ticket.ticketNo}</span><Badge variant="secondary">{ticket.category.name}</Badge></div><h1 className="mt-3 text-2xl font-black text-slate-900">{ticket.subject}</h1><p className="mt-2 text-xs text-slate-400">Đã gửi {formatDate(ticket.createdAt)}</p></div><StatusBadge status={ticket.status} /></div>
          <div className="mt-8 rounded-2xl bg-[#F8FAFC] p-5 sm:p-6"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500"><MessageSquare className="size-4 text-[#00873E]" /> Nội dung yêu cầu</div><p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">{ticket.description}</p></div>
          <div className="mt-8 border-t border-slate-100 pt-7"><div className="flex items-center justify-between"><h2 className="text-sm font-black text-slate-900">Tiến trình xử lý</h2><span className="inline-flex items-center gap-1.5 text-xs text-slate-400"><Clock3 className="size-3.5" /> Cập nhật {formatDate(ticket.updatedAt)}</span></div><div className="mt-6 grid gap-4 sm:grid-cols-4">{statusSteps.map((step, index) => { const active = currentIndex >= 0 && index <= currentIndex; const current = step.status === ticket.status; return <div key={step.status} className="relative flex items-center gap-3 sm:block sm:text-center"><div className={`mx-0 flex size-9 shrink-0 items-center justify-center rounded-full sm:mx-auto ${active ? 'bg-[#00873E] text-white' : 'bg-slate-100 text-slate-400'}`}>{active ? <Check className="size-4" /> : <CircleDot className="size-4" />}</div><p className={`mt-0 text-xs font-semibold sm:mt-2 ${current ? 'text-[#00873E]' : active ? 'text-slate-700' : 'text-slate-400'}`}>{step.label}</p>{index < statusSteps.length - 1 ? <span className={`absolute left-9 top-4 h-px w-[calc(100%-2.25rem)] sm:left-[calc(50%+1.25rem)] sm:top-4 sm:w-[calc(100%-2.5rem)] ${currentIndex > index ? 'bg-[#00873E]' : 'bg-slate-200'}`} /> : null}</div>; })}</div></div>
        </div>
        <div className="flex flex-wrap gap-3"><Button asChild variant="zenx-outline"><Link href="/support">Xem FAQ</Link></Button><Button asChild><Link href="/support/report-issue">Tạo yêu cầu mới</Link></Button></div>
      </> : null}
    </div>
  );
}
