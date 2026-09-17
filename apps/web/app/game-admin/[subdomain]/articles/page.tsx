'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ContentPublishStatus, GameArticleCategory } from '@zenx-go/api-client';
import {
  CheckCircle2,
  Clock,
  Edit3,
  ExternalLink,
  Eye,
  FileEdit,
  FilePlus,
  FileText,
  Globe,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  SearchX,
  ShieldAlert,
  Sparkles,
  Tag,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { gameContentWorkspace } from '@/components/admin-content/content-workspace-adapter';
import { CommonTable, type ColumnDef, type TableAction } from '@/components/ui/common-table';

// Cấu hình nhãn chuyên mục thuần Việt & màu sắc
const CATEGORY_CONFIG: Record<
  GameArticleCategory,
  { label: string; badgeClass: string; icon: typeof Tag }
> = {
  ANNOUNCEMENT: {
    label: 'Thông báo',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
    icon: Sparkles,
  },
  DEVELOPMENT_UPDATE: {
    label: 'Bản tin cập nhật',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/80',
    icon: RefreshCw,
  },
  EVENT: {
    label: 'Sự kiện game',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
    icon: Tag,
  },
  MAINTENANCE: {
    label: 'Bảo trì hệ thống',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
    icon: ShieldAlert,
  },
};

// Cấu hình nhãn trạng thái bài viết
const STATUS_CONFIG: Record<
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

export default function GameArticlesPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const router = useRouter();
  const client = useQueryClient();

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [category, setCategory] = useState<'' | GameArticleCategory>('');
  const [status, setStatus] = useState<'' | ContentPublishStatus>('');
  const [trash, setTrash] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  // 1. Context thông tin game
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

  // 2. Query danh sách bài viết chính theo bộ lọc
  const articlesQuery = useQuery({
    queryKey: [
      'game-admin',
      'articles',
      gameId,
      page,
      pageSize,
      debounced,
      category,
      status,
      trash,
    ],
    queryFn: () =>
      workspace!.articles({
        page,
        pageSize,
        search: debounced || undefined,
        category: category || undefined,
        status: status || undefined,
        deletedOnly: trash || undefined,
      }),
    enabled: Boolean(workspace),
    retry: false,
    placeholderData: (previous) => previous,
  });

  const isSearchLoading = search !== debounced || (articlesQuery.isFetching && search.length > 0);

  // 3. Các query thống kê số lượng thẻ nhanh
  const countTotalQuery = useQuery({
    queryKey: ['game-admin', 'articles', gameId, 'count', 'total'],
    queryFn: () => workspace!.articles({ page: 1, pageSize: 10, deletedOnly: false }),
    enabled: Boolean(workspace),
    staleTime: 30_000,
  });

  const countPublishedQuery = useQuery({
    queryKey: ['game-admin', 'articles', gameId, 'count', 'published'],
    queryFn: () =>
      workspace!.articles({
        page: 1,
        pageSize: 10,
        status: 'PUBLISHED',
        deletedOnly: false,
      }),
    enabled: Boolean(workspace),
    staleTime: 30_000,
  });

  const countDraftQuery = useQuery({
    queryKey: ['game-admin', 'articles', gameId, 'count', 'draft'],
    queryFn: () =>
      workspace!.articles({
        page: 1,
        pageSize: 10,
        status: 'DRAFT',
        deletedOnly: false,
      }),
    enabled: Boolean(workspace),
    staleTime: 30_000,
  });

  const countTrashQuery = useQuery({
    queryKey: ['game-admin', 'articles', gameId, 'count', 'trash'],
    queryFn: () => workspace!.articles({ page: 1, pageSize: 10, deletedOnly: true }),
    enabled: Boolean(workspace),
    staleTime: 30_000,
  });

  // 4. Các mutation thao tác xóa / khôi phục
  const removeMutation = useMutation({
    mutationFn: (id: string) => workspace!.deleteArticle(id),
    onSuccess: () => {
      toast.success('Đã chuyển bài viết vào thùng rác');
      void client.invalidateQueries({ queryKey: ['game-admin', 'articles', gameId] });
    },
    onError: () => {
      toast.error('Không thể xóa bài viết. Vui lòng thử lại.');
    },
    onSettled: () => {
      setMutatingId(null);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => workspace!.restoreArticle(id),
    onSuccess: () => {
      toast.success('Đã khôi phục bài viết thành công');
      void client.invalidateQueries({ queryKey: ['game-admin', 'articles', gameId] });
    },
    onError: () => {
      toast.error('Không thể khôi phục bài viết. Vui lòng thử lại.');
    },
    onSettled: () => {
      setMutatingId(null);
    },
  });

  const handleRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      await Promise.all([
        articlesQuery.refetch(),
        countTotalQuery.refetch(),
        countPublishedQuery.refetch(),
        countDraftQuery.refetch(),
        countTrashQuery.refetch(),
      ]);
      toast.success('Đã cập nhật danh sách bài viết mới nhất');
    } catch {
      toast.error('Lỗi khi tải lại dữ liệu');
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const resetAllFilters = () => {
    setSearch('');
    setDebounced('');
    setCategory('');
    setStatus('');
    setTrash(false);
    setPage(1);
  };

  const base = '/admin/articles';

  if (context.isError || (!context.isLoading && !context.data)) {
    return (
      <div className="rounded-xl border border-red-200/80 bg-red-50/80 p-6 text-sm text-red-700 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="size-5 shrink-0 text-red-600" />
          <h3 className="font-bold text-base">Không có quyền truy cập nội dung game</h3>
        </div>
        <p className="mt-2 text-xs text-red-600 leading-relaxed">
          Tài khoản của bạn chưa được cấp quyền quản lý nội dung cho trò chơi này hoặc thông tin game không tồn tại. Vui lòng liên hệ người quản trị hệ thống.
        </p>
      </div>
    );
  }

  const items = articlesQuery.data?.items ?? [];
  const totalItems = articlesQuery.data?.total ?? 0;
  const totalPages = articlesQuery.data?.totalPages ?? 1;

  const totalAllCount = countTotalQuery.data?.total ?? 0;
  const totalPublishedCount = countPublishedQuery.data?.total ?? 0;
  const totalDraftCount = countDraftQuery.data?.total ?? 0;
  const totalTrashCount = countTrashQuery.data?.total ?? 0;

  const hasActiveFilters = Boolean(search || category || status || trash);

  type ArticleItem = NonNullable<typeof articlesQuery.data>['items'][number];

  const columns = useMemo<ColumnDef<ArticleItem>[]>(() => [
    {
      id: 'article',
      header: 'Bài viết',
      cell: (article) => (
        <div className="flex items-center gap-3.5">
          <div className="relative size-12 sm:size-14 shrink-0 overflow-hidden rounded-lg border border-slate-200/80 bg-slate-100">
            {article.coverImageUrl ? (
              <img
                src={article.coverImageUrl}
                alt={article.title}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-slate-100 text-slate-400">
                <FileText className="size-5" />
              </div>
            )}
          </div>

          <div className="min-w-0 max-w-md">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug truncate">
              {article.title}
            </h3>
            {article.excerpt && (
              <p className="text-slate-500 text-xs line-clamp-1 mt-0.5 leading-relaxed">
                {article.excerpt}
              </p>
            )}
            <p className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">
              /tin-tuc/{article.slug}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'category',
      header: 'Chuyên mục',
      cell: (article) => {
        const catConfig = CATEGORY_CONFIG[article.category as GameArticleCategory] || {
          label: article.category,
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: Tag,
        };
        const CatIcon = catConfig.icon;
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold whitespace-nowrap shrink-0 ${catConfig.badgeClass}`}
          >
            <CatIcon className="size-3 shrink-0" />
            <span>{catConfig.label}</span>
          </span>
        );
      },
    },
    {
      id: 'time',
      header: 'Thời gian',
      cell: (article) => {
        const formattedDate = formatDate(
          article.publishedAt || article.updatedAt || article.createdAt,
        );
        return (
          <div className="space-y-0.5 whitespace-nowrap shrink-0">
            <p className="text-slate-700 font-medium text-xs">{formattedDate}</p>
            {article.readTimeMinutes ? (
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="size-3 shrink-0" />
                <span>{article.readTimeMinutes} phút đọc</span>
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: (article) => {
        const statConfig = STATUS_CONFIG[article.status as ContentPublishStatus] || {
          label: article.status,
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
          dotClass: 'bg-slate-400',
        };
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap shrink-0 ${statConfig.badgeClass}`}
          >
            <span className={`size-1.5 rounded-full shrink-0 ${statConfig.dotClass}`} />
            <span>{statConfig.label}</span>
          </span>
        );
      },
    },
  ], []);

  const actions = useMemo<(article: ArticleItem) => TableAction<ArticleItem>[]>(
    () => (article: ArticleItem) => {
      if (trash) {
        return [
          {
            key: 'restore',
            label: 'Khôi phục bài viết',
            icon: RotateCcw,
            disabled: restoreMutation.isPending && mutatingId === article.id,
            onClick: (a) => {
              setMutatingId(a.id);
              restoreMutation.mutate(a.id);
            },
          },
        ];
      }

      const list: TableAction<ArticleItem>[] = [];

      if (article.status === 'PUBLISHED' && game?.subdomain) {
        list.push({
          key: 'view-web',
          label: 'Xem trên web game',
          icon: Eye,
          onClick: () => {
            window.open(
              `http://${game.subdomain}.lvh.me:3001/tin-tuc/${article.slug}`,
              '_blank',
              'noopener,noreferrer',
            );
          },
        });
      }

      list.push({
        key: 'edit',
        label: 'Chỉnh sửa bài viết',
        icon: Edit3,
        onClick: (a) => router.push(`${base}/${a.id}`),
      });

      list.push({
        key: 'delete',
        label: 'Chuyển vào thùng rác',
        icon: Trash2,
        variant: 'danger',
        disabled: removeMutation.isPending && mutatingId === article.id,
        onClick: (a) => {
          if (
            window.confirm(`Bạn có chắc chắn muốn chuyển bài viết “${a.title}” vào thùng rác?`)
          ) {
            setMutatingId(a.id);
            removeMutation.mutate(a.id);
          }
        },
      });

      return list;
    },
    [trash, game?.subdomain, restoreMutation, removeMutation, mutatingId, base, router],
  );

  return (
    <div className="space-y-4 sm:space-y-5 pb-12 w-full">
      {/* 1. Phần Đầu Trang - Rõ Ràng & Thân Thiện */}
      <PageHeader
        icon={FileText}
        title={`Quản lý bài viết · ${game?.name ?? 'Trò chơi'}`}
        badge={
          <span className="rounded bg-emerald-100/90 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
            {game?.code ?? 'GAME'}
          </span>
        }
        description="Soạn thảo, cập nhật tin tức, sự kiện và thông báo gửi đến cộng đồng người chơi trên trang web game."
        actions={
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isManualRefreshing || articlesQuery.isFetching}
              className="h-8 px-3 gap-1.5 rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              <RefreshCw
                className={`size-3.5 ${
                  isManualRefreshing || articlesQuery.isFetching ? 'animate-spin text-[#00873E]' : ''
                }`}
              />
              <span>{isManualRefreshing ? 'Đang tải…' : 'Làm mới'}</span>
            </Button>

            {game?.subdomain && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 px-3 gap-1.5 rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
              >
                <a
                  href={`http://${game.subdomain}.lvh.me:3001/tin-tuc`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Globe className="size-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Xem mục Tin tức</span>
                  <ExternalLink className="size-3 text-slate-400" />
                </a>
              </Button>
            )}

            <Button
              asChild
              size="sm"
              className="h-8 px-3.5 gap-1.5 rounded-xl bg-[#00873E] text-xs font-bold text-white shadow-2xs hover:bg-[#007033]"
            >
              <Link href={`${base}/new`}>
                <Plus className="size-3.5" />
                <span>Viết bài mới</span>
              </Link>
            </Button>
          </div>
        }
        className="border-b border-slate-100 pb-3"
      />

      {/* 2. Bốn Thẻ Thống Kê Nhanh (Click để lọc tức thì) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Thẻ 1: Tất cả bài viết */}
        <button
          type="button"
          onClick={() => {
            setTrash(false);
            setStatus('');
            setPage(1);
          }}
          className={`text-left transition-all p-3.5 sm:p-4 rounded-xl border bg-white shadow-2xs hover:shadow-xs ${
            !trash && status === ''
              ? 'border-[#00873E] ring-2 ring-[#00873E]/10 bg-emerald-50/20'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tất cả bài viết</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
              <FileText className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900">
              {countTotalQuery.isLoading ? '—' : totalAllCount}
            </span>
            <span className="text-[11px] text-slate-500">bài đã tạo</span>
          </div>
        </button>

        {/* Thẻ 2: Đang hiển thị */}
        <button
          type="button"
          onClick={() => {
            setTrash(false);
            setStatus('PUBLISHED');
            setPage(1);
          }}
          className={`text-left transition-all p-3.5 sm:p-4 rounded-xl border bg-white shadow-2xs hover:shadow-xs ${
            !trash && status === 'PUBLISHED'
              ? 'border-emerald-500 ring-2 ring-emerald-500/10 bg-emerald-50/30'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Đang hiển thị</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-emerald-700">
              {countPublishedQuery.isLoading ? '—' : totalPublishedCount}
            </span>
            <span className="text-[11px] text-slate-500">người chơi xem được</span>
          </div>
        </button>

        {/* Thẻ 3: Bản nháp */}
        <button
          type="button"
          onClick={() => {
            setTrash(false);
            setStatus('DRAFT');
            setPage(1);
          }}
          className={`text-left transition-all p-3.5 sm:p-4 rounded-xl border bg-white shadow-2xs hover:shadow-xs ${
            !trash && status === 'DRAFT'
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
            <span className="text-[11px] text-slate-500">đang soạn thảo</span>
          </div>
        </button>

        {/* Thẻ 4: Thùng rác */}
        <button
          type="button"
          onClick={() => {
            setTrash(true);
            setStatus('');
            setPage(1);
          }}
          className={`text-left transition-all p-3.5 sm:p-4 rounded-xl border bg-white shadow-2xs hover:shadow-xs ${
            trash
              ? 'border-rose-500 ring-2 ring-rose-500/10 bg-rose-50/30'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Thùng rác</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
              <Trash2 className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-rose-700">
              {countTrashQuery.isLoading ? '—' : totalTrashCount}
            </span>
            <span className="text-[11px] text-slate-500">bài đã xóa tạm</span>
          </div>
        </button>
      </div>

      {/* 3. Bảng Quản Lý Bài Viết - Tích Hợp Tìm Kiếm, Bộ Lọc & Dữ Liệu Chuẩn Admin */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        {/* Thanh công cụ: Tìm kiếm & Bộ lọc nhanh */}
        <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Nhóm Tabs trạng thái công bố */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-200/60 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setTrash(false);
                setStatus('');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                !trash && status === ''
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({totalAllCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setTrash(false);
                setStatus('PUBLISHED');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                !trash && status === 'PUBLISHED'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đang hiển thị ({totalPublishedCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setTrash(false);
                setStatus('DRAFT');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                !trash && status === 'DRAFT'
                  ? 'bg-white text-amber-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bản nháp ({totalDraftCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setTrash(true);
                setStatus('');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                trash
                  ? 'bg-white text-rose-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Thùng rác ({totalTrashCount})
            </button>
          </div>

          {/* Nhóm Tìm kiếm & Lọc chuyên mục */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Trạng thái đang tải ngầm */}
            {articlesQuery.isFetching && !articlesQuery.isLoading && (
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
                placeholder="Tìm tiêu đề, nội dung tóm tắt…"
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

            {/* Dropdown Lọc chuyên mục */}
            <select
              aria-label="Lọc chuyên mục bài viết"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as '' | GameArticleCategory);
                setPage(1);
              }}
              className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 outline-none transition focus:border-[#00873E] focus:ring-2 focus:ring-[#00873E]/10 cursor-pointer"
            >
              <option value="">Tất cả chuyên mục</option>
              <option value="ANNOUNCEMENT">📢 Thông báo</option>
              <option value="DEVELOPMENT_UPDATE">⚡ Cập nhật game</option>
              <option value="EVENT">🎁 Sự kiện game</option>
              <option value="MAINTENANCE">🔧 Bảo trì hệ thống</option>
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
      </div>

      {/* Bảng dữ liệu bài viết */}
      <CommonTable<ArticleItem>
        data={items}
        columns={columns}
        actions={actions}
        isLoading={articlesQuery.isLoading && !articlesQuery.data}
        showIndexColumn={true}
        onRowClick={(article) => router.push(`${base}/${article.id}`)}
        pagination={{
          page,
          pageSize,
          totalItems,
          onPageChange: (newPage) => setPage(newPage),
          onPageSizeChange: (newPageSize) => {
            setPageSize(newPageSize);
            setPage(1);
          },
        }}
        emptyIcon={trash ? Trash2 : hasActiveFilters ? SearchX : FilePlus}
        emptyTitle={
          trash
            ? 'Thùng rác hiện đang trống'
            : hasActiveFilters
              ? 'Không tìm thấy bài viết nào'
              : 'Chưa có bài viết nào được tạo'
        }
        emptyDescription={
          trash
            ? 'Không có bài viết nào bị xóa tạm. Khi bạn xóa một bài viết, bài viết đó sẽ được lưu tại đây để khôi phục khi cần.'
            : hasActiveFilters
              ? 'Không có bài viết nào khớp với từ khóa tìm kiếm hoặc bộ lọc bạn vừa chọn.'
              : 'Hãy bắt đầu tạo bài viết tin tức, thông báo hoặc sự kiện đầu tiên để cộng đồng người chơi theo dõi.'
        }
      />
    </div>
  );
}
