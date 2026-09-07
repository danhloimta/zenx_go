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
import type { ContentPublishStatus } from '@zenx-go/api-client';
import { useAdminContentEvents, useAdminContentGames } from '@/hooks/use-content';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, mediaUrl } from '@/lib/utils';

export default function AdminContentEventsPage() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [gameId, setGameId] = useState('');
  const [status, setStatus] = useState<'' | ContentPublishStatus>('');
  const [timelineFilter, setTimelineFilter] = useState<'' | 'HAPPENING' | 'UPCOMING' | 'ENDED'>('');
  const [page, setPage] = useState(1);

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
      pageSize: 15,
      search: debounced || undefined,
      gameId: gameId || undefined,
      status: status || undefined,
    }),
    [debounced, gameId, page, status],
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

  return (
    <div className="space-y-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Sự kiện & Giải đấu Portal
            </h1>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
              {totalCount} sự kiện
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý các sự kiện in-game, đua top, giải đấu cộng đồng và mốc thời gian.
          </p>
        </div>

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
      </div>

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

      {/* Main List Content */}
      {events.isLoading ? (
        <EventListSkeleton />
      ) : events.isError || !events.data ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-xs">
          <p className="font-bold">Không thể tải danh sách sự kiện.</p>
          <p className="mt-1 text-xs text-rose-600">
            Vui lòng kiểm tra lại đường truyền mạng hoặc đăng nhập.
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
            <CalendarDays className="size-7" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">Không tìm thấy sự kiện nào</h3>
          <p className="mx-auto mt-1.5 max-w-md text-xs text-slate-500">
            {hasActiveFilters
              ? 'Không có sự kiện nào khớp với tiêu chí tìm kiếm hoặc bộ lọc hiện tại của bạn.'
              : 'Hệ thống chưa có sự kiện nào. Hãy bấm "Tạo sự kiện mới" để bắt đầu.'}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            {hasActiveFilters ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs"
              >
                Xóa bộ lọc
              </Button>
            ) : null}
            <Button asChild size="sm" className="bg-[#00873E] text-white hover:bg-[#007033]">
              <Link href="/admin/content/events/new">
                <Plus className="size-4" /> Tạo sự kiện mới
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
            {/* Desktop Table View */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  <tr>
                    <th className="px-6 py-4">Sự kiện & Banner</th>
                    <th className="px-5 py-4">Phạm vi áp dụng</th>
                    <th className="px-5 py-4">Mốc thời gian diễn ra</th>
                    <th className="px-5 py-4">Tiến độ & Trạng thái</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((event) => (
                    <tr
                      key={event.id}
                      className="group transition-colors hover:bg-slate-50/80"
                    >
                      {/* Title & Banner Cover */}
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/content/events/${event.id}`}
                          className="flex items-start gap-4"
                        >
                          <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-100 shadow-xs">
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
                            <h3 className="line-clamp-1 font-bold text-slate-900 group-hover:text-[#00873E]">
                              {event.title}
                            </h3>
                            <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                              {event.excerpt || 'Không có tóm tắt...'}
                            </p>
                            <p className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                              <span>/{event.slug}</span>
                            </p>
                          </div>
                        </Link>
                      </td>

                      {/* Game Scope */}
                      <td className="px-5 py-4">
                        {event.game ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                            <Gamepad2 className="size-3.5 text-[#00873E]" />
                            {event.game.name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
                            <Globe className="size-3.5 text-[#00873E]" />
                            Toàn Portal
                          </span>
                        )}
                      </td>

                      {/* Event Dates */}
                      <td className="px-5 py-4">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <Calendar className="size-3.5 text-slate-400" />
                            <span>{formatDate(event.startsAt)}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 pl-5">
                            {event.endsAt ? `đến ${formatDate(event.endsAt)}` : 'Không giới hạn thời gian'}
                          </div>
                        </div>
                      </td>

                      {/* Status & Progress */}
                      <td className="px-5 py-4">
                        <div className="space-y-1.5">
                          <EventTimelineBadge startsAt={event.startsAt} endsAt={event.endsAt} />
                          <div>
                            <StatusBadge status={event.status} />
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 rounded-xl px-3 text-xs font-bold text-slate-700 hover:bg-[#00873E]/10 hover:text-[#00873E]"
                        >
                          <Link href={`/admin/content/events/${event.id}`}>
                            <FileEdit className="size-3.5" /> Chỉnh sửa
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards */}
            <div className="grid divide-y divide-slate-100 lg:hidden">
              {filteredItems.map((event) => (
                <div key={event.id} className="p-4 transition hover:bg-slate-50">
                  <div className="flex items-start gap-3.5">
                    <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
                      {event.coverImageUrl ? (
                        <img
                          src={mediaUrl(event.coverImageUrl)}
                          alt={event.title}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-violet-50 text-violet-600">
                          <CalendarDays className="size-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-bold text-[#00873E]">
                          {event.game?.name ?? 'Toàn Portal'}
                        </span>
                        <StatusBadge status={event.status} />
                      </div>
                      <Link
                        href={`/admin/content/events/${event.id}`}
                        className="mt-1 block font-bold text-slate-900 hover:text-[#00873E]"
                      >
                        {event.title}
                      </Link>
                      <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                        {event.excerpt}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <EventTimelineBadge startsAt={event.startsAt} endsAt={event.endsAt} />
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                        <span>Bắt đầu: {formatDate(event.startsAt)}</span>
                        <Link
                          href={`/admin/content/events/${event.id}`}
                          className="inline-flex items-center gap-1 font-bold text-[#00873E]"
                        >
                          Sửa sự kiện <ArrowRight className="size-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Pagination */}
          <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-3.5 text-xs text-slate-500 shadow-xs sm:flex-row">
            <span>
              Hiển thị <strong>{filteredItems.length}</strong> / <strong>{totalCount}</strong> sự kiện (Trang {events.data.page} / {totalPages})
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={page <= 1 || events.isFetching}
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
                disabled={page >= totalPages || events.isFetching}
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

function EventTimelineBadge({ startsAt, endsAt }: { startsAt: string; endsAt?: string | null }) {
  const now = new Date().getTime();
  const start = new Date(startsAt).getTime();
  const end = endsAt ? new Date(endsAt).getTime() : null;

  if (start > now) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
        <Clock className="size-3" /> Sắp diễn ra
      </span>
    );
  }

  if (end !== null && end < now) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
        <Flag className="size-3" /> Đã kết thúc
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Đang diễn ra
    </span>
  );
}

function StatusBadge({ status }: { status: ContentPublishStatus }) {
  return status === 'PUBLISHED' ? (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
      Đã xuất bản
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
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
