'use client';

import Link from 'next/link';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  EyeOff,
  Gamepad2,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
  Copy,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { AdminContentGame, GameLifecycleStatus, GameOperationalStatus } from '@zenx-go/api-client';
import { useAdminContentGames } from '@/hooks/use-content';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, mediaUrl } from '@/lib/utils';
import { gameAdminUrl } from '@/lib/domain';
import { PageHeader } from '@/components/page-header';
import { toast } from 'sonner';
import { CommonTable, type ColumnDef, type TableAction } from '@/components/ui/common-table';

const lifecycleOptions: Array<{ value: '' | GameLifecycleStatus; label: string }> = [
  { value: '', label: 'Tất cả vòng đời' },
  { value: 'LIVE', label: 'Đang vận hành (Live)' },
  { value: 'OPEN_BETA', label: 'Open Beta' },
  { value: 'CLOSED_BETA', label: 'Closed Beta' },
  { value: 'INTERNAL_TEST', label: 'Test nội bộ' },
  { value: 'IN_DEVELOPMENT', label: 'Đang phát triển' },
  { value: 'COMING_SOON', label: 'Sắp ra mắt' },
  { value: 'CONCEPT', label: 'Ý tưởng' },
  { value: 'SUNSET', label: 'Đã đóng (Sunset)' },
];

const operationalOptions: Array<{ value: '' | GameOperationalStatus; label: string }> = [
  { value: '', label: 'Tất cả trạng thái vận hành' },
  { value: 'AVAILABLE', label: 'Sẵn sàng phục vụ' },
  { value: 'MAINTENANCE', label: 'Đang bảo trì' },
  { value: 'DEGRADED', label: 'Suy giảm hiệu năng' },
  { value: 'UNAVAILABLE', label: 'Không khả dụng' },
];

