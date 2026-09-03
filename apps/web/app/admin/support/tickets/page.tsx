'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, Search, Ticket as TicketIcon } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { SupportTicketPriority, SupportTicketStatus } from '@zenx-go/api-client';
import { useSupportAdminTickets } from '@/hooks/use-support';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  supportPriorityClass,
  supportPriorityLabel,
  supportStatusClass,
  supportStatusLabel,
} from '@/lib/support';
import { formatDate } from '@/lib/utils';

const statusOptions: Array<{ value: '' | SupportTicketStatus; label: string }> = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'NEW', label: 'Mới tiếp nhận' },
  { value: 'IN_PROGRESS', label: 'Đang xử lý' },
  { value: 'WAITING_USER', label: 'Chờ phản hồi' },
  { value: 'RESOLVED', label: 'Đã giải quyết' },
  { value: 'CLOSED', label: 'Đã đóng' },
];
const priorityOptions: Array<{ value: '' | SupportTicketPriority; label: string }> = [
  { value: '', label: 'Tất cả ưu tiên' },
  { value: 'URGENT', label: 'Khẩn cấp' },
  { value: 'HIGH', label: 'Cao' },
  { value: 'NORMAL', label: 'Bình thường' },
  { value: 'LOW', label: 'Thấp' },
];

export default function SupportAdminTicketsPage() {
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
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-[#00873E]">Support Operations</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Hàng đợi ticket</h2>
        <p className="mt-1 text-sm text-slate-500">
          Nhận việc, phân công và theo dõi yêu cầu khách hàng.
        </p>
      </div>
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_190px_170px_170px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm mã ticket, subject, user…"
              className="pl-10"
              aria-label="Tìm ticket"
            />
          </div>
          <Select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as '' | SupportTicketStatus);
              setPage(1);
            }}
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
            aria-label="Lọc phân công"
          >
            <option value="">Tất cả người xử lý</option>
            <option value="UNASSIGNED">Chưa nhận</option>
            <option value="ME">Ticket của tôi</option>
          </Select>
        </div>
        <label className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(event) => {
              setUnreadOnly(event.target.checked);
              setPage(1);
            }}
            className="size-3.5 rounded border-slate-300 text-[#00873E] focus:ring-[#00873E]"
          />{' '}
          Chỉ xem ticket chưa đọc
        </label>
      </section>
      {tickets.isLoading ? (
        <TicketSkeleton />
      ) : tickets.isError || !tickets.data ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
          Không thể tải hàng đợi ticket.
        </div>
      ) : (
        <>
          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="divide-y divide-slate-100">
              {tickets.data.items.length ? (
                tickets.data.items.map((ticket) => (
                  <Link
                    key={ticket.ticketNo}
                    href={`/admin/support/tickets/${encodeURIComponent(ticket.ticketNo)}`}
                    className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 gap-3">
                      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#00873E]">
                        <TicketIcon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-[#00873E]">
                            {ticket.ticketNo}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${supportPriorityClass(ticket.priority)}`}
                          >
                            {supportPriorityLabel(ticket.priority)}
                          </span>
                          {ticket.unread ? (
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                              Chưa đọc
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 truncate text-sm font-bold text-slate-800">
                          {ticket.subject}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {ticket.user.profile?.fullName || ticket.user.username} ·{' '}
                          {ticket.category.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400">
                          {ticket.assignee?.fullName || ticket.assignee?.username || 'Chưa nhận'}
                        </p>
                        <p
                          className={`mt-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${supportStatusClass(ticket.status)}`}
                        >
                          {supportStatusLabel(ticket.status)}
                        </p>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {formatDate(ticket.lastActivityAt ?? ticket.updatedAt)}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-12 text-center">
                  <TicketIcon className="mx-auto size-10 text-slate-300" />
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    Không có ticket phù hợp
                  </p>
                </div>
              )}
            </div>
          </section>
          <div className="flex flex-col items-center justify-between gap-3 text-xs text-slate-500 sm:flex-row">
            <span>{tickets.data.total.toLocaleString('vi-VN')} ticket</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={page <= 1 || tickets.isFetching}
              >
                <ChevronLeft className="size-4" /> Trước
              </Button>
              <span className="min-w-24 text-center font-semibold text-slate-700">
                Trang {tickets.data.page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((value) => value + 1)}
                disabled={page >= totalPages || tickets.isFetching}
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

function TicketSkeleton() {
  return (
    <div className="space-y-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      {[1, 2, 3, 4, 5].map((value) => (
        <Skeleton key={value} className="h-16 rounded-xl" />
      ))}
    </div>
  );
}
