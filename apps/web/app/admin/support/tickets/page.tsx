'use client';

import Link from 'next/link';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Flame,
  LifeBuoy,
  RefreshCw,
  Search,
  Ticket as TicketIcon,
  X,
} from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { SupportTicketPriority, SupportTicketStatus } from '@zenx-go/api-client';
import { useSupportAdminTickets } from '@/hooks/use-support';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/user-avatar';
import { formatDate } from '@/lib/utils';

const statusOptions: Array<{ value: '' | SupportTicketStatus; label: string }> = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'NEW', label: 'Mới tiếp nhận' },
  { value: 'IN_PROGRESS', label: 'Đang xử lý' },
  { value: 'WAITING_USER', label: 'Chờ khách phản hồi' },
  { value: 'RESOLVED', label: 'Đã giải quyết' },
  { value: 'CLOSED', label: 'Đã đóng' },
];

const priorityOptions: Array<{ value: '' | SupportTicketPriority; label: string }> = [
  { value: '', label: 'Tất cả độ ưu tiên' },
  { value: 'URGENT', label: 'Khẩn cấp (Urgent)' },
  { value: 'HIGH', label: 'Mức cao (High)' },
  { value: 'NORMAL', label: 'Bình thường' },
  { value: 'LOW', label: 'Mức thấp' },
];

