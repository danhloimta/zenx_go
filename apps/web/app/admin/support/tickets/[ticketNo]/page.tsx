'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  MessageCircle,
  MessageSquare,
  UserCheck,
  Users,
} from 'lucide-react';
import type {
  SupportMessageVisibility,
  SupportTicketMessage,
  SupportTicketPriority,
  SupportTicketStatus,
} from '@zenx-go/api-client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { formatDate } from '@/lib/utils';
import { useSupportAdminAgents, useSupportAdminTicket } from '@/hooks/use-support';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert } from '@/components/ui/alert';
import {
  supportPriorityClass,
  supportPriorityLabel,
  supportStatusClass,
  supportStatusLabel,
} from '@/lib/support';
import { SupportMessageText } from '@/components/support-markdown';
import { toast } from 'sonner';

const statuses: SupportTicketStatus[] = [
  'NEW',
  'IN_PROGRESS',
  'WAITING_USER',
  'RESOLVED',
  'CLOSED',
];
const priorities: SupportTicketPriority[] = ['URGENT', 'HIGH', 'NORMAL', 'LOW'];

export default function SupportAdminTicketPage() {
  const params = useParams<{ ticketNo: string }>();
  const ticketNo = typeof params.ticketNo === 'string' ? decodeURIComponent(params.ticketNo) : '';
  const ticketQuery = useSupportAdminTicket(ticketNo);
  const agents = useSupportAdminAgents(Boolean(ticketQuery.data));
  const ticket = ticketQuery.data;
  const queryClient = useQueryClient();
  const [visibility, setVisibility] = useState<SupportMessageVisibility>('PUBLIC');
  const [body, setBody] = useState('');
  const [nextStatus, setNextStatus] = useState<SupportTicketStatus | ''>('');
  const [nextPriority, setNextPriority] = useState<SupportTicketPriority | ''>('');
  const [nextAssignee, setNextAssignee] = useState('');
  const [messagePage, setMessagePage] = useState(1);
  const markedRead = useRef('');
  const [older, setOlder] = useState<SupportTicketMessage[]>([]);

  useEffect(() => {
    if (!ticket) return;
    setNextStatus(ticket.status);
    setNextPriority((ticket.priority as SupportTicketPriority) || 'NORMAL');
    setNextAssignee(ticket.assigneeUserId ?? '');
    if (markedRead.current === ticketNo) return;
    markedRead.current = ticketNo;
    setOlder([]);
    setMessagePage(1);
    void api.admin.support
      .markRead(ticketNo)
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: ['admin', 'support', 'dashboard'] });
        void queryClient.invalidateQueries({ queryKey: ['admin', 'support', 'tickets'] });
        queryClient.setQueryData(['admin', 'support', 'ticket', ticketNo], (current: typeof ticket | undefined) => current ? { ...current, unread: false } : current);
      })
      .catch(() => undefined);
  }, [queryClient, ticket, ticketNo]);

  const olderMessages = useQuery({
    queryKey: ['admin', 'support', 'messages', ticketNo, messagePage],
    queryFn: () => api.admin.support.messages(ticketNo, { page: messagePage, pageSize: 50 }),
    enabled: Boolean(ticketNo) && messagePage > 1,
    retry: false,
  });
  useEffect(() => {
    const incoming = olderMessages.data?.items ?? [];
    if (!incoming.length) return;
    setOlder((current) => {
      const seen = new Set(current.map((message) => message.id));
      return [...current, ...incoming.filter((message) => !seen.has(message.id))];
    });
  }, [olderMessages.data?.items]);
  const messages = useMemo(() => {
    const initial = ticket?.messages ?? [];
    const seen = new Set<string>();
    return [...initial, ...older]
      .filter((message) => !seen.has(message.id) && seen.add(message.id))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [older, ticket?.messages]);
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'support', 'ticket', ticketNo] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'support', 'tickets'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'support', 'dashboard'] });
  };
  const claim = useMutation({
    mutationFn: () =>
      api.admin.support.claim(ticketNo, {
        expectedUpdatedAt: ticket!.updatedAt,
      }),
    onSuccess: () => {
      toast.success('Đã nhận ticket.');
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const update = useMutation({
    mutationFn: () =>
      api.admin.support.updateTicket(ticketNo, {
        expectedUpdatedAt: ticket!.updatedAt,
        status: nextStatus || undefined,
        priority: nextPriority || undefined,
        assigneeUserId: nextAssignee || null,
      }),
    onSuccess: () => {
      toast.success('Đã cập nhật workflow ticket.');
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const send = useMutation({
    mutationFn: () =>
      api.admin.support.sendMessage(ticketNo, {
        body: body.trim(),
        visibility,
        expectedUpdatedAt: ticket!.updatedAt,
      }),
    onSuccess: () => {
      toast.success(
        visibility === 'PUBLIC' ? 'Đã gửi phản hồi cho user.' : 'Đã thêm internal note.',
      );
      setBody('');
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (ticketQuery.isLoading) return <Skeleton className="h-[760px] rounded-2xl" />;
  if (ticketQuery.isError || !ticket)
    return (
      <div className="space-y-4">
        <Link
          href="/admin/support/tickets"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#00873E]"
        >
          <ArrowLeft className="size-4" /> Quay lại hàng đợi
        </Link>
        <Alert>{getErrorMessage(ticketQuery.error, 'Không thể tải ticket.')}</Alert>
      </div>
    );
  const isClosed = ticket.status === 'CLOSED';
  return (
    <div className="space-y-6">
      <Link
        href="/admin/support/tickets"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#00873E]"
      >
        <ArrowLeft className="size-4" /> Quay lại hàng đợi
      </Link>
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-black text-[#00873E]">{ticket.ticketNo}</span>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${supportPriorityClass(ticket.priority)}`}
              >
                {supportPriorityLabel(ticket.priority)}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${supportStatusClass(ticket.status)}`}
              >
                {supportStatusLabel(ticket.status)}
              </span>
              {ticket.unread ? (
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700">
                  Chưa đọc
                </span>
              ) : null}
            </div>
            <h2 className="mt-3 text-2xl font-black text-slate-900">{ticket.subject}</h2>
            <p className="mt-1 text-xs text-slate-500">
              {ticket.category.name} · Cập nhật{' '}
              {formatDate(ticket.lastActivityAt ?? ticket.updatedAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!ticket.assigneeUserId ? (
              <Button
                size="sm"
                onClick={() => claim.mutate()}
                disabled={claim.isPending || isClosed}
              >
                <UserCheck className="size-4" /> Nhận ticket
              </Button>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                <UserCheck className="size-4" />{' '}
                {ticket.assignee?.fullName || ticket.assignee?.username}
              </span>
            )}
          </div>
        </div>
      </section>
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <MessageSquare className="size-4 text-[#00873E]" /> Yêu cầu ban đầu
            </div>
            <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
              {ticket.description}
            </p>
            <p className="mt-3 text-[11px] text-slate-400">
              {formatDate(ticket.createdAt)} ·{' '}
              {ticket.user.profile?.fullName || ticket.user.username}
            </p>
          </section>
          <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="font-black text-slate-900">Trao đổi</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Reply công khai hoặc internal note bất biến.
                </p>
              </div>
              <MessageCircle className="size-5 text-[#00873E]" />
            </div>
            <div className="space-y-4 p-5">
              {ticket.messagesTotal && ticket.messagesTotal > 50 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMessagePage((value) => value + 1)}
                  disabled={
                    olderMessages.isFetching || messagePage >= (ticket.messagesTotalPages ?? 1)
                  }
                >
                  <ChevronDown className="size-4" /> Tải trao đổi cũ hơn
                </Button>
              ) : null}
              {messages.length ? (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-2xl p-4 ${message.visibility === 'INTERNAL' ? 'border border-amber-200 bg-amber-50' : message.authorType === 'STAFF' ? 'bg-emerald-50/70' : 'bg-slate-50'}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-800">
                        {message.author?.fullName ||
                          message.author?.username ||
                          (message.authorType === 'STAFF' ? 'Support' : 'User')}
                        <span className="ml-2 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                          {message.visibility === 'INTERNAL'
                            ? 'Internal note'
                            : message.authorType === 'STAFF'
                              ? 'Support'
                              : 'User'}
                        </span>
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                    <SupportMessageText>{message.body}</SupportMessageText>
                  </div>
                ))
              ) : (
                <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                  Chưa có phản hồi.
                </p>
              )}
              <div className="border-t border-slate-100 pt-5">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Select
                    value={visibility}
                    onChange={(event) =>
                      setVisibility(event.target.value as SupportMessageVisibility)
                    }
                    className="sm:w-48"
                    disabled={isClosed}
                  >
                    <option value="PUBLIC">Phản hồi user</option>
                    <option value="INTERNAL">Internal note</option>
                  </Select>
                  <span className="flex-1" />
                </div>
                <Textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  className="mt-3 min-h-28"
                  placeholder={
                    visibility === 'PUBLIC' ? 'Viết phản hồi cho user…' : 'Ghi chú nội bộ cho team…'
                  }
                  disabled={isClosed}
                />
                <div className="mt-3 flex justify-end">
                  <Button
                    onClick={() => send.mutate()}
                    disabled={send.isPending || !body.trim() || isClosed}
                  >
                    {send.isPending
                      ? 'Đang gửi…'
                      : visibility === 'PUBLIC'
                        ? 'Gửi phản hồi'
                        : 'Thêm internal note'}
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-[#00873E]" />
              <h3 className="font-black text-slate-900">Người gửi</h3>
            </div>
            <div className="mt-4 space-y-2 text-xs">
              <p className="font-bold text-slate-800">
                {ticket.user.profile?.fullName || ticket.user.username}
              </p>
              <p className="text-slate-600">{ticket.user.email}</p>
              {ticket.user.phone ? <p className="text-slate-500">{ticket.user.phone}</p> : null}
              <p className="pt-2 text-[11px] text-slate-400">
                Thông tin user hiển thị ở mức giới hạn.
              </p>
            </div>
          </section>
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="font-black text-slate-900">Workflow</h3>
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-semibold text-slate-600">
                Trạng thái
                <Select
                  value={nextStatus}
                  onChange={(event) => setNextStatus(event.target.value as SupportTicketStatus)}
                  className="mt-1.5"
                  disabled={isClosed}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {supportStatusLabel(status)}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Ưu tiên
                <Select
                  value={nextPriority}
                  onChange={(event) => setNextPriority(event.target.value as SupportTicketPriority)}
                  className="mt-1.5"
                  disabled={isClosed}
                >
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {supportPriorityLabel(priority)}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Người xử lý
                <Select
                  value={nextAssignee}
                  onChange={(event) => setNextAssignee(event.target.value)}
                  className="mt-1.5"
                  disabled={isClosed}
                >
                  <option value="">Chưa nhận</option>
                  {(agents.data ?? []).map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.fullName || agent.username}
                    </option>
                  ))}
                </Select>
              </label>
              <Button
                className="w-full"
                onClick={() => update.mutate()}
                disabled={update.isPending || isClosed}
              >
                {update.isPending ? 'Đang lưu…' : 'Lưu workflow'}
              </Button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
