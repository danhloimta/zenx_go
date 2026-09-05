'use client';

import Link from 'next/link';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  FileEdit,
  FileText,
  Gamepad2,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ContentPublishStatus, GameArticleCategory } from '@zenx-go/api-client';
import { useAdminContentArticles, useAdminContentGames } from '@/hooks/use-content';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, mediaUrl } from '@/lib/utils';

const categories: Array<{ value: '' | GameArticleCategory; label: string }> = [
  { value: '', label: 'Tất cả chuyên mục' },
  { value: 'DEVELOPMENT_UPDATE', label: 'Cập nhật phát triển' },
  { value: 'ANNOUNCEMENT', label: 'Thông báo' },
  { value: 'EVENT', label: 'Sự kiện' },
  { value: 'MAINTENANCE', label: 'Bảo trì hệ thống' },
];

export default function AdminContentArticlesPage() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [gameId, setGameId] = useState('');
  const [category, setCategory] = useState<'' | GameArticleCategory>('');
  const [status, setStatus] = useState<'' | ContentPublishStatus>('');
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
      category: category || undefined,
      status: status || undefined,
    }),
    [category, debounced, gameId, page, status],
  );

  const articles = useAdminContentArticles(query);
  const totalPages = Math.max(1, articles.data?.totalPages ?? 1);
  const totalCount = articles.data?.total ?? 0;

  // Stats from loaded list or overall
  const publishedCount = articles.data?.items.filter((a) => a.status === 'PUBLISHED').length ?? 0;
  const draftCount = articles.data?.items.filter((a) => a.status === 'DRAFT').length ?? 0;
  const hasActiveFilters = Boolean(debounced || gameId || category || status);

  const handleResetFilters = () => {
    setSearch('');
    setDebounced('');
    setGameId('');
    setCategory('');
    setStatus('');
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
                <FileText className="size-3.5" /> Content CMS
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {totalCount} bài viết
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Bài viết & Tin tức Game
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Quản lý tin tức, thông báo, nhật ký bản cập nhật, sự kiện trong game. Hỗ trợ định dạng Markdown và xuất bản đa kênh.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void articles.refetch()}
              disabled={articles.isFetching}
              className="gap-2 bg-white"
            >
              <RefreshCw className={`size-3.5 ${articles.isFetching ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
            <Button asChild size="sm" className="gap-2 bg-[#00873E] text-white hover:bg-[#007033]">
              <Link href="/admin/content/articles/new">
                <Plus className="size-4" /> Viết bài mới
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick KPI stats strip */}
        <div className="relative z-10 mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-2xl border border-white/80 bg-white/70 p-3.5 shadow-xs backdrop-blur-xs">
            <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Tổng bài viết</div>
            <div className="mt-1 text-xl font-black text-slate-900">{totalCount}</div>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/70 p-3.5 shadow-xs backdrop-blur-xs">
            <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Đã xuất bản (Live)</div>
            <div className="mt-1 flex items-center gap-1.5 text-xl font-black text-emerald-600">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              {publishedCount}
            </div>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/70 p-3.5 shadow-xs backdrop-blur-xs">
            <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Bản nháp (Draft)</div>
            <div className="mt-1 text-xl font-black text-amber-600">{draftCount}</div>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/70 p-3.5 shadow-xs backdrop-blur-xs">
            <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Game liên kết</div>
            <div className="mt-1 text-xl font-black text-slate-800">{games.data?.items.length ?? 0} games</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_170px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm tiêu đề, slug, tóm tắt bài viết…"
                className="h-10 pl-10 pr-9 text-sm"
                aria-label="Tìm bài viết"
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
              value={gameId}
              onChange={(event) => {
                setGameId(event.target.value);
                setPage(1);
              }}
              className="h-10 text-sm"
              aria-label="Lọc game"
            >
              <option value="">Tất cả game</option>
              {(games.data?.items ?? []).map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name} ({game.code})
                </option>
              ))}
            </Select>

            <Select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value as '' | GameArticleCategory);
                setPage(1);
              }}
              className="h-10 text-sm"
              aria-label="Lọc chuyên mục"
            >
              {categories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>

            <Select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as '' | ContentPublishStatus);
                setPage(1);
              }}
              className="h-10 text-sm"
              aria-label="Lọc trạng thái"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PUBLISHED">Đã xuất bản</option>
              <option value="DRAFT">Bản nháp</option>
            </Select>
          </div>

          {/* Filter badges & Reset */}
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
              {category && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 font-medium text-blue-700">
                  Chuyên mục: {categoryLabel(category)}
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
        </div>
      </section>

      {/* Main List Content */}
      {articles.isLoading ? (
        <ArticleListSkeleton />
      ) : articles.isError || !articles.data ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-xs">
          <p className="font-bold">Không thể tải danh sách bài viết.</p>
          <p className="mt-1 text-xs text-rose-600">
            Vui lòng kiểm tra kết nối mạng hoặc thử lại sau ít phút.
          </p>
        </div>
      ) : articles.data.items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#00873E]">
            <FileText className="size-7" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">Không tìm thấy bài viết nào</h3>
          <p className="mx-auto mt-1.5 max-w-md text-xs text-slate-500">
            {hasActiveFilters
              ? 'Không có bài viết nào khớp với tiêu chí tìm kiếm hiện tại của bạn.'
              : 'Hệ thống chưa có bài viết nào. Hãy bấm "Viết bài mới" để bắt đầu soạn thảo nội dung.'}
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
              <Link href="/admin/content/articles/new">
                <Plus className="size-4" /> Soạn bài viết ngay
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
                    <th className="px-6 py-4">Bài viết & Tiêu đề</th>
                    <th className="px-5 py-4">Game phụ trách</th>
                    <th className="px-5 py-4">Chuyên mục</th>
                    <th className="px-5 py-4">Trạng thái</th>
                    <th className="px-5 py-4">Thời gian</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {articles.data.items.map((article) => (
                    <tr
                      key={article.id}
                      className="group transition-colors hover:bg-slate-50/80"
                    >
                      {/* Title & Cover */}
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/content/articles/${article.id}`}
                          className="flex items-start gap-4"
                        >
                          <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-100 shadow-xs">
                            {article.coverImageUrl ? (
                              <img
                                src={mediaUrl(article.coverImageUrl)}
                                alt={article.title}
                                className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : null}
                            <div className="absolute inset-0 -z-10 flex items-center justify-center bg-emerald-50 text-[#00873E]">
                              <FileText className="size-5" />
                            </div>
                          </div>

                          <div className="min-w-0 max-w-lg">
                            <h3 className="line-clamp-1 font-bold text-slate-900 group-hover:text-[#00873E]">
                              {article.title}
                            </h3>
                            <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                              {article.excerpt || 'Không có mô tả ngắn...'}
                            </p>
                            <p className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                              <span>/{article.slug}</span>
                            </p>
                          </div>
                        </Link>
                      </td>

                      {/* Game */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                          <Gamepad2 className="size-3.5 text-[#00873E]" />
                          {article.game?.name ?? 'Portal Tổng'}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-4">
                        <CategoryBadge category={article.category} />
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <StatusBadge status={article.status} />
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5 text-xs">
                          {article.publishedAt ? (
                            <div className="flex items-center gap-1 text-emerald-700 font-medium">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              {formatDate(article.publishedAt)}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-slate-400">
                              <span className="size-1.5 rounded-full bg-slate-300" />
                              Chưa xuất bản
                            </div>
                          )}
                          <div className="text-[11px] text-slate-400">
                            Sửa {formatDate(article.updatedAt)}
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
                          <Link href={`/admin/content/articles/${article.id}`}>
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
              {articles.data.items.map((article) => (
                <div key={article.id} className="p-4 transition hover:bg-slate-50">
                  <div className="flex items-start gap-3.5">
                    <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
                      {article.coverImageUrl ? (
                        <img
                          src={mediaUrl(article.coverImageUrl)}
                          alt={article.title}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-emerald-50 text-[#00873E]">
                          <FileText className="size-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-bold text-[#00873E]">
                          {article.game?.name ?? 'Portal'}
                        </span>
                        <StatusBadge status={article.status} />
                      </div>
                      <Link
                        href={`/admin/content/articles/${article.id}`}
                        className="mt-1 block font-bold text-slate-900 hover:text-[#00873E]"
                      >
                        {article.title}
                      </Link>
                      <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                        {article.excerpt}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <CategoryBadge category={article.category} />
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                        <span>
                          {article.publishedAt
                            ? `Live: ${formatDate(article.publishedAt)}`
                            : `Cập nhật: ${formatDate(article.updatedAt)}`}
                        </span>
                        <Link
                          href={`/admin/content/articles/${article.id}`}
                          className="inline-flex items-center gap-1 font-bold text-[#00873E]"
                        >
                          Sửa bài <ArrowRight className="size-3" />
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
              Hiển thị <strong>{articles.data.items.length}</strong> / <strong>{totalCount}</strong> bài viết (Trang {articles.data.page} / {totalPages})
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={page <= 1 || articles.isFetching}
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
                disabled={page >= totalPages || articles.isFetching}
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

function CategoryBadge({ category }: { category: string }) {
  switch (category) {
    case 'DEVELOPMENT_UPDATE':
      return (
        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
          Cập nhật phát triển
        </span>
      );
    case 'ANNOUNCEMENT':
      return (
        <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700">
          Thông báo
        </span>
      );
    case 'EVENT':
      return (
        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
          Sự kiện
        </span>
      );
    case 'MAINTENANCE':
      return (
        <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">
          Bảo trì
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
          {category}
        </span>
      );
  }
}

function StatusBadge({ status }: { status: ContentPublishStatus }) {
  return status === 'PUBLISHED' ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Đã xuất bản
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
      <span className="size-1.5 rounded-full bg-amber-500" /> Bản nháp
    </span>
  );
}

function categoryLabel(value: string) {
  return categories.find((item) => item.value === value)?.label ?? value;
}

function ArticleListSkeleton() {
  return (
    <div className="space-y-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <Skeleton className="h-10 w-full rounded-2xl" />
      {[1, 2, 3, 4, 5].map((value) => (
        <div key={value} className="flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-14 w-20 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
