'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ContentPublishStatus, GameArticleCategory } from '@zenx-go/api-client';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
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
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { gameContentWorkspace } from '@/components/admin-content/content-workspace-adapter';

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
  const client = useQueryClient();

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [category, setCategory] = useState<'' | GameArticleCategory>('');
  const [status, setStatus] = useState<'' | ContentPublishStatus>('');
  const [trash, setTrash] = useState(false);
  const [page, setPage] = useState(1);
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
      debounced,
      category,
      status,
      trash,
    ],
    queryFn: () =>
      workspace!.articles({
        page,
        pageSize: 10,
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

  return (
    <div className="space-y-4 sm:space-y-5 pb-12 w-full">
      {/* 1. Phần Đầu Trang - Rõ Ràng & Thân Thiện */}
      <div className="flex flex-col gap-3.5 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-emerald-100/90 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-800">
              {game?.code ?? 'GAME'}
            </span>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
              Quản lý bài viết · {game?.name ?? 'Trò chơi'}
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Soạn thảo, cập nhật tin tức, sự kiện và thông báo gửi đến cộng đồng người chơi trên trang web game.
          </p>
        </div>

        {/* Nút hành động đầu trang */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isManualRefreshing || articlesQuery.isFetching}
            className="h-9 px-3 gap-1.5 rounded-lg border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
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
              className="h-9 px-3 gap-1.5 rounded-lg border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              <a
                href={`http://${game.subdomain}.lvh.me:3001/tin-tuc`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Globe className="size-3.5 text-emerald-600" />
                <span>Xem mục Tin tức trên web</span>
                <ExternalLink className="size-3 text-slate-400" />
              </a>
            </Button>
          )}

          <Button
            asChild
            size="sm"
            className="h-9 px-3.5 gap-1.5 rounded-lg bg-[#00873E] text-xs font-bold text-white shadow-2xs hover:bg-[#007033]"
          >
            <Link href={`${base}/new`}>
              <Plus className="size-3.5" />
              <span>Viết bài mới</span>
            </Link>
          </Button>
        </div>
      </div>

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

        {/* Bảng dữ liệu bài viết */}
        {articlesQuery.isLoading && !articlesQuery.data ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-2 border-b border-slate-100 last:border-0">
                <Skeleton className="size-12 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/5" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full shrink-0" />
                <Skeleton className="h-4 w-28 shrink-0" />
                <Skeleton className="h-6 w-20 rounded-full shrink-0" />
                <Skeleton className="h-8 w-20 rounded-lg shrink-0" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          /* Trạng thái trống */
          <div className="flex flex-col items-center justify-center p-12 text-center">
            {trash ? (
              <>
                <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Trash2 className="size-6" />
                </div>
                <h3 className="mt-3.5 text-sm font-bold text-slate-900">
                  Thùng rác hiện đang trống
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm">
                  Không có bài viết nào bị xóa tạm. Khi bạn xóa một bài viết, bài viết đó sẽ được lưu tại đây để khôi phục khi cần.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTrash(false);
                    setPage(1);
                  }}
                  className="mt-4 h-8 text-xs font-semibold"
                >
                  Quay lại danh sách bài viết
                </Button>
              </>
            ) : hasActiveFilters ? (
              <>
                <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <SearchX className="size-6" />
                </div>
                <h3 className="mt-3.5 text-sm font-bold text-slate-900">
                  Không tìm thấy bài viết nào
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm">
                  Không có bài viết nào khớp với từ khóa tìm kiếm hoặc bộ lọc bạn vừa chọn.
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
                  <FilePlus className="size-6" />
                </div>
                <h3 className="mt-3.5 text-sm font-bold text-slate-900">
                  Chưa có bài viết nào được tạo
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm">
                  Hãy bắt đầu tạo bài viết tin tức, thông báo hoặc sự kiện đầu tiên để cộng đồng người chơi theo dõi.
                </p>
                <Button
                  asChild
                  size="sm"
                  className="mt-4 h-8 bg-[#00873E] text-xs font-bold text-white hover:bg-[#007033]"
                >
                  <Link href={`${base}/new`}>
                    <Plus className="mr-1.5 size-3.5" />
                    Viết bài mới ngay
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
                  <th className="py-3 px-4">Bài viết</th>
                  <th className="py-3 px-4 w-40">Chuyên mục</th>
                  <th className="py-3 px-4 w-44">Thời gian</th>
                  <th className="py-3 px-4 w-36">Trạng thái</th>
                  <th className="py-3 px-4 w-40 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {items.map((article) => {
                  const catConfig =
                    CATEGORY_CONFIG[article.category as GameArticleCategory] || {
                      label: article.category,
                      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                      icon: Tag,
                    };

                  const statConfig =
                    STATUS_CONFIG[article.status as ContentPublishStatus] || {
                      label: article.status,
                      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                      dotClass: 'bg-slate-400',
                    };

                  const formattedDate = formatDate(
                    article.publishedAt || article.updatedAt || article.createdAt,
                  );

                  const CatIcon = catConfig.icon;

                  return (
                    <tr
                      key={article.id}
                      className="group hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Cột 1: Thông tin bài viết */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-3.5">
                          {/* Ảnh bìa đại diện */}
                          <div className="relative size-12 sm:size-14 shrink-0 overflow-hidden rounded-lg border border-slate-200/80 bg-slate-100">
                            {article.coverImageUrl ? (
                              <img
                                src={article.coverImageUrl}
                                alt={article.title}
                                className="size-full object-cover transition duration-200 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center bg-slate-100 text-slate-400">
                                <FileText className="size-5" />
                              </div>
                            )}
                          </div>

                          {/* Tiêu đề + Trích dẫn + Slug */}
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-slate-900 text-sm leading-snug truncate hover:text-[#00873E] transition-colors">
                              <Link href={`${base}/${article.id}`}>{article.title}</Link>
                            </h3>
                            {article.excerpt && (
                              <p className="text-slate-500 text-xs line-clamp-1 mt-0.5 leading-relaxed">
                                {article.excerpt}
                              </p>
                            )}
                            <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
                              /tin-tuc/{article.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Chuyên mục */}
                      <td className="py-3.5 px-4 align-middle">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${catConfig.badgeClass}`}
                        >
                          <CatIcon className="size-3" />
                          <span>{catConfig.label}</span>
                        </span>
                      </td>

                      {/* Cột 3: Thời gian cập nhật */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="space-y-0.5">
                          <p className="text-slate-700 font-medium text-xs">{formattedDate}</p>
                          {article.readTimeMinutes ? (
                            <div className="flex items-center gap-1 text-[11px] text-slate-400">
                              <Clock className="size-3" />
                              <span>{article.readTimeMinutes} phút đọc</span>
                            </div>
                          ) : null}
                        </div>
                      </td>

                      {/* Cột 4: Trạng thái */}
                      <td className="py-3.5 px-4 align-middle">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statConfig.badgeClass}`}
                        >
                          <span className={`size-1.5 rounded-full ${statConfig.dotClass}`} />
                          <span>{statConfig.label}</span>
                        </span>
                      </td>

                      {/* Cột 5: Thao tác */}
                      <td className="py-3.5 px-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Xem trước trên trang web */}
                          {article.status === 'PUBLISHED' && !trash && game?.subdomain && (
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs text-slate-600 hover:text-[#00873E] hover:bg-emerald-50"
                              title="Xem bài viết trên web game"
                            >
                              <a
                                href={`http://${game.subdomain}.lvh.me:3001/tin-tuc/${article.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Eye className="size-3.5 mr-1 text-slate-500" />
                                <span>Xem</span>
                              </a>
                            </Button>
                          )}

                          {/* Sửa bài viết */}
                          {!trash && (
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 rounded-lg border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs"
                            >
                              <Link href={`${base}/${article.id}`}>
                                <Edit3 className="size-3.5 mr-1 text-slate-500" />
                                <span>Sửa</span>
                              </Link>
                            </Button>
                          )}

                          {/* Khôi phục bài (khi ở thùng rác) */}
                          {trash ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={restoreMutation.isPending && mutatingId === article.id}
                              onClick={() => {
                                setMutatingId(article.id);
                                restoreMutation.mutate(article.id);
                              }}
                              className="h-8 px-2.5 rounded-lg border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                            >
                              {restoreMutation.isPending && mutatingId === article.id ? (
                                <Loader2 className="size-3.5 mr-1 animate-spin text-emerald-700" />
                              ) : (
                                <RotateCcw className="size-3.5 mr-1" />
                              )}
                              <span>Khôi phục</span>
                            </Button>
                          ) : (
                            /* Xóa vào thùng rác */
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={removeMutation.isPending && mutatingId === article.id}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Bạn có chắc chắn muốn chuyển bài viết “${article.title}” vào thùng rác?`,
                                  )
                                ) {
                                  setMutatingId(article.id);
                                  removeMutation.mutate(article.id);
                                }
                              }}
                              className="h-8 px-2 rounded-lg text-xs text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="Chuyển vào thùng rác"
                            >
                              {removeMutation.isPending && mutatingId === article.id ? (
                                <Loader2 className="size-3.5 animate-spin text-red-600" />
                              ) : (
                                <Trash2 className="size-3.5" />
                              )}
                            </Button>
                          )}
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
              Hiển thị bài viết{' '}
              <strong className="text-slate-800">
                {(page - 1) * 10 + 1} - {Math.min(page * 10, totalItems)}
              </strong>{' '}
              trên tổng số <strong className="text-slate-800">{totalItems}</strong> bài viết
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
