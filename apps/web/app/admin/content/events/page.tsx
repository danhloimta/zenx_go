'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileEdit,
  Flag,
  Gamepad2,
  Globe,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { AdminContentEvent, ContentPublishStatus } from '@zenx-go/api-client';
import { useAdminContentEvents, useAdminContentGames } from '@/hooks/use-content';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, mediaUrl } from '@/lib/utils';
import { CommonTable, type ColumnDef, type TableAction } from '@/components/ui/common-table';

export default function AdminContentEventsPage() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [gameId, setGameId] = useState('');
  const [status, setStatus] = useState<'' | ContentPublishStatus>('');
  const [timelineFilter, setTimelineFilter] = useState<'' | 'HAPPENING' | 'UPCOMING' | 'ENDED'>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const games = useAdminContentGames({ page: 1, pageSize: 50 });

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
      gameId: gameId || undefined,
      status: status || undefined,
    }),
    [debounced, gameId, page, pageSize, status],
  );

  const events = useAdminContentEvents(query);
  const totalPages = Math.max(1, events.data?.totalPages ?? 1);
  const totalCount = events.data?.total ?? 0;

  // Filter client-side by timeline if chosen
  const filteredItems = useMemo(() => {
    if (!events.data?.items) return [];
    if (!timelineFilter) return events.data.items;
    const now = new Date().getTime();
    return events.data.items.filter((item) => {
      const start = new Date(item.startsAt).getTime();
      const end = item.endsAt ? new Date(item.endsAt).getTime() : null;

      if (timelineFilter === 'UPCOMING') {
        return start > now;
      }
      if (timelineFilter === 'ENDED') {
        return end !== null && end < now;
      }
      if (timelineFilter === 'HAPPENING') {
        return start <= now && (end === null || end >= now);
      }
      return true;
    });
  }, [events.data?.items, timelineFilter]);

  // KPI calculations
  const now = new Date().getTime();
  const happeningCount = useMemo(() => {
    if (!events.data?.items) return 0;
    return events.data.items.filter((e) => {
      const start = new Date(e.startsAt).getTime();
      const end = e.endsAt ? new Date(e.endsAt).getTime() : null;
      return e.status === 'PUBLISHED' && start <= now && (end === null || end >= now);
    }).length;
  }, [events.data?.items, now]);

  const publishedCount = events.data?.items.filter((e) => e.status === 'PUBLISHED').length ?? 0;
  const draftCount = events.data?.items.filter((e) => e.status === 'DRAFT').length ?? 0;
  const hasActiveFilters = Boolean(debounced || gameId || status || timelineFilter);

  const handleResetFilters = () => {
    setSearch('');
    setDebounced('');
    setGameId('');
    setStatus('');
    setTimelineFilter('');
    setPage(1);
  };

  const columns = useMemo<ColumnDef<AdminContentEvent>[]>(
    () => [
      {
        id: 'title',
        header: 'Sự kiện & Banner',
        minWidth: 320,
        cell: (event) => (
          <Link
            href={`/admin/content/events/${event.id}`}
            className="flex items-start gap-3.5 group"
          >
            <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 shadow-2xs">
              {event.coverImageUrl ? (
                <img
                  src={mediaUrl(event.coverImageUrl)}
                  alt={event.title}
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : null}
              <div className="absolute inset-0 -z-10 flex items-center justify-center bg-violet-50 text-violet-600">
                <CalendarDays className="size-5" />
              </div>
            </div>

            <div className="min-w-0 max-w-md">
              <h3 className="line-clamp-1 font-bold text-slate-900 group-hover:text-[#00873E] transition-colors">
                {event.title}
              </h3>
              <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                {event.excerpt || 'Không có tóm tắt...'}
              </p>
              <p className="mt-0.5 flex items-center gap-1 font-mono text-[11px] text-slate-400">
                <span>/{event.slug}</span>
              </p>
            </div>
          </Link>
        ),
      },
      {
        id: 'scope',
        header: 'Phạm vi áp dụng',
        minWidth: 160,
        cell: (event) =>
          event.game ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 whitespace-nowrap shrink-0">
              <Gamepad2 className="size-3.5 text-[#00873E] shrink-0" />
              {event.game.name}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 whitespace-nowrap shrink-0">
              <Globe className="size-3.5 text-[#00873E] shrink-0" />
              Toàn Portal
            </span>
          ),
      },
      {
        id: 'dates',
        header: 'Mốc thời gian',
        minWidth: 200,
        cell: (event) => (
          <div className="space-y-0.5 text-xs whitespace-nowrap">
            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
              <Calendar className="size-3.5 text-slate-400 shrink-0" />
              <span>{formatDate(event.startsAt)}</span>
            </div>
            <div className="text-[11px] text-slate-400 pl-5">
              {event.endsAt ? `đến ${formatDate(event.endsAt)}` : 'Không giới hạn thời gian'}
            </div>
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Tiến độ & Trạng thái',
        minWidth: 160,
        cell: (event) => (
          <div className="space-y-1">
            <div>
              <EventTimelineBadge startsAt={event.startsAt} endsAt={event.endsAt} />
            </div>
            <div>
              <StatusBadge status={event.status} />
            </div>
          </div>
        ),
      },
    ],
    [],
  );

  const actions = (event: AdminContentEvent): TableAction<AdminContentEvent>[] => [
    {
      key: 'edit',
      label: 'Chỉnh sửa sự kiện',
      icon: FileEdit,
      href: `/admin/content/events/${event.id}`,
    },
  ];

  return (
    <div className="space-y-4 w-full">
      {/* Header */}
      <PageHeader
        title="Sự kiện & Giải đấu Portal"
        icon={CalendarDays}
        description="Quản lý các sự kiện in-game, đua top, giải đấu cộng đồng và mốc thời gian."
        badge={
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
            {totalCount} sự kiện
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
              onClick={() => void events.refetch()}
              disabled={events.isFetching}
              className="text-xs h-8 px-3 rounded-xl"
            >
              <RefreshCw className={`size-3.5 mr-1.5 ${events.isFetching ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
            <Button asChild size="sm" className="text-xs h-8 px-3.5 rounded-xl font-bold bg-[#00873E] text-white hover:bg-[#007033] shadow-xs">
              <Link href="/admin/content/events/new">
                <Plus className="size-4 mr-1.5" /> Tạo sự kiện mới
              </Link>
            </Button>
          </div>
        }
        className="pb-3 border-b border-slate-100"
      />

      {/* Quick Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => {
            setTimelineFilter('');
            setStatus('');
            setPage(1);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
            !timelineFilter && !status
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <span>Tất cả</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
              !timelineFilter && !status ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
            }`}
          >
            {totalCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTimelineFilter('HAPPENING');
            setPage(1);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
            timelineFilter === 'HAPPENING'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span>Đang diễn ra (Hot)</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
              timelineFilter === 'HAPPENING' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {happeningCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatus('PUBLISHED');
            setTimelineFilter('');
            setPage(1);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
            status === 'PUBLISHED' && !timelineFilter
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <span className="size-1.5 rounded-full bg-sky-500" />
          <span>Đã xuất bản</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
              status === 'PUBLISHED' && !timelineFilter ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-800'
            }`}
          >
            {publishedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatus('DRAFT');
            setTimelineFilter('');
            setPage(1);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
            status === 'DRAFT' && !timelineFilter
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <span className="size-1.5 rounded-full bg-amber-500" />
          <span>Bản nháp</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
              status === 'DRAFT' && !timelineFilter ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {draftCount}
          </span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-3.5 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm tiêu đề sự kiện, slug, trích dẫn…"
            className="pl-8 pr-8 h-8 rounded-xl text-xs"
            aria-label="Tìm sự kiện"
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
          value={gameId}
          onChange={(event) => {
            setGameId(event.target.value);
            setPage(1);
          }}
          className="h-8 rounded-xl text-xs"
          aria-label="Lọc phạm vi game"
        >
          <option value="">Tất cả phạm vi (Portal & Game)</option>
          {(games.data?.items ?? []).map((game) => (
            <option key={game.id} value={game.id}>
              {game.name} ({game.code})
            </option>
          ))}
        </Select>

        <Select
          value={timelineFilter}
          onChange={(event) => {
            setTimelineFilter(event.target.value as '' | 'HAPPENING' | 'UPCOMING' | 'ENDED');
          }}
          className="h-8 rounded-xl text-xs"
          aria-label="Lọc tiến độ thời gian"
        >
          <option value="">Tất cả tiến độ</option>
          <option value="HAPPENING">Đang diễn ra</option>
          <option value="UPCOMING">Sắp diễn ra</option>
          <option value="ENDED">Đã kết thúc</option>
        </Select>
      </div>

          {/* Filter badges */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-xs">
              <span className="flex items-center gap-1 font-semibold text-slate-500">
                <SlidersHorizontal className="size-3.5 text-[#00873E]" /> Đang lọc:
              </span>
              {debounced && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700">
                  Từ khoá: &quot;{debounced}&quot;
                </span>
              )}
              {gameId && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-medium text-[#00873E]">
                  Game: {games.data?.items.find((g) => g.id === gameId)?.name ?? gameId}
                </span>
              )}
              {timelineFilter && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 font-medium text-blue-700">
                  Tiến độ: {timelineFilter === 'HAPPENING' ? 'Đang diễn ra' : timelineFilter === 'UPCOMING' ? 'Sắp diễn ra' : 'Đã kết thúc'}
                </span>
              )}
              {status && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 font-medium text-purple-700">
                  Trạng thái: {status === 'PUBLISHED' ? 'Đã xuất bản' : 'Bản nháp'}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-6 px-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                Đặt lại
              </Button>
            </div>
          )}

      {/* Main Table Content */}
      {events.isError && !events.data ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-xs">
          <p className="font-bold">Không thể tải danh sách sự kiện.</p>
          <p className="mt-1 text-xs text-rose-600">
            Vui lòng kiểm tra lại đường truyền mạng hoặc đăng nhập.
          </p>
        </div>
      ) : (
        <CommonTable<AdminContentEvent>
          showIndexColumn
          data={filteredItems}
          columns={columns}
          actions={actions}
          actionHeaderTitle="Thao tác"
          isLoading={events.isLoading}
          isFetching={events.isFetching}
          emptyTitle="Không tìm thấy sự kiện nào"
          emptyDescription={
            hasActiveFilters
              ? 'Không có sự kiện nào khớp với tiêu chí tìm kiếm hoặc bộ lọc hiện tại của bạn.'
              : 'Hệ thống chưa có sự kiện nào. Hãy bấm "Tạo sự kiện mới" để bắt đầu.'
          }
          emptyIcon={CalendarDays}
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
            ) : (
              <Button asChild size="sm" className="mt-3 bg-[#00873E] text-white hover:bg-[#007033] font-semibold">
                <Link href="/admin/content/events/new">
                  <Plus className="size-4 mr-1" /> Tạo sự kiện mới
                </Link>
              </Button>
            )
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

function EventTimelineBadge({ startsAt, endsAt }: { startsAt: string; endsAt?: string | null }) {
  const now = new Date().getTime();
  const start = new Date(startsAt).getTime();
  const end = endsAt ? new Date(endsAt).getTime() : null;

  if (start > now) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 whitespace-nowrap shrink-0">
        <Clock className="size-3 shrink-0" /> Sắp diễn ra
      </span>
    );
  }

  if (end !== null && end < now) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 whitespace-nowrap shrink-0">
        <Flag className="size-3 shrink-0" /> Đã kết thúc
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 whitespace-nowrap shrink-0">
      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" /> Đang diễn ra
    </span>
  );
}

function StatusBadge({ status }: { status: ContentPublishStatus }) {
  return status === 'PUBLISHED' ? (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 whitespace-nowrap shrink-0">
      Đã xuất bản
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 whitespace-nowrap shrink-0">
      Bản nháp
    </span>
  );
}

function EventListSkeleton() {
  return (
    <div className="space-y-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <Skeleton className="h-10 w-full rounded-2xl" />
      {[1, 2, 3, 4, 5].map((value) => (
        <div key={value} className="flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-14 w-24 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-28 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
