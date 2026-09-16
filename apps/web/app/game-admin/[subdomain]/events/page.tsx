'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ContentPublishStatus } from '@zenx-go/api-client';
import {
  Calendar,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  ExternalLink,
  Eye,
  FileEdit,
  Globe,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  SearchX,
  ShieldAlert,
  Sparkles,
  Tag,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { gameContentWorkspace } from '@/components/admin-content/content-workspace-adapter';

// Cấu hình nhãn trạng thái công bố bài viết/sự kiện
const PUBLISH_STATUS_CONFIG: Record<
  ContentPublishStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  PUBLISHED: {
    label: 'Đang hiển thị',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500 animate-pulse',
  },
  DRAFT: {
    label: 'Bản nháp',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
  },
};

type EventTimeStatus = 'ACTIVE' | 'UPCOMING' | 'ENDED';

function getEventTimeStatus(startsAt: string, endsAt?: string | null): EventTimeStatus {
  const now = Date.now();
  const start = new Date(startsAt).getTime();
  const end = endsAt ? new Date(endsAt).getTime() : null;

  if (now < start) return 'UPCOMING';
  if (end && now > end) return 'ENDED';
  return 'ACTIVE';
}

function getTimeStatusBadge(timeStatus: EventTimeStatus) {
  switch (timeStatus) {
    case 'ACTIVE':
      return {
        label: 'Đang diễn ra',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotClass: 'bg-emerald-500 animate-pulse',
        icon: Sparkles,
      };
    case 'UPCOMING':
      return {
        label: 'Sắp diễn ra',
        badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
        dotClass: 'bg-sky-500',
        icon: CalendarClock,
      };
    case 'ENDED':
      return {
        label: 'Đã kết thúc',
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
        dotClass: 'bg-slate-400',
        icon: CalendarCheck2,
      };
  }
}

function getEventDurationText(startsAt: string, endsAt?: string | null): string {
  const now = Date.now();
  const start = new Date(startsAt).getTime();
  const end = endsAt ? new Date(endsAt).getTime() : null;

  if (now < start) {
    const diffDays = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? 'Bắt đầu vào ngày mai' : `Bắt đầu sau ${diffDays} ngày`;
  }
  if (end) {
    if (now > end) {
      return 'Sự kiện đã khép lại';
    }
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? 'Còn 1 ngày cuối' : `Còn ${diffDays} ngày nữa`;
  }
  return 'Không giới hạn thời gian';
}

