import Link from 'next/link';
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Newspaper } from 'lucide-react';
import type { Metadata } from 'next';
import { PortalPageLayout } from '@/components/portal/portal-page-layout';
import { getPortalGames, getPortalNewsPage } from '@/lib/game-api';

import { formatCategoryLabel } from '@/lib/games-data';

export const metadata: Metadata = {
  title: 'Tin tức & Nhật ký phát triển | ZENX GO',
  description: 'Theo dõi tiến độ phát triển, nhật ký dev log, sự kiện và thông báo chính thức từ hệ sinh thái game ZENX GO.',
};

const CATEGORIES = [
  { value: '', label: 'Tất cả danh mục' },
  { value: 'DEVELOPMENT_UPDATE', label: 'Tiến độ phát triển' },
  { value: 'ANNOUNCEMENT', label: 'Thông báo' },
  { value: 'EVENT', label: 'Sự kiện' },
  { value: 'MAINTENANCE', label: 'Bảo trì' },
];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PortalNewsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const game = typeof params.game === 'string' ? params.game : undefined;
  const category = typeof params.category === 'string' ? params.category : undefined;
  const page = Number(typeof params.page === 'string' ? params.page : '1') || 1;
  const result = await getPortalNewsPage({ game, category, page, pageSize: 9 });
  const games = await getPortalGames();
  const items = result.data?.items ?? [];

  return (
    <PortalPageLayout games={games}>
      <div className="min-h-screen bg-[#f8fafc] px-4 py-10 sm:px-6 lg:px-8 sm:py-14">
        <div className="mx-auto max-w-7xl">
          {/* Hero Header Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-emerald-100/80 bg-gradient-to-br from-white via-emerald-50/40 to-sky-50/50 p-8 sm:p-12 shadow-sm">
            <div className="relative z-10 max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#00873E] shadow-2xs mb-4">
                <Newspaper className="size-4" /> BẢN TIN CẬP NHẬT ZENX GO
              </span>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                Tin mới từ các thế giới
              </h1>

              <p className="mt-3.5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                Theo dõi tiến độ phát triển, nhật ký dev log, sự kiện cộng đồng và thông báo chính thức từ từng tựa game trong hệ sinh thái.
              </p>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="mt-8 flex items-center overflow-x-auto pb-2 scrollbar-none gap-2.5 sm:gap-3">
            {CATEGORIES.map((item) => {
              const isActive = category === item.value || (!category && !item.value);
              return (
                <Link
                  key={item.value || 'all'}
                  href={newsHref({ game, category: item.value || undefined, page: 1 })}
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

          {/* Game Pills Filter */}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">Lọc theo game:</span>
            <Link
              href={newsHref({ category, page: 1 })}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-2xs ${
                !game
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              Tất cả game
            </Link>
            {games.map((item) => (
              <Link
                key={item.slug}
                href={newsHref({ game: item.slug, category, page: 1 })}
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

          {/* Articles Content */}
          {result.error ? (
            <div className="mt-10 rounded-3xl border border-dashed border-amber-300 bg-amber-50 p-12 text-center text-sm text-amber-900">
              Không thể tải tin tức lúc này. Vui lòng thử lại sau.
            </div>
          ) : items.length ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {items.map((article, index) => (
                <article
                  key={`${article.game.slug}-${article.slug}`}
                  className={`group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl flex flex-col justify-between ${
                    index === 0 ? 'md:col-span-2 lg:col-span-2' : ''
                  }`}
                >
                  <Link href={article.href} className="block flex-1 flex flex-col justify-between">
                    <div>
                      {/* Image Container */}
                      <div className={`${index === 0 ? 'aspect-[16/8]' : 'aspect-[16/10]'} overflow-hidden bg-slate-900 relative`}>
                        {article.coverImageUrl ? (
                          <img
                            src={article.coverImageUrl}
                            alt={article.title}
                            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-emerald-300">
                            <Newspaper className="size-8" />
                          </div>
                        )}
                        {/* Game Tag Badge */}
                        <div className="absolute top-3 left-3 z-10">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-black/60 text-white backdrop-blur-md border border-white/10 shadow-sm">
                            {article.game.name}
                          </span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-5 sm:p-6">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#00873E]">
                          <span>{formatCategoryLabel(article.category)}</span>
                        </div>

                        <h2 className={`${index === 0 ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'} mt-2.5 font-black tracking-tight text-slate-900 group-hover:text-[#00873E] transition-colors line-clamp-2`}>
                          {article.title}
                        </h2>

                        <p className="mt-2.5 line-clamp-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                          {article.excerpt}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer Meta */}
                    <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="size-3.5 text-slate-400" /> {formatDate(article.publishedAt)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-bold text-[#00873E] group-hover:translate-x-1 transition-transform">
                        <span>Đọc tiếp</span>
                        <ArrowRight className="size-3.5" />
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-12 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-600 shadow-xs">
              <Newspaper className="size-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Chưa có bài viết phù hợp</h3>
              <p className="mt-1 text-xs text-slate-500">Hãy thử chọn danh mục hoặc game khác.</p>
            </div>
          )}

          {/* Pagination */}
          {result.data && result.data.totalPages > 1 && (
            <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Phân trang tin tức">
              <PaginationLink href={newsHref({ game, category, page: Math.max(1, result.data.page - 1) })} disabled={result.data.page <= 1}>
                <ChevronLeft className="size-4" /> Trang trước
              </PaginationLink>
              <span className="px-4 py-2 text-xs font-bold text-slate-600 bg-white rounded-xl border border-slate-200">
                Trang {result.data.page} / {result.data.totalPages}
              </span>
              <PaginationLink href={newsHref({ game, category, page: Math.min(result.data.totalPages, result.data.page + 1) })} disabled={result.data.page >= result.data.totalPages}>
                Trang sau <ChevronRight className="size-4" />
              </PaginationLink>
            </nav>
          )}
        </div>
      </div>
    </PortalPageLayout>
  );
}

function newsHref({ game, category, page }: { game?: string; category?: string; page?: number }) {
  const params = new URLSearchParams();
  if (game) params.set('game', game);
  if (category) params.set('category', category);
  if (page && page > 1) params.set('page', String(page));
  const query = params.toString();
  return `/news${query ? `?${query}` : ''}`;
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
