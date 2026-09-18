'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Inbox,
  LifeBuoy,
  RefreshCw,
  Search,
  Ticket as TicketIcon,
  UserCheck,
  X,
} from 'lucide-react';
import type { SupportTicketPriority, SupportTicketStatus } from '@zenx-go/api-client';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/user-avatar';
import { formatDate } from '@/lib/utils';
import {
  supportPriorityClass,
  supportPriorityLabel,
  supportStatusClass,
  supportStatusLabel,
} from '@/lib/support';

const queueCards = [
  {
    key: 'NEW' as const,
    label: 'Cần tiếp nhận',
    desc: 'Chưa có người tiếp nhận',
    icon: Inbox,
    tone: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  {
    key: 'IN_PROGRESS' as const,
    label: 'Đang xử lý',
    desc: 'Được phân công xử lý',
    icon: UserCheck,
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  {
    key: 'WAITING_USER' as const,
    label: 'Chờ phản hồi',
    desc: 'Người chơi đang chờ trả lời',
    icon: CircleAlert,
    tone: 'bg-rose-50 text-rose-700 border-rose-100',
  },
  {
    key: 'RESOLVED' as const,
    label: 'Đã giải quyết',
    desc: 'Xử lý thành công gần đây',
    icon: CheckCircle2,
    tone: 'bg-slate-50 text-slate-700 border-slate-200',
  },
];

const priorityOptions: Array<{ value: '' | SupportTicketPriority; label: string }> = [
  { value: '', label: 'Tất cả độ ưu tiên' },
  { value: 'URGENT', label: 'Khẩn cấp (Urgent)' },
  { value: 'HIGH', label: 'Mức cao (High)' },
  { value: 'NORMAL', label: 'Bình thường (Normal)' },
  { value: 'LOW', label: 'Mức thấp (Low)' },
];

const statusFilterTabs: Array<{ key: '' | SupportTicketStatus; label: string }> = [
  { key: '', label: 'Tất cả' },
  { key: 'NEW', label: 'Mới tiếp nhận' },
  { key: 'IN_PROGRESS', label: 'Đang xử lý' },
  { key: 'WAITING_USER', label: 'Chờ khách' },
  { key: 'RESOLVED', label: 'Đã giải quyết' },
  { key: 'CLOSED', label: 'Đã đóng' },
];

export default function GameSupportAdminPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState<'' | SupportTicketStatus>('');
  const [priority, setPriority] = useState<'' | SupportTicketPriority>('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    const initialStatus = searchParams.get('status');
    if (
      initialStatus === 'NEW' ||
      initialStatus === 'IN_PROGRESS' ||
      initialStatus === 'WAITING_USER' ||
      initialStatus === 'RESOLVED' ||
      initialStatus === 'CLOSED'
    ) {
      setStatus(initialStatus);
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const context = useQuery({
    queryKey: ['game-admin', 'context', subdomain],
    queryFn: () => api.gameAdmin.context(subdomain),
    retry: false,
  });

  const gameId = context.data?.game.id;

  const ticketsQuery = useQuery({
    queryKey: [
      'game-admin',
      'support-tickets',
      gameId,
      { page, pageSize, search: debounced, status, priority },
    ],
    queryFn: () =>
      api.gameAdmin.support.tickets(gameId!, {
        page,
        pageSize,
        search: debounced || undefined,
        status: status || undefined,
        priority: priority || undefined,
      }),
    enabled: Boolean(gameId),
    retry: false,
    placeholderData: (prev) => prev,
    refetchInterval: 30_000,
  });

  if (context.isLoading) return <SupportDashboardSkeleton />;

  if (context.isError || !context.data) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-xs">
        <p className="font-bold">Không thể tải dữ liệu quản trị game.</p>
        <p className="mt-1 text-xs text-rose-600">
          Vui lòng kiểm tra quyền hạn CS/Admin hoặc thử làm mới lại trang.
        </p>
      </div>
    );
  }

  const game = context.data.game;
  const stats = ticketsQuery.data?.stats?.byStatus;
  const totalTickets =
    (stats
      ? Object.values(stats).reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0)
      : ticketsQuery.data?.total) ?? 0;

  const totalPages = Math.max(1, ticketsQuery.data?.totalPages ?? 1);
  const totalCount = ticketsQuery.data?.total ?? 0;
  const hasActiveFilters = Boolean(debounced || status || priority);

  const handleResetFilters = () => {
    setSearch('');
    setDebounced('');
    setStatus('');
    setPriority('');
    setPage(1);
  };

  const handleCardFilter = (cardKey: SupportTicketStatus) => {
    if (status === cardKey) {
      setStatus('');
    } else {
      setStatus(cardKey);
    }
    setPage(1);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <PageHeader
        title={`Trung tâm Hỗ trợ Người chơi · ${game.name}`}
        icon={LifeBuoy}
        description={`Tiếp nhận, phân luồng yêu cầu, phản hồi ticket và hỗ trợ cộng đồng người chơi game ${game.name}.`}
        badge={
          <div className="flex items-center gap-1.5">
            <span className="rounded-md bg-emerald-100/90 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
              {game.code}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {totalTickets} tickets
            </span>
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void ticketsQuery.refetch();
              }}
              disabled={ticketsQuery.isFetching}
              className="h-8 text-xs gap-1.5"
            >
              <RefreshCw
                className={`size-3.5 ${ticketsQuery.isFetching ? 'animate-spin' : ''}`}
              />
              Làm mới
            </Button>
          </div>
        }
        className="pb-3 border-b border-slate-100"
      />

      {/* 4 Core Actionable Metrics Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {queueCards.map((card) => {
          const Icon = card.icon;
          const value = stats ? stats[card.key] ?? 0 : 0;
          const isSelected = status === card.key;

          return (
            <button
              type="button"
              key={card.key}
              onClick={() => handleCardFilter(card.key)}
              className={`group relative text-left overflow-hidden rounded-2xl border p-4 shadow-xs transition duration-200 hover:-translate-y-0.5 ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-400/20'
                  : 'border-slate-200/80 bg-white hover:border-emerald-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p
                    className={`text-xs font-semibold ${
                      isSelected ? 'text-[#00873E]' : 'text-slate-500 group-hover:text-[#00873E]'
                    }`}
                  >
                    {card.label}
                  </p>
                  <div className="mt-1.5 flex items-baseline gap-2">
                    <span className="text-2xl font-black tracking-tight text-slate-900">
                      {value}
                    </span>
                    {card.key === 'NEW' && value > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                        <span className="size-1.5 rounded-full bg-blue-500 animate-ping" /> Cần nhận
                      </span>
                    )}
                    {card.key === 'WAITING_USER' && value > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                        <span className="size-1.5 rounded-full bg-rose-500 animate-ping" /> Chờ trả lời
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-400">{card.desc}</p>
                </div>
                <span
                  className={`flex size-10 items-center justify-center rounded-xl border ${card.tone} shadow-2xs transition-transform duration-300 group-hover:scale-105`}
                >
                  <Icon className="size-4" />
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-[#00873E]">
                {isSelected ? 'Đang lọc trạng thái này' : 'Lọc danh sách'}
                <ArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Tickets Main Section */}
      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        {/* Section Header & Inline Status Tabs */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-[#00873E]/10 text-[#00873E]">
                <TicketIcon className="size-4" />
              </span>
              <h3 className="text-base font-black text-slate-900">Yêu cầu vừa có hoạt động mới</h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Danh sách các ticket nhận tin nhắn mới hoặc vừa được cập nhật workflow gần nhất.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {statusFilterTabs.map((tab) => {
              const count =
                tab.key === ''
                  ? totalTickets
                  : stats
                    ? stats[tab.key] ?? 0
                    : 0;
              const isActive = status === tab.key;

              return (
                <button
                  type="button"
                  key={tab.key}
                  onClick={() => {
                    setStatus(tab.key);
                    setPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-[#00873E] text-white shadow-xs'
                      : 'border border-slate-200/80 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-black shadow-2xs ${
                      isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Toolbar: Search & Priority */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-6 py-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm mã ticket, tiêu đề, người chơi, email..."
                className="h-9 pl-9 text-xs bg-white"
              />
            </div>

            <div className="w-48">
              <Select
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value as SupportTicketPriority | '');
                  setPage(1);
                }}
                className="h-9 text-xs bg-white"
              >
                {priorityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 text-xs gap-1 text-slate-500 hover:text-slate-900"
              >
                <X className="size-3.5" /> Xóa bộ lọc
              </Button>
            )}
          </div>

          <div className="text-xs text-slate-400">
            Hiển thị <span className="font-bold text-slate-700">{ticketsQuery.data?.items.length ?? 0}</span> / {totalCount} yêu cầu
          </div>
        </div>

        {/* Ticket List Rows */}
        {ticketsQuery.isLoading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3, 4].map((value) => (
              <div key={value} className="flex items-center justify-between gap-4 py-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : ticketsQuery.isError ? (
          <div className="p-8 text-center text-sm text-slate-500">
            <p className="font-semibold text-slate-700">Không thể tải danh sách ticket</p>
            <p className="text-xs text-slate-400 mt-1">Vui lòng thử làm mới lại hoặc kiểm tra kết nối mạng.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void ticketsQuery.refetch()}
              className="mt-3 text-xs"
            >
              Thử lại
            </Button>
          </div>
        ) : ticketsQuery.data?.items.length ? (
          <div className="divide-y divide-slate-100">
            {ticketsQuery.data.items.map((ticket) => (
              <Link
                key={ticket.ticketNo}
                href={`/admin/support/${encodeURIComponent(ticket.ticketNo)}`}
                className="group flex flex-col gap-3.5 px-6 py-4 transition-all hover:bg-slate-50/90 sm:flex-row sm:items-center sm:justify-between"
              >
                {/* Left: Avatar + Details */}
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="relative shrink-0">
                    <UserAvatar
                      id={ticket.user.id ?? ''}
                      name={ticket.user.fullName ?? ticket.user.username}
                      username={ticket.user.username}
                      email={ticket.user.email ?? undefined}
                      avatarUrl={ticket.user.avatarUrl ?? undefined}
                      size="md"
                      className="ring-2 ring-slate-100 group-hover:ring-emerald-200 transition-all"
                    />
                    {ticket.status === 'NEW' ? (
                      <span
                        className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-blue-500 ring-2 ring-white animate-pulse"
                        title="Ticket mới tiếp nhận"
                      />
                    ) : ticket.unread ? (
                      <span
                        className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse"
                        title="Có tin nhắn chưa đọc"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700 group-hover:bg-[#00873E]/10 group-hover:text-[#00873E] transition-colors">
                        {ticket.ticketNo}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${supportPriorityClass(
                          ticket.priority,
                        )}`}
                      >
                        {supportPriorityLabel(ticket.priority)}
                      </span>
                      <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {ticket.category.name}
                      </span>
                      {ticket.status === 'NEW' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200/80 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          <span className="size-1.5 rounded-full bg-blue-500 animate-ping" />
                          Mới tiếp nhận
                        </span>
                      ) : null}
                    </div>

                    <h4 className="mt-1 text-sm font-bold text-slate-900 group-hover:text-[#00873E] transition-colors truncate">
                      {ticket.subject}
                    </h4>

                    <p className="mt-0.5 text-xs text-slate-500 truncate">
                      <span className="font-semibold text-slate-700">
                        {ticket.user.fullName || ticket.user.username}
                      </span>
                      {ticket.user.email ? (
                        <span className="text-slate-400"> ({ticket.user.email})</span>
                      ) : null}
                      {ticket.user.phone ? (
                        <span className="text-slate-400"> · {ticket.user.phone}</span>
                      ) : null}
                    </p>
                  </div>
                </div>

                {/* Right: Status, Assignee, Activity Time & Action Arrow */}
                <div className="flex shrink-0 items-center justify-between gap-4 sm:gap-6 self-stretch sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {/* Status & Assignee */}
                  <div className="flex flex-col items-start sm:items-end">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${supportStatusClass(
                        ticket.status,
                      )}`}
                    >
                      {supportStatusLabel(ticket.status)}
                    </span>
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                      <span className="text-slate-400">Phụ trách:</span>
                      <span
                        className={`font-semibold ${
                          ticket.assignee ? 'text-emerald-700' : 'text-slate-500'
                        }`}
                      >
                        {ticket.assignee?.fullName || ticket.assignee?.username || 'Chưa nhận'}
                      </span>
                    </div>
                  </div>

                  {/* Activity Timestamp */}
                  <div className="hidden md:flex flex-col items-end min-w-[135px] text-right">
                    <div className="flex items-center justify-end gap-1 text-xs font-semibold text-slate-700">
                      <Clock3 className="size-3 text-slate-400 shrink-0" />
                      <span>{formatDate(ticket.lastActivityAt ?? ticket.updatedAt)}</span>
                    </div>
                    <span className="mt-0.5 text-[10px] text-slate-400">Hoạt động gần nhất</span>
                  </div>

                  {/* Action Chevron */}
                  <div className="hidden sm:flex size-7 items-center justify-center rounded-lg text-slate-300 group-hover:bg-[#00873E]/10 group-hover:text-[#00873E] transition-all">
                    <ChevronRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <CheckCircle2 className="mx-auto size-12 text-emerald-300" />
            <p className="mt-3 text-base font-bold text-slate-800">
              {hasActiveFilters
                ? 'Không tìm thấy yêu cầu phù hợp'
                : 'Tất cả ticket đã được xử lý'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {hasActiveFilters
                ? 'Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn bộ lọc trạng thái.'
                : 'Không có yêu cầu hỗ trợ nào đang chờ xử lý trong danh sách gần đây.'}
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
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 text-xs text-slate-500 bg-slate-50/50">
            <div>
              Trang <span className="font-bold text-slate-700">{page}</span> / {totalPages} (Tổng {totalCount} kết quả)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 px-2.5 text-xs gap-1"
              >
                <ChevronLeft className="size-3.5" /> Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-8 px-2.5 text-xs gap-1"
              >
                Sau <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function SupportDashboardSkeleton() {
  return (
    <div className="space-y-6 w-full">
      <Skeleton className="h-28 rounded-3xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((value) => (
          <Skeleton key={value} className="h-32 rounded-3xl" />
        ))}
      </div>
      <Skeleton className="h-[480px] rounded-3xl" />
    </div>
  );
}