export default function GameEventsPage() {
  const { subdomain } = useParams<{ subdomain: string }>();

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState<'' | ContentPublishStatus>('');
  const [timeFilter, setTimeFilter] = useState<'' | EventTimeStatus>('');
  const [page, setPage] = useState(1);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  // 1. Lấy thông tin game theo subdomain
  const context = useQuery({
    queryKey: ['game-admin', 'context', subdomain],
    queryFn: () => api.gameAdmin.context(subdomain),
    retry: false,
  });

  const game = context.data?.game;
  const gameId = game?.id;

  const workspace = useMemo(
    () => (gameId && game ? gameContentWorkspace(gameId, game.name, subdomain) : null),
    [gameId, game, subdomain],
  );

  // Debounce tìm kiếm
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  // 2. Query danh sách sự kiện chính
  const eventsQuery = useQuery({
    queryKey: ['game-admin', 'events', gameId, page, debounced, status],
    queryFn: () =>
      workspace!.events({
        page,
        pageSize: 10,
        search: debounced || undefined,
        status: status || undefined,
      }),
    enabled: Boolean(workspace),
    retry: false,
    placeholderData: (previous) => previous,
  });

  const isSearchLoading = search !== debounced || (eventsQuery.isFetching && search.length > 0);

  // 3. Các query đếm thống kê nhanh
  const countTotalQuery = useQuery({
    queryKey: ['game-admin', 'events', gameId, 'count', 'total'],
    queryFn: () => workspace!.events({ page: 1, pageSize: 10 }),
    enabled: Boolean(workspace),
    staleTime: 30_000,
  });

  const countPublishedQuery = useQuery({
    queryKey: ['game-admin', 'events', gameId, 'count', 'published'],
    queryFn: () => workspace!.events({ page: 1, pageSize: 10, status: 'PUBLISHED' }),
    enabled: Boolean(workspace),
    staleTime: 30_000,
  });

  const countDraftQuery = useQuery({
    queryKey: ['game-admin', 'events', gameId, 'count', 'draft'],
    queryFn: () => workspace!.events({ page: 1, pageSize: 10, status: 'DRAFT' }),
    enabled: Boolean(workspace),
    staleTime: 30_000,
  });

  const handleRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      await Promise.all([
        eventsQuery.refetch(),
        countTotalQuery.refetch(),
        countPublishedQuery.refetch(),
        countDraftQuery.refetch(),
      ]);
      toast.success('Đã cập nhật danh sách sự kiện mới nhất');
    } catch {
      toast.error('Lỗi khi tải lại dữ liệu sự kiện');
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const resetAllFilters = () => {
    setSearch('');
    setDebounced('');
    setStatus('');
    setTimeFilter('');
    setPage(1);
  };

  const base = '/admin/events';

  if (context.isError || (!context.isLoading && !context.data)) {
    return (
      <div className="rounded-xl border border-red-200/80 bg-red-50/80 p-6 text-sm text-red-700 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="size-5 shrink-0 text-red-600" />
          <h3 className="font-bold text-base">Không có quyền xem sự kiện của game này</h3>
        </div>
        <p className="mt-2 text-xs text-red-600 leading-relaxed">
          Tài khoản của bạn chưa được phân quyền quản trị sự kiện hoặc trò chơi không tồn tại. Vui lòng kiểm tra lại.
        </p>
      </div>
    );
  }

  const rawItems = eventsQuery.data?.items ?? [];
  // Lọc theo thời gian diễn ra nếu người dùng chọn
  const items = timeFilter
    ? rawItems.filter((e) => getEventTimeStatus(e.startsAt, e.endsAt) === timeFilter)
    : rawItems;

  const totalItems = eventsQuery.data?.total ?? 0;
  const totalPages = eventsQuery.data?.totalPages ?? 1;

  // Lấy dữ liệu đếm từ query chuyên biệt hoặc fallback từ eventsQuery
  const totalAllCount =
    countTotalQuery.data?.total ??
    (!debounced && status === '' ? eventsQuery.data?.total : 0) ??
    0;
  const totalPublishedCount =
    countPublishedQuery.data?.total ??
    (!debounced && status === 'PUBLISHED' ? eventsQuery.data?.total : 0) ??
    0;
  const totalDraftCount =
    countDraftQuery.data?.total ??
    (!debounced && status === 'DRAFT' ? eventsQuery.data?.total : 0) ??
    0;

  // Lấy danh sách sự kiện đầy đủ để tính chính xác trạng thái thời gian
  const allAvailableEvents = countTotalQuery.data?.items ?? rawItems;
  const activeEventsCount = allAvailableEvents.filter(
    (e) => getEventTimeStatus(e.startsAt, e.endsAt) === 'ACTIVE',
  ).length;
  const upcomingEventsCount = allAvailableEvents.filter(
    (e) => getEventTimeStatus(e.startsAt, e.endsAt) === 'UPCOMING',
  ).length;

  const hasActiveFilters = Boolean(search || status || timeFilter);

  return (
    <div className="space-y-4 sm:space-y-5 pb-12 w-full relative">
      {/* Top Progress Line khi API đang fetch */}
      {(eventsQuery.isFetching || isManualRefreshing) && (
        <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-emerald-100 overflow-hidden">
          <div className="h-full w-2/5 bg-gradient-to-r from-emerald-500 via-teal-400 to-[#00873E] animate-[pulse_1s_ease-in-out_infinite] rounded-full" />
        </div>
      )}

      {/* 1. Phần Đầu Trang - Rõ Ràng & Thân Thiện */}
      <div className="flex flex-col gap-3.5 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-emerald-100/90 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-800">
              {game?.code ?? 'GAME'}
            </span>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
              Quản lý sự kiện · {game?.name ?? 'Trò chơi'}
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Lên lịch, tổ chức các giải đấu, chuỗi sự kiện ingame và ưu đãi đặc biệt dành cho cộng đồng game thủ.
          </p>
        </div>

        {/* Nút hành động đầu trang */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isManualRefreshing || eventsQuery.isFetching}
            className="h-9 px-3 gap-1.5 rounded-lg border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            <RefreshCw
              className={`size-3.5 ${
                isManualRefreshing || eventsQuery.isFetching ? 'animate-spin text-[#00873E]' : ''
              }`}
            />
            <span>{isManualRefreshing ? 'Đang tải…' : 'Làm mới'}</span>
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 px-3 gap-1.5 rounded-lg border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            <Link href="/events" target="_blank">
              <Globe className="size-3.5 text-emerald-600" />
              <span>Xem trang Sự kiện</span>
              <ExternalLink className="size-3 text-slate-400" />
            </Link>
          </Button>

          <Button
            asChild
            size="sm"
            className="h-9 px-3.5 gap-1.5 rounded-lg bg-[#00873E] text-xs font-bold text-white shadow-2xs hover:bg-[#007033]"
          >
            <Link href={`${base}/new`}>
              <Plus className="size-3.5" />
              <span>Tạo sự kiện mới</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Bốn Thẻ Thống Kê Nhanh (Click Lọc Tức Thì) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Thẻ 1: Tất cả sự kiện */}
        <button
          type="button"
          onClick={() => {
            setStatus('');
            setTimeFilter('');
            setPage(1);
          }}
          className={`text-left transition-all p-3.5 sm:p-4 rounded-xl border bg-white shadow-2xs hover:shadow-xs ${
            status === '' && timeFilter === ''
              ? 'border-[#00873E] ring-2 ring-[#00873E]/10 bg-emerald-50/20'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tất cả sự kiện</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
              <CalendarDays className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900">
              {countTotalQuery.isLoading ? '—' : totalAllCount}
            </span>
            <span className="text-[11px] text-slate-500">sự kiện đã tạo</span>
          </div>
        </button>

        {/* Thẻ 2: Đang & Sắp diễn ra */}
        <button
          type="button"
          onClick={() => {
            if (activeEventsCount > 0) {
              setTimeFilter('ACTIVE');
            } else if (upcomingEventsCount > 0) {
              setTimeFilter('UPCOMING');
            } else {
              setTimeFilter('');
            }
            setPage(1);
          }}
          className={`text-left transition-all p-3.5 sm:p-4 rounded-xl border bg-white shadow-2xs hover:shadow-xs ${
            timeFilter === 'ACTIVE' || timeFilter === 'UPCOMING'
              ? 'border-emerald-500 ring-2 ring-emerald-500/10 bg-emerald-50/30'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Đang & Sắp diễn ra</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Sparkles className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-emerald-700">
              {countTotalQuery.isLoading && eventsQuery.isLoading
                ? '—'
                : activeEventsCount + upcomingEventsCount}
            </span>
            <span className="text-[11px] text-slate-500">
              {activeEventsCount > 0 && upcomingEventsCount > 0
                ? `${activeEventsCount} đang mở, ${upcomingEventsCount} sắp tới`
                : activeEventsCount > 0
                ? 'sự kiện đang mở'
                : upcomingEventsCount > 0
                ? 'sự kiện sắp bắt đầu'
                : 'sự kiện hiệu lực'}
            </span>
          </div>
        </button>

        {/* Thẻ 3: Đã xuất bản lên web */}
        <button
          type="button"
          onClick={() => {
            setStatus('PUBLISHED');
            setTimeFilter('');
            setPage(1);
          }}
          className={`text-left transition-all p-3.5 sm:p-4 rounded-xl border bg-white shadow-2xs hover:shadow-xs ${
            status === 'PUBLISHED' && timeFilter === ''
              ? 'border-teal-500 ring-2 ring-teal-500/10 bg-teal-50/30'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Đã công bố</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <CheckCircle2 className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-teal-700">
              {countPublishedQuery.isLoading ? '—' : totalPublishedCount}
            </span>
            <span className="text-[11px] text-slate-500">hiển thị công khai</span>
          </div>
        </button>

        {/* Thẻ 4: Bản nháp */}
        <button
          type="button"
          onClick={() => {
            setStatus('DRAFT');
            setTimeFilter('');
            setPage(1);
          }}
          className={`text-left transition-all p-3.5 sm:p-4 rounded-xl border bg-white shadow-2xs hover:shadow-xs ${
            status === 'DRAFT'
              ? 'border-amber-500 ring-2 ring-amber-500/10 bg-amber-50/30'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Bản nháp</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <FileEdit className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-amber-700">
              {countDraftQuery.isLoading ? '—' : totalDraftCount}
            </span>
            <span className="text-[11px] text-slate-500">đang chuẩn bị</span>
          </div>
        </button>
      </div>

      {/* 3. Bảng Quản Lý Sự Kiện - Tích Hợp Tìm Kiếm, Bộ Lọc & Dữ Liệu Chuẩn Admin */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        {/* Thanh công cụ: Tìm kiếm & Bộ lọc nhanh */}
        <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Nhóm Tabs trạng thái công bố */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-200/60 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setStatus('');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                status === ''
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({totalAllCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatus('PUBLISHED');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                status === 'PUBLISHED'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đang hiển thị ({totalPublishedCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatus('DRAFT');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                status === 'DRAFT'
                  ? 'bg-white text-amber-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bản nháp ({totalDraftCount})
            </button>
          </div>

          {/* Nhóm Tìm kiếm & Lọc thời gian */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Trạng thái đang tải ngầm */}
            {eventsQuery.isFetching && !eventsQuery.isLoading && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 rounded-full border border-emerald-200/80 shrink-0">
                <Loader2 className="size-3 animate-spin text-[#00873E]" />
                <span>Đang tải…</span>
              </div>
            )}

            {/* Ô tìm kiếm */}
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tiêu đề, nội dung sự kiện…"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#00873E] focus:ring-2 focus:ring-[#00873E]/10"
              />
              {isSearchLoading ? (
                <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 animate-spin text-[#00873E]" />
              ) : search ? (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  title="Xóa tìm kiếm"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>

            {/* Dropdown Lọc thời gian diễn ra */}
            <select
              aria-label="Lọc thời gian sự kiện"
              value={timeFilter}
              onChange={(e) => {
                setTimeFilter(e.target.value as '' | EventTimeStatus);
                setPage(1);
              }}
              className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 outline-none transition focus:border-[#00873E] focus:ring-2 focus:ring-[#00873E]/10 cursor-pointer"
            >
              <option value="">Tất cả thời gian</option>
              <option value="ACTIVE">🟢 Đang diễn ra</option>
              <option value="UPCOMING">⏳ Sắp diễn ra</option>
              <option value="ENDED">🏁 Đã kết thúc</option>
            </select>

            {/* Nút đặt lại bộ lọc */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAllFilters}
                className="h-9 px-2.5 text-xs text-slate-500 hover:text-slate-900 gap-1"
              >
                <X className="size-3.5" />
                <span>Đặt lại</span>
              </Button>
            )}
          </div>
        </div>

        {/* Bảng dữ liệu sự kiện */}
        {eventsQuery.isLoading && !eventsQuery.data ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-2 border-b border-slate-100 last:border-0">
                <Skeleton className="h-14 w-22 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-4 w-32 shrink-0" />
                <Skeleton className="h-6 w-24 rounded-full shrink-0" />
                <Skeleton className="h-8 w-20 rounded-lg shrink-0" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          /* Trạng thái trống */
          <div className="flex flex-col items-center justify-center p-12 text-center">
            {hasActiveFilters ? (
              <>
                <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <SearchX className="size-6" />
                </div>
                <h3 className="mt-3.5 text-sm font-bold text-slate-900">
                  Không tìm thấy sự kiện nào
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm">
                  Không có sự kiện nào khớp với từ khóa tìm kiếm hoặc khoảng thời gian bạn vừa chọn.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetAllFilters}
                  className="mt-4 h-8 text-xs font-semibold"
                >
                  Xóa tất cả bộ lọc
                </Button>
              </>
            ) : (
              <>
                <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <CalendarDays className="size-6" />
                </div>
                <h3 className="mt-3.5 text-sm font-bold text-slate-900">
                  Chưa có sự kiện nào được tạo
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm">
                  Hãy lên lịch và tạo sự kiện đầu tiên để thu hút và khuấy động cộng đồng người chơi nhé!
                </p>
                <Button
                  asChild
                  size="sm"
                  className="mt-4 h-8 bg-[#00873E] text-xs font-bold text-white hover:bg-[#007033]"
                >
                  <Link href={`${base}/new`}>
                    <Plus className="mr-1.5 size-3.5" />
                    Tạo sự kiện mới ngay
                  </Link>
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Sự kiện</th>
                  <th className="py-3 px-4 w-64">Thời gian tổ chức</th>
                  <th className="py-3 px-4 w-44">Trạng thái</th>
                  <th className="py-3 px-4 w-36 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {items.map((event) => {
                  const timeStatus = getEventTimeStatus(event.startsAt, event.endsAt);
                  const timeBadge = getTimeStatusBadge(timeStatus);
                  const pubConfig =
                    PUBLISH_STATUS_CONFIG[event.status as ContentPublishStatus] || {
                      label: event.status,
                      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                      dotClass: 'bg-slate-400',
                    };
                  const durationText = getEventDurationText(event.startsAt, event.endsAt);
                  const startDateFormatted = formatDate(event.startsAt);
                  const endDateFormatted = event.endsAt
                    ? formatDate(event.endsAt)
                    : 'Vô thời hạn';
                  const TimeIcon = timeBadge.icon;

                  return (
                    <tr
                      key={event.id}
                      className="group hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Cột 1: Thông tin sự kiện */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-3.5">
                          {/* Ảnh bìa thumbnail */}
                          <div className="relative w-20 h-13 shrink-0 overflow-hidden rounded-lg border border-slate-200/80 bg-slate-100">
                            {event.coverImageUrl ? (
                              <img
                                src={event.coverImageUrl}
                                alt={event.title}
                                className="size-full object-cover transition duration-200 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center bg-slate-100 text-slate-400">
                                <CalendarDays className="size-5" />
                              </div>
                            )}
                          </div>

                          {/* Tiêu đề + Trích dẫn + Slug */}
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-slate-900 text-sm leading-snug truncate hover:text-[#00873E] transition-colors">
                              <Link href={`${base}/${event.id}`}>{event.title}</Link>
                            </h3>
                            {event.excerpt && (
                              <p className="text-slate-500 text-xs line-clamp-1 mt-0.5 leading-relaxed">
                                {event.excerpt}
                              </p>
                            )}
                            <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
                              /events/{event.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Thời gian tổ chức */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium text-xs">
                            <Calendar className="size-3.5 text-slate-400 shrink-0" />
                            <span>{startDateFormatted}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <span className="text-slate-400">đến</span>
                            <span>{endDateFormatted}</span>
                          </div>
                          <div className="pt-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                              <Clock className="size-3 text-slate-400" />
                              {durationText}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 3: Trạng thái */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex flex-col gap-1.5 items-start">
                          {/* Trạng thái hiển thị */}
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${pubConfig.badgeClass}`}
                          >
                            <span className={`size-1.5 rounded-full ${pubConfig.dotClass}`} />
                            {pubConfig.label}
                          </span>
                          {/* Tiến độ thời gian */}
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${timeBadge.badgeClass}`}
                          >
                            <TimeIcon className="size-3" />
                            {timeBadge.label}
                          </span>
                        </div>
                      </td>

                      {/* Cột 4: Thao tác */}
                      <td className="py-3.5 px-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {event.status === 'PUBLISHED' && (
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2.5 text-xs text-slate-600 hover:text-[#00873E] hover:bg-emerald-50"
                              title="Xem trang sự kiện trên web"
                            >
                              <Link
                                href={`/events/${event.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Eye className="size-3.5 mr-1 text-slate-500" />
                                <span>Xem</span>
                              </Link>
                            </Button>
                          )}
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 rounded-lg border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs"
                          >
                            <Link href={`${base}/${event.id}`}>
                              <Edit3 className="size-3.5 mr-1 text-slate-500" />
                              <span>Sửa</span>
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Phân trang (Pagination) Tích hợp ở đáy bảng */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 bg-slate-50/50 text-xs text-slate-500">
            <div>
              Hiển thị sự kiện{' '}
              <strong className="text-slate-800">
                {(page - 1) * 10 + 1} - {Math.min(page * 10, totalItems)}
              </strong>{' '}
              trên tổng số <strong className="text-slate-800">{totalItems}</strong> sự kiện
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7.5 px-2.5 text-xs font-medium rounded-md border-slate-200 bg-white"
              >
                <ChevronLeft className="size-3 mr-0.5" />
                <span>Trang trước</span>
              </Button>

              <span className="px-2.5 py-1 font-semibold text-slate-700 bg-white border border-slate-200 rounded-md">
                {page} / {Math.max(1, totalPages)}
              </span>

              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-7.5 px-2.5 text-xs font-medium rounded-md border-slate-200 bg-white"
              >
                <span>Trang sau</span>
                <ChevronRight className="size-3 ml-0.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
