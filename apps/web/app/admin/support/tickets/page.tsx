'use client';

import Link from 'next/link';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Copy,
  Flame,
  LifeBuoy,
  RefreshCw,
  Search,
  Ticket as TicketIcon,
  X,
} from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { SupportAdminTicket, SupportTicketPriority, SupportTicketStatus } from '@zenx-go/api-client';
import { useSupportAdminTickets } from '@/hooks/use-support';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/user-avatar';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { CommonTable, type ColumnDef, type TableAction } from '@/components/ui/common-table';

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
  const [pageSize, setPageSize] = useState(20);

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
      pageSize,
      search: debounced || undefined,
      status: status || undefined,
      priority: priority || undefined,
      assignee: assignee || undefined,
      unreadOnly,
    }),
    [page, pageSize, debounced, status, priority, assignee, unreadOnly],
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

  const columns = useMemo<ColumnDef<SupportAdminTicket>[]>(
    () => [
      {
        id: 'ticket',
        header: 'Mã & Nội dung yêu cầu',
        minWidth: 260,
        cell: (ticket) => (
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700 whitespace-nowrap shrink-0">
                {ticket.ticketNo}
              </span>
              {ticket.unread ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200/80 px-2 py-0.5 text-[10px] font-bold text-rose-700 whitespace-nowrap shrink-0">
                  <span className="size-1.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                  Mới
                </span>
              ) : null}
            </div>
            <h4 className="mt-1 text-sm font-bold text-slate-900 group-hover:text-[#00873E] transition-colors line-clamp-1">
              {ticket.subject}
            </h4>
          </div>
        ),
      },
      {
        id: 'customer',
        header: 'Khách hàng',
        minWidth: 180,
        cell: (ticket) => (
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
        ),
      },
      {
        id: 'category',
        header: 'Chuyên mục',
        minWidth: 140,
        cell: (ticket) => (
          <span className="inline-flex items-center rounded-md border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 whitespace-nowrap shrink-0">
            {ticket.category.name}
          </span>
        ),
      },
      {
        id: 'priority',
        header: 'Mức ưu tiên',
        minWidth: 130,
        cell: (ticket) => <PriorityBadge priority={ticket.priority} />,
      },
      {
        id: 'status',
        header: 'Trạng thái',
        minWidth: 140,
        cell: (ticket) => <StatusBadge status={ticket.status} />,
      },
      {
        id: 'assignee',
        header: 'Chuyên viên',
        minWidth: 160,
        cell: (ticket) =>
          ticket.assignee ? (
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
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 italic whitespace-nowrap shrink-0">
              <span className="size-1.5 rounded-full bg-slate-300 shrink-0" />
              Chưa phân công
            </span>
          ),
      },
      {
        id: 'lastActivity',
        header: 'Hoạt động cuối',
        minWidth: 140,
        cell: (ticket) => (
          <span className="font-mono text-xs text-slate-600 whitespace-nowrap">
            {formatDate(ticket.lastActivityAt ?? ticket.updatedAt)}
          </span>
        ),
      },
    ],
    [],
  );

  const actions = (ticket: SupportAdminTicket): TableAction<SupportAdminTicket>[] => [
    {
      key: 'view',
      label: 'Xem chi tiết ticket',
      icon: ChevronRight,
      href: `/admin/support/tickets/${encodeURIComponent(ticket.ticketNo)}`,
    },
    {
      key: 'copy',
      label: 'Sao chép mã ticket',
      icon: Copy,
      onClick: () => {
        navigator.clipboard.writeText(ticket.ticketNo);
        toast.success(`Đã sao chép mã ${ticket.ticketNo}`);
      },
    },
  ];

  return (
    <div className="space-y-4 w-full">
      {/* Header */}
      <PageHeader
        title="Hàng đợi Xử lý Yêu cầu"
        icon={LifeBuoy}
        description="Tiếp nhận yêu cầu từ người chơi, phân công và cập nhật tiến độ xử lý."
        badge={
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
            {totalCount} yêu cầu
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs text-slate-500 hover:text-slate-800 h-8 px-2.5"
              >
                <X className="size-3.5 mr-1" />
                Xóa bộ lọc
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void tickets.refetch()}
              disabled={tickets.isFetching}
              className="text-xs h-8 px-3 rounded-xl"
            >
              <RefreshCw className={`size-3.5 mr-1.5 ${tickets.isFetching ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
            <Button asChild size="sm" className="text-xs h-8 px-3.5 rounded-xl font-bold bg-[#00873E] text-white hover:bg-[#007033] shadow-xs">
              <Link href="/admin/support">
                <LifeBuoy className="size-4 mr-1.5" /> Tổng quan hỗ trợ
              </Link>
            </Button>
          </div>
        }
        className="pb-3 border-b border-slate-100"
      />

      {/* Filter Toolbar */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
        <div className="flex flex-col gap-3">
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 size-3.5 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo mã ticket, tiêu đề, tên user…"
                className="pl-8 pr-8 h-8 rounded-xl text-xs"
                aria-label="Tìm ticket"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
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
              className="h-8 rounded-xl text-xs"
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
              className="h-8 rounded-xl text-xs"
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
              className="h-8 rounded-xl text-xs"
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
      {tickets.isError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-xs">
          <p className="font-bold">Không thể tải danh sách hàng đợi ticket.</p>
          <p className="mt-1 text-xs text-rose-600">
            Vui lòng kiểm tra lại kết nối mạng hoặc phiên đăng nhập.
          </p>
        </div>
      ) : (
        <CommonTable<SupportAdminTicket>
          showIndexColumn
          data={tickets.data?.items ?? []}
          columns={columns}
          actions={actions}
          actionHeaderTitle="Thao tác"
          onRowClick={(ticket) => router.push(`/admin/support/tickets/${encodeURIComponent(ticket.ticketNo)}`)}
          isLoading={tickets.isLoading}
          isFetching={tickets.isFetching}
          emptyTitle="Không có ticket nào"
          emptyDescription={
            hasActiveFilters
              ? 'Không có yêu cầu nào khớp với các điều kiện lọc hiện tại.'
              : 'Hàng đợi đang trống. Tuyệt vời! Tất cả yêu cầu người chơi đã được giải quyết.'
          }
          emptyIcon={TicketIcon}
          emptyAction={
            hasActiveFilters ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="mt-3 text-xs gap-1.5 border-slate-200 font-semibold"
              >
                <X className="size-3" /> Xóa bộ lọc
              </Button>
            ) : undefined
          }
          pagination={{
            page,
            pageSize,
            totalItems: totalCount,
            onPageChange: (newPage) => setPage(newPage),
            onPageSizeChange: (newSize) => {
              setPageSize(newSize);
              setPage(1);
            },
            pageSizeOptions: [10, 20, 50],
          }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'NEW') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200/80 px-2.5 py-0.5 text-xs font-semibold text-sky-700 whitespace-nowrap shrink-0">
        <span className="size-1.5 rounded-full bg-sky-500" />
        Mới tiếp nhận
      </span>
    );
  }
  if (status === 'IN_PROGRESS') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 text-xs font-semibold text-amber-700 whitespace-nowrap shrink-0">
        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
        Đang xử lý
      </span>
    );
  }
  if (status === 'WAITING_USER') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200/80 px-2.5 py-0.5 text-xs font-semibold text-purple-700 whitespace-nowrap shrink-0">
        <span className="size-1.5 rounded-full bg-purple-500" />
        Chờ phản hồi
      </span>
    );
  }
  if (status === 'RESOLVED') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 whitespace-nowrap shrink-0">
        <CheckCircle2 className="size-3 text-emerald-600" />
        Đã giải quyết
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600 whitespace-nowrap shrink-0">
      Đã đóng
    </span>
  );
}

function PriorityBadge({ priority }: { priority?: string | null }) {
  if (priority === 'URGENT') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200/80 px-2.5 py-0.5 text-xs font-bold text-rose-700 whitespace-nowrap shrink-0">
        <Flame className="size-3 text-rose-600 fill-rose-500" />
        Khẩn cấp
      </span>
    );
  }
  if (priority === 'HIGH') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 text-xs font-semibold text-amber-700 whitespace-nowrap shrink-0">
        <span className="size-1.5 rounded-full bg-amber-500" />
        Cao
      </span>
    );
  }
  if (priority === 'LOW') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 whitespace-nowrap shrink-0">
        <span className="size-1.5 rounded-full bg-slate-200" />
        Thấp
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 whitespace-nowrap shrink-0">
      <span className="size-1.5 rounded-full bg-slate-300" />
      Bình thường
    </span>
  );
}
