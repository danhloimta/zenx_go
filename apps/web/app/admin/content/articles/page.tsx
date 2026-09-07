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
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { AdminContentArticle, ContentPublishStatus, GameArticleCategory } from '@zenx-go/api-client';
import {
  useAdminContentArticles,
  useAdminContentGames,
  useAdminDeleteArticle,
  useAdminRestoreArticle,
} from '@/hooks/use-content';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, mediaUrl } from '@/lib/utils';
import { toast } from 'sonner';

const categories: Array<{ value: '' | GameArticleCategory; label: string }> = [
  { value: '', label: 'Tất cả chuyên mục' },
  { value: 'DEVELOPMENT_UPDATE', label: 'Cập nhật phát triển' },
  { value: 'ANNOUNCEMENT', label: 'Thông báo' },
  { value: 'EVENT', label: 'Sự kiện' },
  { value: 'MAINTENANCE', label: 'Bảo trì hệ thống' },
];

export default function AdminContentArticlesPage() {
  const [tab, setTab] = useState<'active' | 'trash'>('active');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [gameId, setGameId] = useState('');
  const [category, setCategory] = useState<'' | GameArticleCategory>('');
  const [status, setStatus] = useState<'' | ContentPublishStatus>('');
  const [page, setPage] = useState(1);
  const [articleToDelete, setArticleToDelete] = useState<AdminContentArticle | null>(null);

  const games = useAdminContentGames({ page: 1, pageSize: 50 });
  const deleteMutation = useAdminDeleteArticle();
  const restoreMutation = useAdminRestoreArticle();
  const trashArticles = useAdminContentArticles({ deletedOnly: true, pageSize: 1 });
  const trashCount = trashArticles.data?.total ?? 0;

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
      deletedOnly: tab === 'trash' ? true : undefined,
    }),
    [category, debounced, gameId, page, status, tab],
  );

  const articles = useAdminContentArticles(query);
  const totalPages = Math.max(1, articles.data?.totalPages ?? 1);
  const totalCount = articles.data?.total ?? 0;

  // Stats from loaded list or overall
  const hasActiveFilters = Boolean(debounced || gameId || category || status);

  const handleResetFilters = () => {
    setSearch('');
    setDebounced('');
    setGameId('');
    setCategory('');
    setStatus('');
    setPage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!articleToDelete) return;
    try {
      await deleteMutation.mutateAsync(articleToDelete.id);
      toast.success(`Đã chuyển bài viết "${articleToDelete.title}" vào thùng rác`);
      setArticleToDelete(null);
    } catch {
      toast.error('Không thể xóa bài viết. Vui lòng thử lại.');
    }
  };

  const handleRestore = async (article: AdminContentArticle) => {
    try {
      await restoreMutation.mutateAsync(article.id);
      toast.success(`Đã khôi phục bài viết "${article.title}" thành công`);
    } catch {
      toast.error('Không thể khôi phục bài viết. Vui lòng thử lại.');
    }
  };

  return (
    <div className="space-y-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Bài viết & Tin tức Game
            </h1>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
              {totalCount} bài viết
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý tin tức, thông báo, bản cập nhật và sự kiện trong game.
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
            onClick={() => void articles.refetch()}
            disabled={articles.isFetching}
            className="text-xs h-8 px-3 rounded-xl"
          >
            <RefreshCw className={`size-3.5 mr-1.5 ${articles.isFetching ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button asChild size="sm" className="text-xs h-8 px-3.5 rounded-xl font-bold bg-[#00873E] text-white hover:bg-[#007033] shadow-xs">
            <Link href="/admin/content/articles/new">
              <Plus className="size-4 mr-1.5" /> Viết bài mới
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Filter Tabs: Tất cả, Đã xuất bản, Bản nháp, Thùng rác */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => {
              setTab('active');
              setStatus('');
              setPage(1);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              tab === 'active' && !status
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>Tất cả bài viết</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                tab === 'active' && !status
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200/80 text-slate-700'
              }`}
            >
              {tab === 'active' && !status ? totalCount : 'Tất cả'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('active');
              setStatus('PUBLISHED');
              setPage(1);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              tab === 'active' && status === 'PUBLISHED'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span>Đã xuất bản</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('active');
              setStatus('DRAFT');
              setPage(1);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              tab === 'active' && status === 'DRAFT'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="size-1.5 rounded-full bg-amber-500" />
            <span>Bản nháp</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('trash');
              setStatus('');
              setPage(1);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              tab === 'trash'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Trash2 className="size-3.5" />
            <span>Thùng rác</span>
            {trashCount > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                  tab === 'trash' ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {trashCount}
              </span>
            )}
          </button>
        </div>

        {tab === 'trash' && (
          <span className="text-xs font-medium text-rose-600">
            * Các bài viết trong thùng rác đã bị ẩn khỏi game site & portal.
          </span>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-3.5 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm tiêu đề, slug, tóm tắt bài viết…"
            className="pl-8 pr-8 h-8 rounded-xl text-xs"
            aria-label="Tìm bài viết"
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
          className="h-8 rounded-xl text-xs"
          aria-label="Lọc chuyên mục"
        >
          {categories.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
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
                          {tab === 'trash' && article.deletedAt ? (
                            <div className="flex items-center gap-1 font-bold text-rose-600">
                              <span className="size-1.5 rounded-full bg-rose-500" />
                              Đã xóa {formatDate(article.deletedAt)}
                            </div>
                          ) : article.publishedAt ? (
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
                        {tab === 'trash' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestore(article)}
                              disabled={restoreMutation.isPending}
                              className="h-8 gap-1.5 rounded-xl border-emerald-200 bg-emerald-50/60 px-3 text-xs font-bold text-[#00873E] hover:bg-emerald-100"
                            >
                              <RotateCcw className="size-3.5" /> Khôi phục
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1 rounded-xl px-2.5 text-xs font-bold text-slate-700 hover:bg-[#00873E]/10 hover:text-[#00873E]"
                            >
                              <Link href={`/admin/content/articles/${article.id}`}>
                                <FileEdit className="size-3.5" /> Sửa
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setArticleToDelete(article)}
                              className="h-8 gap-1 rounded-xl px-2 text-xs font-bold text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                              title="Chuyển vào thùng rác"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        )}
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
                          {tab === 'trash' && article.deletedAt
                            ? `Đã xóa: ${formatDate(article.deletedAt)}`
                            : article.publishedAt
                              ? `Live: ${formatDate(article.publishedAt)}`
                              : `Cập nhật: ${formatDate(article.updatedAt)}`}
                        </span>
                        {tab === 'trash' ? (
                          <button
                            type="button"
                            onClick={() => handleRestore(article)}
                            disabled={restoreMutation.isPending}
                            className="inline-flex items-center gap-1 font-bold text-[#00873E] hover:underline cursor-pointer"
                          >
                            <RotateCcw className="size-3" /> Khôi phục
                          </button>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/admin/content/articles/${article.id}`}
                              className="inline-flex items-center gap-1 font-bold text-[#00873E]"
                            >
                              Sửa bài <ArrowRight className="size-3" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => setArticleToDelete(article)}
                              className="inline-flex items-center gap-1 font-bold text-rose-500 hover:text-rose-700 cursor-pointer"
                            >
                              <Trash2 className="size-3" /> Xóa
                            </button>
                          </div>
                        )}
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

      {/* Soft Delete Confirmation Modal Dialog */}
      {articleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <AlertTriangle className="size-6" />
            </div>

            <h3 className="mt-4 text-lg font-black text-slate-900">Xác nhận chuyển vào thùng rác</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Bài viết <strong className="text-slate-800">&ldquo;{articleToDelete.title}&rdquo;</strong> sẽ được chuyển vào thùng rác và lập tức ẩn khỏi toàn bộ portal và game site.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Bạn vẫn có thể kiểm tra và khôi phục lại bất kỳ lúc nào từ tab Thùng rác.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setArticleToDelete(null)}
                disabled={deleteMutation.isPending}
                className="rounded-xl px-4 text-xs font-bold"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                className="gap-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 px-4 text-xs font-bold shadow-xs cursor-pointer"
              >
                {deleteMutation.isPending ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" /> Đang chuyển…
                  </>
                ) : (
                  <>
                    <Trash2 className="size-3.5" /> Xóa vào thùng rác
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
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
