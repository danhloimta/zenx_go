'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Flame,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  Send,
  Shield,
  Tag,
  User,
  UserCheck,
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
import { UserAvatar } from '@/components/user-avatar';
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
        queryClient.setQueryData(
          ['admin', 'support', 'ticket', ticketNo],
          (current: typeof ticket | undefined) =>
            current ? { ...current, unread: false } : current,
        );
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
      toast.success('Đã nhận xử lý ticket thành công.');
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
      toast.success('Đã cập nhật workflow ticket thành công.');
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
        visibility === 'PUBLIC' ? 'Đã gửi phản hồi cho khách hàng.' : 'Đã thêm ghi chú nội bộ.',
      );
      setBody('');
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (ticketQuery.isLoading) return <SupportTicketDetailSkeleton />;

  if (ticketQuery.isError || !ticket)
    return (
      <div className="space-y-4">
        <Link
          href="/admin/support/tickets"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#00873E]"
        >
          <ArrowLeft className="size-4" /> Quay lại hàng đợi ticket
        </Link>
        <Alert>{getErrorMessage(ticketQuery.error, 'Không thể tải chi tiết ticket.')}</Alert>
      </div>
    );

  const isClosed = ticket.status === 'CLOSED';
  const hasWorkflowChanged =
    nextStatus !== ticket.status ||
    nextPriority !== ticket.priority ||
    nextAssignee !== (ticket.assigneeUserId ?? '');

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href="/admin/support/tickets"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#00873E]"
        >
          <ArrowLeft className="size-4" /> Quay lại hàng đợi ticket
        </Link>
      </div>

      {/* Ticket Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-sm font-black text-[#00873E]">
                {ticket.ticketNo}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${supportPriorityClass(
                  ticket.priority,
                )}`}
              >
                {ticket.priority === 'URGENT' && <Flame className="inline mr-1 size-3.5" />}
                {supportPriorityLabel(ticket.priority)}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${supportStatusClass(
                  ticket.status,
                )}`}
              >
                {supportStatusLabel(ticket.status)}
              </span>
              {ticket.unread ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
                  <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
                  Tin nhắn mới
                </span>
              ) : null}
            </div>

            <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
              {ticket.subject}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                <Tag className="size-3 text-slate-400" /> {ticket.category.name}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="size-3 text-slate-400" /> Tạo {formatDate(ticket.createdAt)}
              </span>
              <span>•</span>
              <span>Cập nhật {formatDate(ticket.lastActivityAt ?? ticket.updatedAt)}</span>
            </div>
          </div>

          {/* Quick Assign / Claim Action Button */}
          <div className="flex shrink-0 items-center gap-2.5">
            {!ticket.assigneeUserId ? (
              <Button
                onClick={() => claim.mutate()}
                disabled={claim.isPending || isClosed}
                className="gap-2 bg-[#00873E] text-white hover:bg-[#007033]"
              >
                <UserCheck className="size-4" />
                {claim.isPending ? 'Đang nhận…' : 'Nhận ticket này'}
              </Button>
            ) : (
              <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-2.5 text-xs font-bold text-emerald-800">
                <UserAvatar
                  id={ticket.assignee?.id}
                  name={ticket.assignee?.fullName}
                  username={ticket.assignee?.username}
                  size="xs"
                />
                <span>
                  Đang phụ trách:{' '}
                  <strong className="text-slate-900">
                    {ticket.assignee?.fullName || ticket.assignee?.username}
                  </strong>
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Grid: Left Messages, Right Sidebar Info */}
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* Left Column: Conversation Thread */}
        <div className="space-y-6">
          {/* Initial User Request Message Card */}
          <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <UserAvatar
                  id={ticket.user.id}
                  name={ticket.user.profile?.fullName}
                  username={ticket.user.username}
                  email={ticket.user.email}
                  avatarUrl={ticket.user.profile?.avatarUrl}
                  size="sm"
                />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {ticket.user.profile?.fullName || ticket.user.username}
                  </h3>
                  <p className="text-[11px] text-slate-400">Khách hàng gửi yêu cầu ban đầu</p>
                </div>
              </div>
              <span className="text-xs text-slate-400">{formatDate(ticket.createdAt)}</span>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 sm:p-5 text-sm leading-relaxed text-slate-800">
              <p className="whitespace-pre-wrap break-words">{ticket.description}</p>
            </div>
          </section>

          {/* Conversation Thread History */}
          <section className="rounded-3xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-[#00873E]">
                  <MessageCircle className="size-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Tiến trình trao đổi</h3>
                  <p className="text-[11px] text-slate-500">
                    Gồm phản hồi gửi khách hàng và ghi chú nội bộ CS.
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {messages.length} phản hồi
              </span>
            </div>

            <div className="space-y-4 p-6">
              {/* Pagination if total messages > 50 */}
              {ticket.messagesTotal && ticket.messagesTotal > 50 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMessagePage((value) => value + 1)}
                  disabled={
                    olderMessages.isFetching || messagePage >= (ticket.messagesTotalPages ?? 1)
                  }
                  className="w-full gap-2 rounded-xl text-xs"
                >
                  <ChevronDown className="size-4" /> Xem trao đổi trước đó
                </Button>
              ) : null}

              {messages.length ? (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isStaff = message.authorType === 'STAFF';
                    const isInternal = message.visibility === 'INTERNAL';

                    return (
                      <div
                        key={message.id}
                        className={`rounded-2xl p-4 sm:p-5 transition duration-150 shadow-xs ${
                          isInternal
                            ? 'border border-amber-200/90 bg-amber-50/60'
                            : isStaff
                              ? 'border border-emerald-200/80 bg-emerald-50/40'
                              : 'border border-slate-200/80 bg-slate-50/80'
                        }`}
                      >
                        <div
                          className={`flex flex-wrap items-center justify-between gap-2.5 border-b pb-3 mb-3 ${
                            isInternal
                              ? 'border-amber-200/70'
                              : isStaff
                                ? 'border-emerald-200/60'
                                : 'border-slate-200/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <UserAvatar
                              id={message.author?.username}
                              name={message.author?.fullName}
                              username={message.author?.username}
                              size="xs"
                            />
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">
                                {message.author?.fullName ||
                                  message.author?.username ||
                                  (isStaff ? 'Hỗ trợ viên' : 'Khách hàng')}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  isInternal
                                    ? 'bg-amber-200/80 text-amber-900 border border-amber-300/60'
                                    : isStaff
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/60'
                                      : 'bg-slate-200/80 text-slate-700 border border-slate-300/50'
                                }`}
                              >
                                {isInternal ? (
                                  <>
                                    <Lock className="size-2.5 shrink-0" />
                                    Ghi chú nội bộ
                                  </>
                                ) : isStaff ? (
                                  'Chuyên viên CS'
                                ) : (
                                  'Người chơi'
                                )}
                              </span>
                            </div>
                          </div>

                          <span className="text-[11px] font-medium text-slate-400">
                            {formatDate(message.createdAt)}
                          </span>
                        </div>

                        <div className="text-sm leading-relaxed text-slate-800">
                          <SupportMessageText>{message.body}</SupportMessageText>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-xs text-slate-400">
                  Chưa có trao đổi nào. Hãy nhập phản hồi đầu tiên bên dưới.
                </div>
              )}

              {/* Reply Box Composer */}
              <div className="border-t border-slate-100 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setVisibility('PUBLIC')}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                        visibility === 'PUBLIC'
                          ? 'bg-[#00873E] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      disabled={isClosed}
                    >
                      Phản hồi cho khách hàng
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibility('INTERNAL')}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                        visibility === 'INTERNAL'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      disabled={isClosed}
                    >
                      <Lock className="size-3.5" /> Ghi chú nội bộ (Staff only)
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    {visibility === 'PUBLIC'
                      ? 'Khách hàng sẽ nhìn thấy tin nhắn này'
                      : 'Chỉ nhân sự Support & Admin xem được'}
                  </span>
                </div>

                <Textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  className={`mt-2 min-h-28 text-sm leading-relaxed ${
                    visibility === 'INTERNAL'
                      ? 'border-amber-200 bg-amber-50/30 focus:border-amber-500'
                      : ''
                  }`}
                  placeholder={
                    visibility === 'PUBLIC'
                      ? 'Nhập nội dung phản hồi, hướng dẫn giải quyết cho khách hàng…'
                      : 'Ghi chú nhanh thông tin kỹ thuật, log giao dịch hoặc tiến trình điều tra nội bộ…'
                  }
                  disabled={isClosed}
                />

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {body.trim().length} ký tự
                  </span>

                  <Button
                    onClick={() => send.mutate()}
                    disabled={send.isPending || !body.trim() || isClosed}
                    className={`gap-2 ${
                      visibility === 'INTERNAL'
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-[#00873E] hover:bg-[#007033] text-white'
                    }`}
                  >
                    <Send className="size-3.5" />
                    {send.isPending
                      ? 'Đang gửi…'
                      : visibility === 'PUBLIC'
                        ? 'Gửi câu trả lời'
                        : 'Lưu ghi chú nội bộ'}
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Workflow & Customer Profile */}
        <aside className="space-y-6">
          {/* Customer Profile Card */}
          <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3.5">
              <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-[#00873E]">
                <User className="size-4" />
              </span>
              <h3 className="font-black text-slate-900">Thông tin người chơi</h3>
            </div>

            <div className="mt-4 flex items-center gap-3.5">
              <UserAvatar
                id={ticket.user.id}
                name={ticket.user.profile?.fullName}
                username={ticket.user.username}
                email={ticket.user.email}
                avatarUrl={ticket.user.profile?.avatarUrl}
                size="lg"
              />
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-900">
                  {ticket.user.profile?.fullName || ticket.user.username}
                </p>
                <p className="truncate text-xs font-semibold text-slate-400">
                  @{ticket.user.username}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-600">
                <Mail className="size-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{ticket.user.email}</span>
              </div>

              {ticket.user.phone && (
                <div className="flex items-center gap-2.5 text-slate-600">
                  <Phone className="size-3.5 text-slate-400 shrink-0" />
                  <span>{ticket.user.phone}</span>
                </div>
              )}

              <div className="border-t border-slate-100 pt-3">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 rounded-xl text-xs"
                >
                  <Link href={`/admin/users/${ticket.user.id}`}>
                    Xem hồ sơ chi tiết <ExternalLink className="size-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Workflow & Assignment Manager */}
          <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <Shield className="size-4" />
                </span>
                <h3 className="font-black text-slate-900">Quy trình xử lý</h3>
              </div>
              {hasWorkflowChanged && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  Chưa lưu
                </span>
              )}
            </div>

            <div className="mt-5 space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-slate-700">Trạng thái ticket</span>
                <Select
                  value={nextStatus}
                  onChange={(event) => setNextStatus(event.target.value as SupportTicketStatus)}
                  className="h-10 text-xs font-semibold"
                  disabled={isClosed}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {supportStatusLabel(status)}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-slate-700">Mức độ ưu tiên</span>
                <Select
                  value={nextPriority}
                  onChange={(event) => setNextPriority(event.target.value as SupportTicketPriority)}
                  className="h-10 text-xs font-semibold"
                  disabled={isClosed}
                >
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {supportPriorityLabel(priority)}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-slate-700">Chuyên viên phụ trách</span>
                <Select
                  value={nextAssignee}
                  onChange={(event) => setNextAssignee(event.target.value)}
                  className="h-10 text-xs font-semibold"
                  disabled={isClosed}
                >
                  <option value="">Chưa phân công (Trống)</option>
                  {(agents.data ?? []).map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.fullName || agent.username}
                    </option>
                  ))}
                </Select>
              </label>

              {isClosed ? (
                <div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-3 text-xs text-slate-500">
                  <Lock className="size-4 shrink-0" />
                  <span>Ticket đã đóng; không thể thay đổi workflow.</span>
                </div>
              ) : (
                <Button
                  className="w-full h-10 gap-2 bg-[#00873E] font-bold text-white hover:bg-[#007033]"
                  onClick={() => update.mutate()}
                  disabled={update.isPending || isClosed || !hasWorkflowChanged}
                >
                  <CheckCircle2 className="size-4" />
                  {update.isPending ? 'Đang lưu workflow…' : 'Cập nhật Workflow'}
                </Button>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function SupportTicketDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-36 rounded-md" />
      <Skeleton className="h-32 rounded-3xl" />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Skeleton className="h-44 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