export default function AdminContentGamesPage() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [lifecycleStatus, setLifecycleStatus] = useState<'' | GameLifecycleStatus>('');
  const [operationalStatus, setOperationalStatus] = useState<'' | GameOperationalStatus>('');
  const [visibility, setVisibility] = useState<'' | 'PUBLIC' | 'PRIVATE'>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

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
      lifecycleStatus: lifecycleStatus || undefined,
      operationalStatus: operationalStatus || undefined,
      isPublic: visibility === 'PUBLIC' ? true : visibility === 'PRIVATE' ? false : undefined,
    }),
    [debounced, lifecycleStatus, operationalStatus, page, pageSize, visibility],
  );

  const games = useAdminContentGames(query);
  const totalPages = Math.max(1, games.data?.totalPages ?? 1);
  const totalCount = games.data?.total ?? 0;

  // Stats calculation from current list
  const liveCount = games.data?.items.filter((g) => g.lifecycleStatus === 'LIVE').length ?? 0;
  const publicCount = games.data?.items.filter((g) => g.isPublic).length ?? 0;
  const hasActiveFilters = Boolean(debounced || lifecycleStatus || operationalStatus || visibility);

  const handleResetFilters = () => {
    setSearch('');
    setDebounced('');
    setLifecycleStatus('');
    setOperationalStatus('');
    setVisibility('');
    setPage(1);
  };

  const columns = useMemo<ColumnDef<AdminContentGame>[]>(
    () => [
      {
        id: 'name',
        header: 'Tựa Game & Nhận diện',
        minWidth: 280,
        cell: (game) => (
          <Link
            href={`/admin/content/games/${game.id}`}
            className="flex items-center gap-3.5 group"
          >
            <div className="relative size-11 shrink-0 overflow-hidden rounded-xl border border-slate-200/70 bg-slate-100 shadow-2xs">
              {game.iconUrl || game.coverUrl ? (
                <img
                  src={mediaUrl(game.iconUrl || game.coverUrl || '')}
                  alt={game.name}
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : null}
              <div className="absolute inset-0 -z-10 flex items-center justify-center bg-emerald-50 text-[#00873E]">
                <Gamepad2 className="size-5" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 group-hover:text-[#00873E] transition-colors whitespace-nowrap">
                  {game.name}
                </span>
                {game.primaryGame && (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200/60 whitespace-nowrap">
                    Primary
                  </span>
                )}
                {game.featured && (
                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200/60 whitespace-nowrap">
                    <Sparkles className="size-2.5" /> Nổi bật
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-400 whitespace-nowrap">
                <span className="font-mono font-bold text-[#00873E]">{game.code}</span>
                <span>•</span>
                <span className="truncate">{game.slug}</span>
                {game.subdomain && (
                  <>
                    <span>•</span>
                    <span className="text-slate-500">{game.subdomain}.zenx.vn</span>
                  </>
                )}
              </div>
            </div>
          </Link>
        ),
      },
      {
        id: 'lifecycle',
        header: 'Vòng đời',
        minWidth: 150,
        cell: (game) => <LifecycleBadge status={game.lifecycleStatus} />,
      },
      {
        id: 'operational',
        header: 'Vận hành',
        minWidth: 150,
        cell: (game) => <OperationalBadge status={game.operationalStatus} />,
      },
      {
        id: 'platforms',
        header: 'Nền tảng & Thể loại',
        minWidth: 180,
        cell: (game) => (
          <div className="space-y-1">
            {game.platforms && game.platforms.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {game.platforms.slice(0, 3).map((p) => (
                  <span
                    key={p}
                    className="inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 whitespace-nowrap"
                  >
                    {p}
                  </span>
                ))}
                {game.platforms.length > 3 && (
                  <span className="text-[10px] text-slate-400">+{game.platforms.length - 3}</span>
                )}
              </div>
            ) : (
              <span className="text-xs text-slate-400">—</span>
            )}

            {game.genres && game.genres.length > 0 ? (
              <p className="max-w-[150px] truncate text-[11px] text-slate-500">
                {game.genres.map((g) => g.name).join(', ')}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        id: 'visibility',
        header: 'Hiển thị',
        minWidth: 130,
        cell: (game) => <VisibilityBadge isPublic={game.isPublic} />,
      },
      {
        id: 'updatedAt',
        header: 'Cập nhật',
        minWidth: 130,
        cell: (game) => (
          <span className="whitespace-nowrap text-xs text-slate-500">
            {formatDate(game.updatedAt)}
          </span>
        ),
      },
    ],
    [],
  );

  const actions = (game: AdminContentGame): TableAction<AdminContentGame>[] => [
    {
      key: 'portal',
      label: 'Vào portal Quản trị Game',
      icon: Gamepad2,
      href: gameAdminUrl(game.subdomain),
      target: '_blank',
      rel: 'noopener noreferrer',
    },
    {
      key: 'details',
      label: 'Xem chi tiết Game',
      icon: Eye,
      href: `/admin/content/games/${game.id}`,
    },
    {
      key: 'copy-code',
      label: 'Sao chép mã Game',
      icon: Copy,
      onClick: () => {
        navigator.clipboard.writeText(game.code);
        toast.success(`Đã sao chép mã ${game.code}`);
      },
    },
  ];

  return (
    <div className="space-y-4 w-full">
      {/* Header */}
      <PageHeader
        title="Quản lý Game & Vũ trụ"
        icon={Gamepad2}
        description="Quản lý danh sách tựa game, vòng đời phát hành, thông số vận hành và giao diện."
        badge={
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
            {totalCount} games
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
              onClick={() => void games.refetch()}
              disabled={games.isFetching}
              className="text-xs h-8 px-3 rounded-xl"
            >
              <RefreshCw className={`size-3.5 mr-1.5 ${games.isFetching ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
            <Button asChild size="sm" className="text-xs h-8 px-3.5 rounded-xl font-bold bg-[#00873E] text-white hover:bg-[#007033] shadow-xs">
              <Link href="/admin/content/games/new">
                <Plus className="size-4 mr-1.5" /> Thêm game
              </Link>
            </Button>
          </div>
        }
        className="pb-3 border-b border-slate-100"
      />

      {/* Quick Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => {
            setLifecycleStatus('');
            setVisibility('');
            setPage(1);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
            !lifecycleStatus && !visibility
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <span>Tất cả game</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
              !lifecycleStatus && !visibility ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
            }`}
          >
            {totalCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setLifecycleStatus('LIVE');
            setVisibility('');
            setPage(1);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
            lifecycleStatus === 'LIVE'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span>Đang vận hành (Live)</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
              lifecycleStatus === 'LIVE' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {liveCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setLifecycleStatus('');
            setVisibility('PUBLIC');
            setPage(1);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
            visibility === 'PUBLIC'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <span className="size-1.5 rounded-full bg-sky-500" />
          <span>Hiển thị Public</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
              visibility === 'PUBLIC' ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-800'
            }`}
          >
            {publicCount}
          </span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-3.5 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên game, code (LDDM), slug…"
            className="pl-8 pr-8 h-8 rounded-xl text-xs"
            aria-label="Tìm game"
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
          value={lifecycleStatus}
          onChange={(event) => {
            setLifecycleStatus(event.target.value as '' | GameLifecycleStatus);
            setPage(1);
          }}
          className="h-8 rounded-xl text-xs"
          aria-label="Lọc vòng đời"
        >
          {lifecycleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select
          value={operationalStatus}
          onChange={(event) => {
            setOperationalStatus(event.target.value as '' | GameOperationalStatus);
            setPage(1);
          }}
          className="h-8 rounded-xl text-xs"
          aria-label="Lọc trạng thái vận hành"
        >
          {operationalOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select
          value={visibility}
          onChange={(event) => {
            setVisibility(event.target.value as '' | 'PUBLIC' | 'PRIVATE');
            setPage(1);
          }}
          className="h-8 rounded-xl text-xs"
          aria-label="Lọc hiển thị"
        >
          <option value="">Tất cả hiển thị</option>
          <option value="PUBLIC">Công khai (Public)</option>
          <option value="PRIVATE">Ẩn / Nội bộ (Private)</option>
        </Select>
      </div>

          {/* Filter badges & Clear */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-xs">
              <span className="flex items-center gap-1 font-semibold text-slate-500">
                <SlidersHorizontal className="size-3.5 text-[#00873E]" /> Bộ lọc đang kích hoạt:
              </span>
              {debounced && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700">
                  Từ khoá: &quot;{debounced}&quot;
                </span>
              )}
              {lifecycleStatus && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-medium text-[#00873E]">
                  Vòng đời: {lifecycleLabel(lifecycleStatus)}
                </span>
              )}
              {operationalStatus && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 font-medium text-blue-700">
                  Vận hành: {operationalLabel(operationalStatus)}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-6 gap-1 px-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                <X className="size-3" />
                Xoá bộ lọc
              </Button>
            </div>
          )}

      {/* Main Table Content */}
      {games.isError && !games.data ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-xs">
          <p className="font-bold">Không thể tải danh sách game.</p>
          <p className="mt-1 text-xs text-rose-600">
            Vui lòng kiểm tra kết nối mạng hoặc phiên đăng nhập quản trị của bạn.
          </p>
        </div>
      ) : (
        <CommonTable<AdminContentGame>
          showIndexColumn
          data={games.data?.items ?? []}
          columns={columns}
          actions={actions}
          actionHeaderTitle="Thao tác"
          isLoading={games.isLoading}
          isFetching={games.isFetching}
          emptyTitle="Không tìm thấy game nào"
          emptyDescription={
            hasActiveFilters
              ? 'Không có dữ liệu phù hợp với điều kiện tìm kiếm hoặc bộ lọc hiện tại của bạn.'
              : 'Chưa có game nào được tạo trên hệ thống.'
          }
          emptyIcon={Gamepad2}
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
            ) : undefined
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
    </div>
  );
}

function LifecycleBadge({ status }: { status: GameLifecycleStatus }) {
  switch (status) {
    case 'LIVE':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 whitespace-nowrap shrink-0">
          <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
          Đang vận hành
        </span>
      );
    case 'OPEN_BETA':
    case 'CLOSED_BETA':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700 whitespace-nowrap shrink-0">
          <span className="size-1.5 rounded-full bg-sky-500 shrink-0" />
          {status === 'OPEN_BETA' ? 'Open Beta' : 'Closed Beta'}
        </span>
      );
    case 'IN_DEVELOPMENT':
    case 'CONCEPT':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 whitespace-nowrap shrink-0">
          <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
          {status === 'IN_DEVELOPMENT' ? 'Đang phát triển' : 'Ý tưởng'}
        </span>
      );
    case 'COMING_SOON':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 whitespace-nowrap shrink-0">
          <span className="size-1.5 rounded-full bg-indigo-500 shrink-0" />
          Sắp ra mắt
        </span>
      );
    case 'SUNSET':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 whitespace-nowrap shrink-0">
          <span className="size-1.5 rounded-full bg-slate-400 shrink-0" />
          Đã đóng
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 whitespace-nowrap shrink-0">
          {status}
        </span>
      );
  }
}

function OperationalBadge({ status }: { status: GameOperationalStatus }) {
  switch (status) {
    case 'AVAILABLE':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 whitespace-nowrap shrink-0">
          <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" /> Sẵn sàng
        </span>
      );
    case 'MAINTENANCE':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 whitespace-nowrap shrink-0">
          <span className="size-1.5 rounded-full bg-amber-500 shrink-0" /> Bảo trì
        </span>
      );
    case 'DEGRADED':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700 whitespace-nowrap shrink-0">
          <span className="size-1.5 rounded-full bg-orange-500 shrink-0" /> Suy giảm
        </span>
      );
    case 'UNAVAILABLE':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 whitespace-nowrap shrink-0">
          <span className="size-1.5 rounded-full bg-rose-500 shrink-0" /> Ngắt kết nối
        </span>
      );
    default:
      return (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 whitespace-nowrap shrink-0">
          {status}
        </span>
      );
  }
}

function VisibilityBadge({ isPublic }: { isPublic: boolean }) {
  return isPublic ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 whitespace-nowrap shrink-0">
      <Eye className="size-3 shrink-0" /> Public
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 whitespace-nowrap shrink-0">
      <EyeOff className="size-3 shrink-0" /> Đang ẩn
    </span>
  );
}

function lifecycleLabel(value: string) {
  return lifecycleOptions.find((option) => option.value === value)?.label ?? value;
}

function operationalLabel(value: string) {
  return operationalOptions.find((option) => option.value === value)?.label ?? value;
}

function GameListSkeleton() {
  return (
    <div className="space-y-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <Skeleton className="h-10 w-full rounded-2xl" />
      {[1, 2, 3, 4, 5].map((value) => (
        <div key={value} className="flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
