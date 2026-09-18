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
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, mediaUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { CommonTable, type ColumnDef, type TableAction } from '@/components/ui/common-table';

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
  const [pageSize, setPageSize] = useState(15);
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
      pageSize,
      search: debounced || undefined,
      gameId: gameId || undefined,
      category: category || undefined,
      status: status || undefined,
      deletedOnly: tab === 'trash' ? true : undefined,
    }),
    [category, debounced, gameId, page, pageSize, status, tab],
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

  const columns = useMemo<ColumnDef<AdminContentArticle>[]>(
    () => [
      {
        id: 'title',
        header: 'Bài viết & Tiêu đề',
        minWidth: 320,
        cell: (article) => (
          <Link
            href={`/admin/content/articles/${article.id}`}
            className="flex items-start gap-3.5 group"
          >
            <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 shadow-2xs">
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

            <div className="min-w-0 max-w-md">
              <h3 className="line-clamp-1 font-bold text-slate-900 group-hover:text-[#00873E] transition-colors">
                {article.title}
              </h3>
              <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                {article.excerpt || 'Không có mô tả ngắn...'}
              </p>
              <p className="mt-0.5 flex items-center gap-1 font-mono text-[11px] text-slate-400">
                <span>/{article.slug}</span>
              </p>
            </div>
          </Link>
        ),
      },
      {
        id: 'game',
        header: 'Game phụ trách',
        minWidth: 160,
        cell: (article) => (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 whitespace-nowrap shrink-0">
            <Gamepad2 className="size-3.5 text-[#00873E] shrink-0" />
            {article.game?.name ?? 'Portal Tổng'}
          </span>
        ),
      },
      {
        id: 'category',
        header: 'Chuyên mục',
        minWidth: 150,
        cell: (article) => <CategoryBadge category={article.category} />,
      },
      {
        id: 'status',
        header: 'Trạng thái',
        minWidth: 140,
        cell: (article) => <StatusBadge status={article.status} />,
      },
      {
        id: 'date',
        header: 'Thời gian',
        minWidth: 170,
        cell: (article) => (
          <div className="space-y-0.5 text-xs whitespace-nowrap">
            {tab === 'trash' && article.deletedAt ? (
              <div className="flex items-center gap-1 font-bold text-rose-600">
                <span className="size-1.5 rounded-full bg-rose-500 shrink-0" />
                Đã xóa {formatDate(article.deletedAt)}
              </div>
            ) : article.publishedAt ? (
              <div className="flex items-center gap-1 text-emerald-700 font-medium">
                <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                {formatDate(article.publishedAt)}
              </div>
            ) : (
              <div className="flex items-center gap-1 text-slate-400">
                <span className="size-1.5 rounded-full bg-slate-300 shrink-0" />
                Chưa xuất bản
              </div>
            )}
            <div className="text-[11px] text-slate-400">
              Sửa {formatDate(article.updatedAt)}
            </div>
          </div>
        ),
      },
    ],
    [tab],
  );

  const actions = (article: AdminContentArticle): TableAction<AdminContentArticle>[] => {
    if (tab === 'trash') {
      return [
        {
          key: 'restore',
          label: 'Khôi phục bài viết',
          icon: RotateCcw,
          onClick: () => handleRestore(article),
          disabled: restoreMutation.isPending,
        },
      ];
    }

    return [
      {
        key: 'edit',
        label: 'Chỉnh sửa bài viết',
        icon: FileEdit,
        href: `/admin/content/articles/${article.id}`,
      },
      {
        key: 'delete',
        label: 'Chuyển vào thùng rác',
        icon: Trash2,
        variant: 'danger',
        onClick: () => setArticleToDelete(article),
      },
    ];
  };

  return (
    <div className="space-y-4 w-full">
      {/* Header */}
      <PageHeader
        title="Bài viết & Tin tức Game"
        icon={FileText}
        description="Quản lý tin tức, thông báo, bản cập nhật và sự kiện trong game."
        badge={
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
            {totalCount} bài viết
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
        }
        className="pb-3 border-b border-slate-100"
      />

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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
        <SearchInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onClear={() => setSearch('')}
          placeholder="Tìm tiêu đề, slug, tóm tắt bài viết…"
          sizeVariant="sm"
          aria-label="Tìm bài viết"
        />

        <Select
          value={gameId}
          onChange={(event) => {
            setGameId(event.target.value);
            setPage(1);
          }}
          sizeVariant="sm"
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
          sizeVariant="sm"
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

      {/* Main Table Content */}
      {articles.isError && !articles.data ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-xs">
          <p className="font-bold">Không thể tải danh sách bài viết.</p>
          <p className="mt-1 text-xs text-rose-600">
            Vui lòng kiểm tra kết nối mạng hoặc thử lại sau ít phút.
          </p>
        </div>
      ) : (
        <CommonTable<AdminContentArticle>
          showIndexColumn
          data={articles.data?.items ?? []}
          columns={columns}
          actions={actions}
          actionHeaderTitle="Thao tác"
          isLoading={articles.isLoading}
          isFetching={articles.isFetching}
          emptyTitle="Không tìm thấy bài viết nào"
          emptyDescription={
            hasActiveFilters
              ? 'Không có bài viết nào khớp với tiêu chí tìm kiếm hiện tại của bạn.'
              : 'Hệ thống chưa có bài viết nào. Hãy bấm "Viết bài mới" để bắt đầu soạn thảo nội dung.'
          }
          emptyIcon={FileText}
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
                <Link href="/admin/content/articles/new">
                  <Plus className="size-4 mr-1" /> Soạn bài viết ngay
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
        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 whitespace-nowrap shrink-0">
          Cập nhật phát triển
        </span>
      );
    case 'ANNOUNCEMENT':
      return (
        <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700 whitespace-nowrap shrink-0">
          Thông báo
        </span>
      );
    case 'EVENT':
      return (
        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 whitespace-nowrap shrink-0">
          Sự kiện
        </span>
      );
    case 'MAINTENANCE':
      return (
        <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 whitespace-nowrap shrink-0">
          Bảo trì
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 whitespace-nowrap shrink-0">
          {category}
        </span>
      );
  }
}

function StatusBadge({ status }: { status: ContentPublishStatus }) {
  return status === 'PUBLISHED' ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 whitespace-nowrap shrink-0">
      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" /> Đã xuất bản
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 whitespace-nowrap shrink-0">
      <span className="size-1.5 rounded-full bg-amber-500 shrink-0" /> Bản nháp
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