export default function SupportAdminTicketsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState<'' | SupportTicketStatus>('');
  const [priority, setPriority] = useState<'' | SupportTicketPriority>('');
  const [assignee, setAssignee] = useState<'' | 'ME' | 'UNASSIGNED'>('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const initialAssignee = params.get('assignee');
    if (initialAssignee === 'ME' || initialAssignee === 'UNASSIGNED') setAssignee(initialAssignee);
    const initialStatus = params.get('status');
    if (
      initialStatus === 'NEW' ||
      initialStatus === 'IN_PROGRESS' ||
      initialStatus === 'WAITING_USER' ||
      initialStatus === 'RESOLVED' ||
      initialStatus === 'CLOSED'
    ) {
      setStatus(initialStatus);
    }
    if (params.get('unreadOnly') === 'true') setUnreadOnly(true);
  }, [params]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const query = useMemo(
    () => ({
      page,
      pageSize: 20,
      search: debounced || undefined,
      status: status || undefined,
      priority: priority || undefined,
      assignee: assignee || undefined,
      unreadOnly,
    }),
    [page, debounced, status, priority, assignee, unreadOnly],
  );

  const tickets = useSupportAdminTickets(query);
  const totalPages = Math.max(1, tickets.data?.totalPages ?? 1);
  const totalCount = tickets.data?.total ?? 0;

  const hasActiveFilters = Boolean(debounced || status || priority || assignee || unreadOnly);

  const handleResetFilters = () => {
    setSearch('');
    setDebounced('');
    setStatus('');
    setPriority('');
    setAssignee('');
    setUnreadOnly(false);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-100/70 bg-gradient-to-r from-emerald-500/10 via-emerald-50/50 to-white p-6 sm:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00873E]/10 px-3 py-1 text-xs font-bold text-[#00873E]">
                <LifeBuoy className="size-3.5" /> Support Operations
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {totalCount} tickets phù hợp
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Hàng đợi Xử lý Yêu cầu
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Danh sách tiếp nhận yêu cầu từ người chơi, phân công chuyên viên và cập nhật tiến độ xử lý.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void tickets.refetch()}
              disabled={tickets.isFetching}
              className="gap-2 bg-white"
            >
              <RefreshCw className={`size-3.5 ${tickets.isFetching ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
            <Button asChild size="sm" className="gap-2 bg-[#00873E] text-white hover:bg-[#007033]">
              <Link href="/admin/support">
                <LifeBuoy className="size-4" /> Tổng quan Support
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo mã ticket, tiêu đề, tên user…"
                className="h-10 pl-10 pr-9 text-sm"
                aria-label="Tìm ticket"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <Select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as '' | SupportTicketStatus);
                setPage(1);
              }}
              className="h-10 text-sm"
              aria-label="Lọc trạng thái"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>

            <Select
              value={priority}
              onChange={(event) => {
                setPriority(event.target.value as '' | SupportTicketPriority);
                setPage(1);
              }}
              className="h-10 text-sm"
              aria-label="Lọc ưu tiên"
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>

            <Select
              value={assignee}
              onChange={(event) => {
                setAssignee(event.target.value as '' | 'ME' | 'UNASSIGNED');
                setPage(1);
              }}
              className="h-10 text-sm"
              aria-label="Lọc phân công"
            >
              <option value="">Tất cả người xử lý</option>
              <option value="UNASSIGNED">Chưa nhận xử lý</option>
              <option value="ME">Được giao cho tôi</option>
            </Select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <label className="inline-flex cursor-pointer select-none items-center gap-2 text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(event) => {
                  setUnreadOnly(event.target.checked);
                  setPage(1);
                }}
                className="size-4 rounded border-slate-300 text-[#00873E] focus:ring-[#00873E]"
              />
              <span className="flex items-center gap-1.5">
                <CircleAlert className="size-3.5 text-rose-500" />
                Chỉ hiển thị ticket có tin nhắn chưa đọc
              </span>
            </label>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-7 text-xs text-rose-600 hover:bg-rose-50"
              >
                Đặt lại toàn bộ bộ lọc
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Main Table / List Content */}
      {tickets.isLoading ? (
        <TicketListSkeleton />
      ) : tickets.isError || !tickets.data ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-xs">
          <p className="font-bold">Không thể tải danh sách hàng đợi ticket.</p>
          <p className="mt-1 text-xs text-rose-600">
            Vui lòng kiểm tra lại kết nối mạng hoặc phiên đăng nhập.
          </p>
        </div>
      ) : tickets.data.items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#00873E]">
            <TicketIcon className="size-7" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">Không có ticket nào</h3>
          <p className="mx-auto mt-1.5 max-w-md text-xs text-slate-500">
            {hasActiveFilters
              ? 'Không có yêu cầu nào khớp với các điều kiện lọc hiện tại.'
              : 'Hàng đợi đang trống. Tuyệt vời! Tất cả yêu cầu người chơi đã được giải quyết.'}
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="mt-4 text-xs"
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>
      ) : (
        <>
          <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
            {/* Desktop Table View */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  <tr>
                    <th className="px-6 py-3.5">Mã & Nội dung yêu cầu</th>
                    <th className="px-4 py-3.5">Khách hàng</th>
                    <th className="px-4 py-3.5">Chuyên mục</th>
                    <th className="px-4 py-3.5">Mức ưu tiên</th>
                    <th className="px-4 py-3.5">Trạng thái</th>
                    <th className="px-4 py-3.5">Chuyên viên</th>
                    <th className="px-6 py-3.5 text-right">Hoạt động cuối</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets.data.items.map((ticket) => (
                    <tr
                      key={ticket.ticketNo}
                      onClick={() => router.push(`/admin/support/tickets/${encodeURIComponent(ticket.ticketNo)}`)}
                      className="group cursor-pointer transition-colors hover:bg-emerald-50/20"
                    >
                      {/* Ticket Code & Subject */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700 group-hover:bg-[#00873E]/10 group-hover:text-[#00873E] transition-colors">
                            {ticket.ticketNo}
                          </span>
                          {ticket.unread ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200/80 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                              <span className="size-1.5 rounded-full bg-rose-500 animate-ping" />
                              Mới
                            </span>
                          ) : null}
                        </div>
                        <h4 className="mt-1 text-sm font-bold text-slate-900 group-hover:text-[#00873E] transition-colors line-clamp-1">
                          {ticket.subject}
                        </h4>
                      </td>

                      {/* Customer Info */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar
                            id={ticket.user.id}
                            name={ticket.user.profile?.fullName}
                            username={ticket.user.username}
                            email={ticket.user.email}
                            avatarUrl={ticket.user.profile?.avatarUrl}
                            size="sm"
                            className="ring-1 ring-slate-200 shrink-0"
                          />
                          <div className="min-w-0 max-w-[150px]">
                            <p className="truncate text-xs font-semibold text-slate-900">
                              {ticket.user.profile?.fullName || ticket.user.username}
                            </p>
                            <p className="truncate text-[11px] text-slate-400">
                              {ticket.user.email || `@${ticket.user.username}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center rounded-md border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {ticket.category.name}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-4">
                        <PriorityBadge priority={ticket.priority} />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <StatusBadge status={ticket.status} />
                      </td>

                      {/* Assignee */}
                      <td className="px-4 py-4">
                        {ticket.assignee ? (
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              id={ticket.assignee.id}
                              name={ticket.assignee.fullName}
                              username={ticket.assignee.username}
                              size="xs"
                              className="ring-1 ring-slate-200 shrink-0"
                            />
                            <span className="truncate text-xs font-medium text-slate-800">
                              {ticket.assignee.fullName || ticket.assignee.username}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 italic">
                            <span className="size-1.5 rounded-full bg-slate-300" />
                            Chưa phân công
                          </span>
                        )}
                      </td>

                      {/* Last Activity */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-mono text-xs text-slate-600">
                            {formatDate(ticket.lastActivityAt ?? ticket.updatedAt)}
                          </span>
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-300 group-hover:bg-[#00873E]/10 group-hover:text-[#00873E] transition-all">
                            <ChevronRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="grid divide-y divide-slate-100 lg:hidden">
              {tickets.data.items.map((ticket) => (
                <Link
                  key={ticket.ticketNo}
                  href={`/admin/support/tickets/${encodeURIComponent(ticket.ticketNo)}`}
                  className="block p-4 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700">
                        {ticket.ticketNo}
                      </span>
                      {ticket.unread ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200/80 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                          <span className="size-1.5 rounded-full bg-rose-500 animate-ping" />
                          Mới
                        </span>
                      ) : null}
                    </div>
                    <StatusBadge status={ticket.status} />
                  </div>

                  <h4 className="mt-2 text-sm font-bold text-slate-900 line-clamp-1">{ticket.subject}</h4>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <PriorityBadge priority={ticket.priority} />
                    <span className="rounded-md border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                      {ticket.category.name}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 truncate">
                      <UserAvatar
                        id={ticket.user.id}
                        name={ticket.user.profile?.fullName}
                        username={ticket.user.username}
                        avatarUrl={ticket.user.profile?.avatarUrl}
                        size="xs"
                      />
                      <span className="truncate font-medium text-slate-700">
                        {ticket.user.profile?.fullName || ticket.user.username}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400 shrink-0">
                      {formatDate(ticket.lastActivityAt ?? ticket.updatedAt)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Pagination Footer */}
          <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-3.5 text-xs text-slate-500 shadow-xs sm:flex-row">
            <span>
              Hiển thị <strong>{tickets.data.items.length}</strong> / <strong>{totalCount}</strong> ticket (Trang {tickets.data.page} / {totalPages})
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={page <= 1 || tickets.isFetching}
                className="h-8 gap-1 rounded-xl px-3 text-xs"
              >
                <ChevronLeft className="size-4" /> Trước
              </Button>
              <div className="flex items-center gap-1 px-1 font-semibold text-slate-700">
                {page} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((value) => value + 1)}
                disabled={page >= totalPages || tickets.isFetching}
                className="h-8 gap-1 rounded-xl px-3 text-xs"
              >
                Sau <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TicketListSkeleton() {
  return (
    <div className="space-y-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <Skeleton className="h-10 w-full rounded-2xl" />
      {[1, 2, 3, 4, 5].map((value) => (
        <div key={value} className="flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'NEW') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200/80 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
        <span className="size-1.5 rounded-full bg-sky-500" />
        Mới tiếp nhận
      </span>
    );
  }
  if (status === 'IN_PROGRESS') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
        Đang xử lý
      </span>
    );
  }
  if (status === 'WAITING_USER') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200/80 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
        <span className="size-1.5 rounded-full bg-purple-500" />
        Chờ phản hồi
      </span>
    );
  }
  if (status === 'RESOLVED') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="size-3 text-emerald-600" />
        Đã giải quyết
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">
      Đã đóng
    </span>
  );
}

function PriorityBadge({ priority }: { priority?: string | null }) {
  if (priority === 'URGENT') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200/80 px-2.5 py-0.5 text-xs font-bold text-rose-700">
        <Flame className="size-3 text-rose-600 fill-rose-500" />
        Khẩn cấp
      </span>
    );
  }
  if (priority === 'HIGH') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
        <span className="size-1.5 rounded-full bg-amber-500" />
        Cao
      </span>
    );
  }
  if (priority === 'LOW') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
        <span className="size-1.5 rounded-full bg-slate-200" />
        Thấp
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
      <span className="size-1.5 rounded-full bg-slate-300" />
      Bình thường
    </span>
  );
}
