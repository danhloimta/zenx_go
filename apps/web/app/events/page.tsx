import Link from 'next/link';
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Gift } from 'lucide-react';
import type { Metadata } from 'next';
import { PortalPageLayout } from '@/components/portal/portal-page-layout';
import { getPortalEventsPage, getPortalGames } from '@/lib/game-api';

export const metadata: Metadata = {
  title: 'Sự kiện & Hoạt động nổi bật | ZENX GO',
  description: 'Khám phá các sự kiện đăng ký sớm, Alpha Test, quà tân thủ và ưu đãi mới nhất từ hệ sinh thái game ZENX GO.',
};

const STATUSES = [
  { value: '', label: 'Tất cả sự kiện' },
  { value: 'ACTIVE', label: 'Đang diễn ra' },
  { value: 'UPCOMING', label: 'Sắp diễn ra' },
  { value: 'ENDED', label: 'Đã kết thúc' },
];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function EventsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const game = typeof params.game === 'string' ? params.game : undefined;
  const requestedStatus = typeof params.status === 'string' ? params.status : '';
  const status = STATUSES.some((item) => item.value === requestedStatus) ? requestedStatus : '';
  const page = Number(typeof params.page === 'string' ? params.page : '1') || 1;
  const result = await getPortalEventsPage({ game, status: status || undefined, page, pageSize: 9 });
  const games = await getPortalGames();
  const items = result.data?.items ?? [];

  return (
    <PortalPageLayout games={games}>
      <div className="min-h-screen bg-[#f8fafc] px-4 py-10 sm:px-6 lg:px-8 sm:py-14">
        <div className="mx-auto max-w-7xl">
          {/* Hero Header Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-emerald-100/80 bg-gradient-to-br from-white via-emerald-50/40 to-amber-50/40 p-8 sm:p-12 shadow-sm">
            <div className="relative z-10 max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#00873E] shadow-2xs mb-4">
                <Gift className="size-4" /> SỰ KIỆN & HOẠT ĐỘNG
              </span>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                Sự kiện nổi bật
              </h1>

              <p className="mt-3.5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                Tham gia Alpha Test, nhận quà tân thủ, đăng ký sớm và đồng hành cùng các thế giới game trong từng cột mốc ra mắt.
              </p>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="mt-8 flex items-center overflow-x-auto pb-2 scrollbar-none gap-2.5 sm:gap-3">
            {STATUSES.map((item) => {
              const isActive = status === item.value;
              return (
                <Link
                  key={item.value || 'all'}
                  href={eventsHref({ game, status: item.value || undefined, page: 1 })}
                  className={`inline-flex items-center justify-center h-10 sm:h-11 px-5 sm:px-6 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#00873E] text-white shadow-sm border border-[#00873E]'
                      : 'bg-white border border-slate-200 text-slate-700 hover:text-slate-950 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Game Filter Pills */}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">Lọc theo game:</span>
            <Link
              href={eventsHref({ status: status || undefined, page: 1 })}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-2xs ${
                !game
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              Toàn hệ sinh thái
            </Link>
            {games.map((item) => (
              <Link
                key={item.slug}
                href={eventsHref({ game: item.slug, status: status || undefined, page: 1 })}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-2xs ${
                  game === item.slug || game === item.subdomain
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <span>{item.title}</span>
              </Link>
            ))}
          </div>

          {/* Events Grid */}
          {result.error ? (
            <div className="mt-10 rounded-3xl border border-dashed border-amber-300 bg-amber-50 p-12 text-center text-sm text-amber-900">
              Không thể tải sự kiện lúc này. Vui lòng thử lại sau.
            </div>
          ) : items.length ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {items.map((event) => (
                <article
                  key={event.slug}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl flex flex-col justify-between"
                >
                  <Link href={event.href} className="block flex-1 flex flex-col justify-between">
                    <div>
                      {/* Image Thumbnail */}
                      <div className="aspect-[16/10] overflow-hidden bg-slate-900 relative">
                        {event.coverImageUrl ? (
                          <img
                            src={event.coverImageUrl}
                            alt={event.title}
                            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-emerald-300">
                            <Gift className="size-8" />
                          </div>
                        )}

                        {/* Top Badges */}
                        <div className="absolute top-3 inset-x-3 z-10 flex items-center justify-between gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase backdrop-blur-md border shadow-sm ${
                            event.status === 'ACTIVE'
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                              : event.status === 'UPCOMING'
                              ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                              : 'bg-slate-900/80 text-slate-300 border-white/10'
                          }`}>
                            <span className={`size-1.5 rounded-full ${event.status === 'ACTIVE' ? 'bg-emerald-400' : event.status === 'UPCOMING' ? 'bg-amber-400' : 'bg-slate-400'}`} />
                            <span>{eventStatusLabel(event.status)}</span>
                          </span>

                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-black/60 text-white backdrop-blur-md border border-white/10 shadow-sm">
                            {event.game ? event.game.name : 'ZENX GO'}
                          </span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-5 sm:p-6">
                        <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 group-hover:text-[#00873E] transition-colors line-clamp-2">
                          {event.title}
                        </h2>

                        <p className="mt-2.5 line-clamp-3 text-xs sm:text-sm leading-relaxed text-slate-600">
                          {event.excerpt}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="size-3.5 text-slate-400" /> {formatDate(event.startsAt)}
                        {event.endsAt && ` - ${formatDate(event.endsAt)}`}
                      </span>
                      <span className="inline-flex items-center gap-1 font-bold text-[#00873E] group-hover:translate-x-1 transition-transform">
                        <span>Chi tiết</span>
                        <ArrowRight className="size-3.5" />
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-12 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-600 shadow-xs">
              <Gift className="size-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Chưa có sự kiện phù hợp</h3>
              <p className="mt-1 text-xs text-slate-500">Hãy thử chọn trạng thái hoặc game khác.</p>
            </div>
          )}

          {/* Pagination */}
          {result.data && result.data.totalPages > 1 && (
            <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Phân trang sự kiện">
              <PaginationLink href={eventsHref({ game, status: status || undefined, page: Math.max(1, result.data.page - 1) })} disabled={result.data.page <= 1}>
                <ChevronLeft className="size-4" /> Trang trước
              </PaginationLink>
              <span className="px-4 py-2 text-xs font-bold text-slate-600 bg-white rounded-xl border border-slate-200">
                Trang {result.data.page} / {result.data.totalPages}
              </span>
              <PaginationLink href={eventsHref({ game, status: status || undefined, page: Math.min(result.data.totalPages, result.data.page + 1) })} disabled={result.data.page >= result.data.totalPages}>
                Trang sau <ChevronRight className="size-4" />
              </PaginationLink>
            </nav>
          )}
        </div>
      </div>
    </PortalPageLayout>
  );
}

function eventsHref({ game, status, page }: { game?: string; status?: string; page?: number }) {
  const params = new URLSearchParams();
  if (game) params.set('game', game);
  if (status) params.set('status', status);
  if (page && page > 1) params.set('page', String(page));
  const query = params.toString();
  return `/events${query ? `?${query}` : ''}`;
}

function eventStatusLabel(status: 'ACTIVE' | 'UPCOMING' | 'ENDED') {
  return status === 'ACTIVE' ? 'Đang diễn ra' : status === 'UPCOMING' ? 'Sắp diễn ra' : 'Đã kết thúc';
}

function formatDate(value?: string | null) {
  if (!value) return 'Chưa cập nhật';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function PaginationLink({ href, disabled, children }: { href: string; disabled: boolean; children: React.ReactNode }) {
  return disabled ? (
    <span className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-300">
      {children}
    </span>
  ) : (
    <Link
      href={href}
      className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:border-[#00873E]/40 hover:text-[#00873E] shadow-2xs transition-all"
    >
      {children}
    </Link>
  );
}
