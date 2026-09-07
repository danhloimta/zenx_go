'use client';

import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Gamepad2,
  Megaphone,
  Plus,
  Sparkles,
} from 'lucide-react';
import {
  useAdminContentDashboard,
  useAdminContentArticles,
  useAdminContentGames,
  useAdminContentEvents,
} from '@/hooks/use-content';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn, formatDate } from '@/lib/utils';
import type { ContentPublishStatus } from '@zenx-go/api-client';

const categoryLabels: Record<string, string> = {
  DEVELOPMENT_UPDATE: 'Cập nhật',
  ANNOUNCEMENT: 'Thông báo',
  EVENT: 'Sự kiện',
  MAINTENANCE: 'Bảo trì',
};

const lifecycleLabels: Record<string, string> = {
  LIVE: 'Live',
  OPEN_BETA: 'Open Beta',
  CLOSED_BETA: 'Closed Beta',
  IN_DEVELOPMENT: 'Đang phát triển',
  COMING_SOON: 'Sắp ra mắt',
  CONCEPT: 'Ý tưởng',
  INTERNAL_TEST: 'Test nội bộ',
  SUNSET: 'Đã đóng',
};

export default function AdminContentDashboardPage() {
  const query = useAdminContentDashboard();
  const recentArticles = useAdminContentArticles({ page: 1, pageSize: 5 });
  const recentGames = useAdminContentGames({ page: 1, pageSize: 4 });
  const recentEvents = useAdminContentEvents({ page: 1, pageSize: 3 });

  if (query.isLoading) return <ContentDashboardSkeleton />;

  if (query.isError || !query.data) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-xs">
        <div className="flex items-center gap-2 font-bold text-red-800">
          <span>Không thể tải dữ liệu Content CMS</span>
        </div>
        <p className="mt-1 text-xs text-red-600">
          Vui lòng kiểm tra lại kết nối mạng hoặc thử làm mới trang.
        </p>
      </div>
    );
  }

  const stats = query.data;

  const totalArticles = stats.articles.published + stats.articles.draft;
  const totalEvents = stats.events.active + stats.events.upcoming;
  const totalAnnouncements = stats.announcements.published + stats.announcements.draft;

  const gamesPublicPercent =
    stats.games.total > 0 ? Math.round((stats.games.public / stats.games.total) * 100) : 0;
  const articlesPublishedPercent =
    totalArticles > 0 ? Math.round((stats.articles.published / totalArticles) * 100) : 0;
  const eventsActivePercent =
    totalEvents > 0 ? Math.round((stats.events.active / totalEvents) * 100) : 0;
  const announcementsPublishedPercent =
    totalAnnouncements > 0
      ? Math.round((stats.announcements.published / totalAnnouncements) * 100)
      : 0;

  const kpis = [
    {
      key: 'games',
      label: 'Kho Game',
      sublabel: 'Tựa game catalog',
      total: stats.games.total,
      icon: Gamepad2,
      href: '/admin/content/games',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-100',
      accentColor: 'from-blue-600 to-indigo-600',
      pill1: { label: 'Public', val: stats.games.public, tone: 'text-emerald-700 bg-emerald-50' },
      pill2: { label: 'Ẩn', val: stats.games.private, tone: 'text-slate-600 bg-slate-100' },
      progressVal: gamesPublicPercent,
      progressLabel: `${gamesPublicPercent}% công khai`,
    },
    {
      key: 'articles',
      label: 'Bài viết & Tin tức',
      sublabel: 'Ấn phẩm CMS',
      total: totalArticles,
      icon: FileText,
      href: '/admin/content/articles',
      badgeBg: 'bg-emerald-50 text-[#00873E] border-emerald-100',
      accentColor: 'from-emerald-600 to-[#00873E]',
      pill1: {
        label: 'Đã xuất bản',
        val: stats.articles.published,
        tone: 'text-emerald-700 bg-emerald-50',
      },
      pill2: { label: 'Bản nháp', val: stats.articles.draft, tone: 'text-amber-700 bg-amber-50' },
      progressVal: articlesPublishedPercent,
      progressLabel: `${articlesPublishedPercent}% đã đăng`,
    },
    {
      key: 'events',
      label: 'Sự kiện Game',
      sublabel: 'Chiến dịch cộng đồng',
      total: totalEvents,
      icon: CalendarDays,
      href: '/admin/content/events',
      badgeBg: 'bg-violet-50 text-violet-700 border-violet-100',
      accentColor: 'from-violet-600 to-purple-600',
      pill1: {
        label: 'Đang diễn ra',
        val: stats.events.active,
        tone: 'text-violet-700 bg-violet-50',
      },
      pill2: { label: 'Sắp tới', val: stats.events.upcoming, tone: 'text-sky-700 bg-sky-50' },
      progressVal: eventsActivePercent,
      progressLabel: `${eventsActivePercent}% đang chạy`,
    },
    {
      key: 'announcements',
      label: 'Thông báo Portal',
      sublabel: 'Banner & tin hệ thống',
      total: totalAnnouncements,
      icon: Megaphone,
      href: '/admin/content/announcements',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-100',
      accentColor: 'from-amber-500 to-orange-600',
      pill1: {
        label: 'Đang hiển thị',
        val: stats.announcements.published,
        tone: 'text-amber-700 bg-amber-50',
      },
      pill2: {
        label: 'Bản nháp',
        val: stats.announcements.draft,
        tone: 'text-slate-600 bg-slate-100',
      },
      progressVal: announcementsPublishedPercent,
      progressLabel: `${announcementsPublishedPercent}% đang phát`,
    },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Quản trị Nội dung & Game
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Trực tuyến
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Điều phối kho game, bài viết tin tức, sự kiện và banner thông báo portal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            asChild
            size="sm"
            className="bg-[#00873E] text-white hover:bg-[#007234] shadow-xs gap-1.5 font-bold h-8 text-xs"
          >
            <Link href="/admin/content/articles/new">
              <Plus className="size-3.5" />
              Tạo bài viết
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5 font-semibold text-slate-700 h-8 text-xs">
            <Link href="/admin/content/events/new">
              <Plus className="size-3.5" />
              Thêm sự kiện
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="gap-1 text-xs text-slate-500 h-8">
            <Link href="/" target="_blank" rel="noopener noreferrer">
              <span>Xem Portal</span>
              <ExternalLink className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* 4 Primary KPI Summary Cards */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={kpi.key}
              href={kpi.href}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400">{kpi.label}</span>
                  <p className="mt-1 text-3xl font-black text-slate-900 tracking-tight">
                    {kpi.total.toLocaleString('vi-VN')}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{kpi.sublabel}</p>
                </div>
                <span
                  className={cn(
                    'flex size-11 items-center justify-center rounded-2xl border transition-transform duration-200 group-hover:scale-105',
                    kpi.badgeBg,
                  )}
                >
                  <Icon className="size-5.5" />
                </span>
              </div>

              {/* Status Sub-indicators */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className={cn('rounded-md px-2 py-0.5 text-[11px]', kpi.pill1.tone)}>
                    {kpi.pill1.label}: <strong>{kpi.pill1.val}</strong>
                  </span>
                  <span className={cn('rounded-md px-2 py-0.5 text-[11px]', kpi.pill2.tone)}>
                    {kpi.pill2.label}: <strong>{kpi.pill2.val}</strong>
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn(
                        'h-full rounded-full bg-gradient-to-r transition-all duration-500',
                        kpi.accentColor,
                      )}
                      style={{ width: `${Math.min(100, Math.max(0, kpi.progressVal))}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-[10px] font-bold text-slate-400">
                    {kpi.progressVal}%
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-500 group-hover:text-[#00873E]">
                  <span>Vào quản lý</span>
                  <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          );
        })}
      </section>

      {/* Balanced 2-Column Actionable Workspace (50% / 50%) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Column 1: Recent Articles Feed */}
        <section className="flex flex-col rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#00873E]">
                <FileText className="size-4.5" />
              </span>
              <div>
                <h2 className="text-base font-black text-slate-900">Bài viết mới nhất</h2>
                <p className="text-xs text-slate-400">Ấn phẩm xuất bản và bản thảo gần đây</p>
              </div>
            </div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-xs font-bold text-[#00873E] hover:bg-[#E8F7EC]/50 hover:text-[#007234]"
            >
              <Link href="/admin/content/articles">
                <span>Xem tất cả ({totalArticles})</span>
                <ChevronRight className="size-3.5 ml-0.5" />
              </Link>
            </Button>
          </div>

          <div className="mt-4 flex-1 divide-y divide-slate-100">
            {recentArticles.isLoading ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 rounded-2xl" />
                ))}
              </div>
            ) : recentArticles.data?.items.length ? (
              recentArticles.data.items.map((article) => (
                <Link
                  key={article.id}
                  href={`/admin/content/articles/${article.id}`}
                  className="group flex items-center justify-between py-3.5 transition hover:bg-slate-50/80 -mx-2 px-2 rounded-xl"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-[#00873E] truncate max-w-[120px]">
                        {article.game?.name ?? 'Portal'}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-[11px] text-slate-400">
                        {categoryLabels[article.category] ?? article.category}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm font-bold text-slate-800 group-hover:text-[#00873E] transition-colors">
                      {article.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {article.publishedAt
                        ? `Đã đăng: ${formatDate(article.publishedAt)}`
                        : `Cập nhật: ${formatDate(article.updatedAt)}`}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <PublishStatusBadge status={article.status} />
                    <ChevronRight className="size-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#00873E]" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                Chưa có bài viết nào được tạo.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full text-xs font-bold text-slate-700 hover:border-[#00873E] hover:text-[#00873E]"
            >
              <Link href="/admin/content/articles/new">
                <Plus className="size-3.5 mr-1 text-[#00873E]" />
                Soạn bài viết mới
              </Link>
            </Button>
          </div>
        </section>

        {/* Column 2: Games Catalog & Campaigns (Stacked) */}
        <div className="space-y-6">
          {/* Active Games Feed */}
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <Gamepad2 className="size-4.5" />
                </span>
                <div>
                  <h2 className="text-base font-black text-slate-900">Tựa game trong catalog</h2>
                  <p className="text-xs text-slate-400">Các trò chơi trên hệ sinh thái ZENX</p>
                </div>
              </div>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-xs font-bold text-blue-700 hover:bg-blue-50/50"
              >
                <Link href="/admin/content/games">
                  <span>Xem ({stats.games.total})</span>
                  <ChevronRight className="size-3.5 ml-0.5" />
                </Link>
              </Button>
            </div>

            <div className="mt-3 divide-y divide-slate-100">
              {recentGames.isLoading ? (
                <div className="space-y-3 py-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 rounded-xl" />
                  ))}
                </div>
              ) : recentGames.data?.items.length ? (
                recentGames.data.items.map((game) => (
                  <Link
                    key={game.id}
                    href={`/admin/content/games/${game.id}`}
                    className="group flex items-center justify-between py-3 transition hover:bg-slate-50/80 -mx-2 px-2 rounded-xl"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-black text-xs text-slate-700 group-hover:bg-[#E8F7EC] group-hover:text-[#00873E] transition">
                        {game.code.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800 group-hover:text-[#00873E] transition-colors">
                          {game.name}
                        </p>
                        <p className="truncate text-[11px] text-slate-400">
                          {game.slug} · {lifecycleLabels[game.lifecycleStatus] ?? game.lifecycleStatus}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          'rounded-md px-2 py-0.5 text-[10px] font-bold',
                          game.isPublic
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600',
                        )}
                      >
                        {game.isPublic ? 'Public' : 'Ẩn'}
                      </span>
                      <ChevronRight className="size-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#00873E]" />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Chưa có tựa game nào trong catalog.
                </div>
              )}
            </div>
          </section>

          {/* Active Events / Campaigns */}
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                  <CalendarDays className="size-4.5" />
                </span>
                <div>
                  <h2 className="text-base font-black text-slate-900">Sự kiện & Chiến dịch</h2>
                  <p className="text-xs text-slate-400">
                    {stats.events.active} sự kiện đang diễn ra
                  </p>
                </div>
              </div>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-xs font-bold text-violet-700 hover:bg-violet-50/50"
              >
                <Link href="/admin/content/events">
                  <span>Lịch sự kiện ({totalEvents})</span>
                  <ChevronRight className="size-3.5 ml-0.5" />
                </Link>
              </Button>
            </div>

            <div className="mt-3 divide-y divide-slate-100">
              {recentEvents.isLoading ? (
                <div className="space-y-3 py-2">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-12 rounded-xl" />
                  ))}
                </div>
              ) : recentEvents.data?.items.length ? (
                recentEvents.data.items.map((event) => (
                  <Link
                    key={event.id}
                    href={`/admin/content/events/${event.id}`}
                    className="group flex items-center justify-between py-3 transition hover:bg-slate-50/80 -mx-2 px-2 rounded-xl"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-violet-700 truncate max-w-[120px]">
                          {event.game?.name ?? 'Toàn hệ thống'}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm font-bold text-slate-800 group-hover:text-violet-700 transition-colors">
                        {event.title}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="size-3" />
                        <span>Bắt đầu: {formatDate(event.startsAt)}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <PublishStatusBadge status={event.status} />
                      <ChevronRight className="size-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-700" />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  Chưa có sự kiện nào trong hệ thống.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* System Edge Cache & Redis Sync Advisory */}
      <section className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-5 py-3 text-xs text-slate-500 shadow-2xs">
        <Sparkles className="size-4 text-[#00873E] shrink-0" />
        <p className="flex-1">
          <strong>Đồng bộ nội dung:</strong> Bài viết, sự kiện và banner portal được phân phối qua
          Edge Cache & Redis CDN. Thay đổi có thể mất tối đa 60 giây để đồng bộ toàn bộ người dùng.
        </p>
      </section>
    </div>
  );
}

function PublishStatusBadge({ status }: { status: ContentPublishStatus }) {
  const isPublished = status === 'PUBLISHED';
  return (
    <span
      className={cn(
        'rounded-md px-2 py-0.5 text-[10px] font-bold whitespace-nowrap shrink-0',
        isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
      )}
    >
      {isPublished ? 'Đã xuất bản' : 'Bản nháp'}
    </span>
  );
}

function ContentDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-36 w-full rounded-3xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-40 rounded-3xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-96 rounded-3xl" />
        <div className="space-y-6">
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-44 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
