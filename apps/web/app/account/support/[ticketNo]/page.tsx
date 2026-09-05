'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CircleDot,
  Clock3,
  ChevronDown,
  MessageCircle,
  MessageSquare,
  Send,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupportTicketMessage, SupportTicketStatus } from '@zenx-go/api-client';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { formatDate } from '@/lib/utils';
import { useSupportTicketMessages } from '@/hooks/use-support';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/status-badge';
import { SupportMessageText } from '@/components/support-markdown';

const statusSteps: Array<{ status: SupportTicketStatus; label: string }> = [
  { status: 'NEW', label: 'Mới tiếp nhận' },
  { status: 'IN_PROGRESS', label: 'Đang xử lý' },
  { status: 'WAITING_USER', label: 'Chờ phản hồi' },
  { status: 'RESOLVED', label: 'Đã giải quyết' },
  { status: 'CLOSED', label: 'Đã đóng' },
];

export default function SupportTicketDetailPage() {
  const params = useParams<{ ticketNo: string }>();
  const ticketNo = typeof params.ticketNo === 'string' ? decodeURIComponent(params.ticketNo) : '';
  const queryClient = useQueryClient();
  const ticketQuery = useQuery({
    queryKey: ['support', 'ticket', ticketNo],
    queryFn: () => api.support.ticket(ticketNo),
    enabled: Boolean(ticketNo),
    retry: false,
  });
  const messagesQuery = useSupportTicketMessages(ticketNo, 1, 50, Boolean(ticketQuery.data));
  const [messagePage, setMessagePage] = useState(1);
  const [older, setOlder] = useState<SupportTicketMessage[]>([]);
  const olderMessages = useSupportTicketMessages(
    ticketNo,
    messagePage,
    50,
    Boolean(ticketQuery.data) && messagePage > 1,
  );
  const ticket = ticketQuery.data;
  const [body, setBody] = useState('');
  const markedRead = useRef('');

  useEffect(() => {
    setMessagePage(1);
    setOlder([]);
  }, [ticketNo]);

  useEffect(() => {
    const incoming = olderMessages.data?.items ?? [];
    if (!incoming.length) return;
    setOlder((current) => {
      const seen = new Set(current.map((message) => message.id));
      return [...current, ...incoming.filter((message) => !seen.has(message.id))];
    });
  }, [olderMessages.data?.items]);

  useEffect(() => {
    if (!ticket) return;
    if (markedRead.current === ticketNo) return;
    markedRead.current = ticketNo;
    void api.support
      .markRead(ticketNo)
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: ['support', 'unread-count'] });
        void queryClient.invalidateQueries({ queryKey: ['support', 'ticket', ticketNo] });
        void queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] });
      })
      .catch(() => undefined);
  }, [queryClient, ticket, ticketNo]);

  const send = useMutation({
    mutationFn: () => api.support.createMessage(ticketNo, { body: body.trim() }),
    onSuccess: () => {
      setBody('');
      void queryClient.invalidateQueries({ queryKey: ['support', 'ticket', ticketNo] });
      void queryClient.invalidateQueries({ queryKey: ['support', 'messages', ticketNo] });
      void queryClient.invalidateQueries({ queryKey: ['support', 'unread-count'] });
    },
  });
  const messages = useMemo(
    () => {
      const initial = messagesQuery.data?.items ?? [];
      const seen = new Set<string>();
      return [...initial, ...older]
        .filter((message) => !seen.has(message.id) && seen.add(message.id))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    [messagesQuery.data?.items, older],
  );
  const currentIndex = statusSteps.findIndex((step) => step.status === ticket?.status);
  const canReply = Boolean(ticket && ticket.status !== 'CLOSED');

  return (
    <div className="mx-auto max-w-[960px] space-y-5 pb-10">
      <Link
        href="/account/support"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#00873E]"
      >
        <ArrowLeft className="size-4" /> Quay lại yêu cầu của tôi
      </Link>
      {ticketQuery.isLoading ? (
        <Skeleton className="h-[700px] rounded-2xl" />
      ) : ticketQuery.isError ? (
        <Alert>{getErrorMessage(ticketQuery.error, 'Không thể tải yêu cầu hỗ trợ.')}</Alert>
      ) : ticket ? (
        <>
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-[#00873E]">{ticket.ticketNo}</span>
                  <Badge variant="secondary">{ticket.category.name}</Badge>
                  {ticket.unread ? <Badge variant="destructive">Mới cập nhật</Badge> : null}
                </div>
                <h1 className="mt-3 text-2xl font-black text-slate-900">{ticket.subject}</h1>
                <p className="mt-2 text-xs text-slate-400">
                  Đã gửi {formatDate(ticket.createdAt)} · Cập nhật{' '}
                  {formatDate(ticket.lastActivityAt ?? ticket.updatedAt)}
                </p>
              </div>
              <StatusBadge status={ticket.status} />
            </div>
          </section>
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <MessageSquare className="size-4 text-[#00873E]" /> Nội dung yêu cầu
            </div>
            <div className="mt-5 rounded-2xl bg-slate-50 p-5">
              <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                {ticket.description}
              </p>
              <p className="mt-3 text-[11px] text-slate-400">
                Bạn · {formatDate(ticket.createdAt)}
              </p>
            </div>
          </section>
          <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="font-black text-slate-900">Trao đổi với đội hỗ trợ</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Các phản hồi được lưu theo thứ tự và không thể chỉnh sửa.
                </p>
              </div>
              <MessageCircle className="size-5 text-[#00873E]" />
            </div>
            <div className="space-y-4 p-6">
              {messagesQuery.data && messagesQuery.data.total > 50 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMessagePage((value) => value + 1)}
                  disabled={
                    olderMessages.isFetching ||
                    messagePage >= (messagesQuery.data.totalPages ?? 1)
                  }
                >
                  <ChevronDown className="size-4" /> Tải trao đổi cũ hơn
                </Button>
              ) : null}
              {messagesQuery.isLoading ? (
                <Skeleton className="h-36 rounded-2xl" />
              ) : messages.length ? (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-2xl p-4 sm:p-5 border transition ${
                      message.authorType === 'STAFF'
                        ? 'bg-emerald-50/50 border-emerald-200/70 shadow-xs'
                        : 'bg-slate-50 border-slate-200/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-black/5 pb-2.5 mb-2.5">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900">
                          {message.author?.fullName ||
                            message.author?.username ||
                            (message.authorType === 'STAFF' ? 'Đội hỗ trợ' : 'Bạn')}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            message.authorType === 'STAFF'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/60'
                              : 'bg-slate-200/80 text-slate-700'
                          }`}
                        >
                          {message.authorType === 'STAFF' ? 'CS Staff' : 'Bạn'}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                    <div className="text-sm leading-relaxed text-slate-800">
                      <SupportMessageText>{message.body}</SupportMessageText>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                  Đội hỗ trợ chưa phản hồi. Bạn có thể bổ sung thông tin bên dưới.
                </p>
              )}
              {canReply ? (
                <div className="border-t border-slate-100 pt-5">
                  <Textarea
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder="Viết thêm thông tin cho đội hỗ trợ…"
                    className="min-h-28"
                    maxLength={4000}
                  />
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-400">Tối đa 4.000 ký tự</span>
                    <Button onClick={() => send.mutate()} disabled={send.isPending || !body.trim()}>
                      {send.isPending ? (
                        'Đang gửi…'
                      ) : (
                        <>
                          <Send className="size-4" /> Gửi phản hồi
                        </>
                      )}
                    </Button>
                  </div>
                  {send.isError ? (
                    <p className="mt-2 text-xs text-red-600">
                      {getErrorMessage(send.error, 'Không thể gửi phản hồi.')}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="border-t border-slate-100 pt-5">
                  <p className="text-sm text-slate-500">
                    Ticket đã đóng. Nếu cần hỗ trợ thêm, vui lòng tạo yêu cầu mới.
                  </p>
                </div>
              )}
            </div>
          </section>
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900">Tiến trình xử lý</h2>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                <Clock3 className="size-3.5" /> {formatDate(ticket.updatedAt)}
              </span>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-5">
              {statusSteps.map((step, index) => {
                const active = currentIndex >= 0 && index <= currentIndex;
                const current = step.status === ticket.status;
                return (
                  <div
                    key={step.status}
                    className="relative flex items-center gap-3 sm:block sm:text-center"
                  >
                    <div
                      className={`mx-0 flex size-9 shrink-0 items-center justify-center rounded-full sm:mx-auto ${active ? 'bg-[#00873E] text-white' : 'bg-slate-100 text-slate-400'}`}
                    >
                      {active ? <Check className="size-4" /> : <CircleDot className="size-4" />}
                    </div>
                    <p
                      className={`text-xs font-semibold sm:mt-2 ${current ? 'text-[#00873E]' : active ? 'text-slate-700' : 'text-slate-400'}`}
                    >
                      {step.label}
                    </p>
                    {index < statusSteps.length - 1 ? (
                      <span
                        className={`absolute left-9 top-4 h-px w-[calc(100%-2.25rem)] sm:left-[calc(50%+1.25rem)] sm:top-4 sm:w-[calc(100%-2.5rem)] ${currentIndex > index ? 'bg-[#00873E]' : 'bg-slate-200'}`}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
            {ticket.status === 'RESOLVED' && ticket.resolvedAt ? (
              <p className="mt-5 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                Bạn có thể phản hồi để mở lại ticket trong vòng 7 ngày kể từ{' '}
                {formatDate(ticket.resolvedAt)}.
              </p>
            ) : null}
          </section>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="zenx-outline">
              <Link href="/support">Xem FAQ</Link>
            </Button>
            <Button asChild>
              <Link href="/support/report-issue">Tạo yêu cầu mới</Link>
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
