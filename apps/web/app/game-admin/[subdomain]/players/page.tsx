'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { GamePlayer } from '@zenx-go/api-client';
import {
  AlertCircle,
  Clock,
  Eye,
  Lock,
  LogIn,
  Loader2,
  RefreshCw,
  Search,
  SearchX,
  ShieldAlert,
  Unlock,
  UserCheck,
  Users,
  UserX,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { CommonTable, type ColumnDef, type TableAction } from '@/components/ui/common-table';
import { UserAvatar } from '@/components/user-avatar';

function formatRelativeTime(dateStr: string): string {
  const time = new Date(dateStr).getTime();
  if (Number.isNaN(time)) return '—';
  const diffMs = Date.now() - time;
  if (diffMs < 0) return 'Vừa xong';
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 30) return `${diffDays} ngày trước`;
  return formatDate(dateStr);
}

export default function GamePlayersPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'TEMPORARILY_BLOCKED' | 'PERMANENTLY_BANNED' | 'BLOCKED' | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  // Trạng thái modal thay đổi khóa/mở khóa
  const [pendingAction, setPendingAction] = useState<{
    player: GamePlayer;
    nextStatus: 'ACTIVE' | 'BLOCKED';
  } | null>(null);
  const [reason, setReason] = useState('');

  const client = useQueryClient();

  // Debounce tìm kiếm
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  // 1. Lấy thông tin ngữ cảnh game
  const context = useQuery({
    queryKey: ['game-admin', 'context', subdomain],
    queryFn: () => api.gameAdmin.context(subdomain),
    retry: false,
  });

  const game = context.data?.game;
  const gameId = game?.id;

  // 2. Query thống kê tổng quan (Dashboard metrics)
  const dashboardQuery = useQuery({
    queryKey: ['game-admin', 'dashboard', gameId],
    queryFn: () => api.gameAdmin.dashboard(gameId!),
    enabled: Boolean(gameId),
    staleTime: 30_000,
  });

  // 3. Query danh sách người chơi chính
  const playersQuery = useQuery({
    queryKey: ['game-admin', 'players', gameId, page, pageSize, debounced, status],
    queryFn: () =>
      api.gameAdmin.players(gameId!, {
        page,
        pageSize,
        search: debounced || undefined,
        status,
      }),
    enabled: Boolean(gameId),
    retry: false,
    placeholderData: (previous) => previous,
  });

  // 4. Query đếm số lượng người chơi theo trạng thái
  const countActiveQuery = useQuery({
    queryKey: ['game-admin', 'players', gameId, 'count', 'active'],
    queryFn: () => api.gameAdmin.players(gameId!, { page: 1, pageSize: 10, status: 'ACTIVE' }),
    enabled: Boolean(gameId),
    staleTime: 30_000,
  });

  const countBlockedQuery = useQuery({
    queryKey: ['game-admin', 'players', gameId, 'count', 'banned'],
    queryFn: () => api.gameAdmin.players(gameId!, { page: 1, pageSize: 10, status: 'PERMANENTLY_BANNED' }),
    enabled: Boolean(gameId),
    staleTime: 30_000,
  });

  const countTemporaryQuery = useQuery({
    queryKey: ['game-admin', 'players', gameId, 'count', 'temporary'],
    queryFn: () => api.gameAdmin.players(gameId!, { page: 1, pageSize: 10, status: 'TEMPORARILY_BLOCKED' }),
    enabled: Boolean(gameId),
    staleTime: 30_000,
  });

  // 5. Mutation cập nhật trạng thái Khóa / Mở khóa
  const updateMutation = useMutation({
    mutationFn: (input: {
      userId: string;
      nextStatus: 'ACTIVE' | 'BLOCKED';
      expectedUpdatedAt: string;
      reason: string;
    }) =>
      api.gameAdmin.updatePlayerStatus(gameId!, input.userId, {
        status: input.nextStatus,
        expectedUpdatedAt: input.expectedUpdatedAt,
        reason: input.reason,
      }),
    onSuccess: (_, variables) => {
      toast.success(
        variables.nextStatus === 'BLOCKED'
          ? 'Đã khóa tài khoản người chơi thành công'
          : 'Đã mở khóa tài khoản người chơi thành công',
      );
      setPendingAction(null);
      setReason('');
      void client.invalidateQueries({ queryKey: ['game-admin', 'players', gameId] });
      void client.invalidateQueries({ queryKey: ['game-admin', 'dashboard', gameId] });
    },
    onError: (err: any) => {
      toast.error(
        err?.message ||
          'Không thể cập nhật trạng thái người chơi. Dữ liệu có thể đã thay đổi, vui lòng thử lại.',
      );
    },
  });

  const isSearchLoading = search !== debounced || (playersQuery.isFetching && search.length > 0);

  const handleRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      await Promise.all([
        playersQuery.refetch(),
        dashboardQuery.refetch(),
        countActiveQuery.refetch(),
        countBlockedQuery.refetch(),
        countTemporaryQuery.refetch(),
      ]);
      toast.success('Đã cập nhật danh sách người chơi mới nhất');
    } catch {
      toast.error('Lỗi khi tải lại dữ liệu người chơi');
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const resetAllFilters = () => {
    setSearch('');
    setDebounced('');
    setStatus(undefined);
    setPage(1);
  };

  if (context.isError || (!context.isLoading && !context.data)) {
    return (
      <div className="rounded-xl border border-red-200/80 bg-red-50/80 p-6 text-sm text-red-700 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="size-5 shrink-0 text-red-600" />
          <h3 className="font-bold text-base">Không có quyền xem danh sách người chơi</h3>
        </div>
        <p className="mt-2 text-xs text-red-600 leading-relaxed">
          Tài khoản của bạn chưa được phân quyền quản lý người chơi hoặc trò chơi không tồn tại. Vui lòng kiểm tra lại.
        </p>
      </div>
    );
  }

  const items = playersQuery.data?.items ?? [];
  const totalItems = playersQuery.data?.total ?? 0;

  // Tính số liệu cho 4 thẻ KPI
  const totalAllCount =
    dashboardQuery.data?.totals.totalPlayers ??
    (!debounced && status === undefined ? playersQuery.data?.total : 0) ??
    0;
  const totalActiveCount =
    countActiveQuery.data?.total ??
    (!debounced && status === 'ACTIVE' ? playersQuery.data?.total : 0) ??
    0;
  const totalBlockedCount =
    (countBlockedQuery.data?.total ?? 0) + (countTemporaryQuery.data?.total ?? 0);
  const totalSsoLogins = dashboardQuery.data?.totals.totalSsoLogins ?? 0;

  const hasActiveFilters = Boolean(search || status !== undefined);

  const columns = useMemo<ColumnDef<GamePlayer>[]>(() => [
    {
      id: 'player',
      header: 'Người chơi',
      cell: (player) => {
        const displayName = player.user.profile?.fullName || player.user.username || 'Người chơi';
        const firstLoginExact = formatDate(player.firstLoginAt);

        return (
          <div className="flex items-center gap-3">
            <UserAvatar
              id={player.userId}
              name={player.user.profile?.fullName}
              username={player.user.username}
              avatarUrl={player.user.profile?.avatarUrl}
              status={player.status === 'ACTIVE' ? 'ACTIVE' : 'LOCKED'}
              showStatusDot
              size="md"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-900 text-xs truncate">
                  {displayName}
                </span>
                {player.user.username && (
                  <span className="font-mono text-slate-400 text-[11px] truncate">
                    @{player.user.username}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 pt-0.5 text-[11px] text-slate-400 whitespace-nowrap">
                <span className="font-mono">ID: {player.userId.slice(0, 8)}…</span>
                <span>•</span>
                <span>Tham gia: {firstLoginExact}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: 'lastLoginAt',
      header: 'Đăng nhập gần nhất',
      cell: (player) => {
        const lastLoginRelative = formatRelativeTime(player.lastLoginAt);
        const lastLoginExact = formatDate(player.lastLoginAt);
        return (
          <div className="space-y-0.5 whitespace-nowrap">
            <p className="text-slate-800 font-medium text-xs flex items-center gap-1">
              <Clock className="size-3 text-slate-400 shrink-0" />
              <span>{lastLoginRelative}</span>
            </p>
            <p className="text-[11px] text-slate-400">{lastLoginExact}</p>
          </div>
        );
      },
    },
    {
      id: 'loginCount',
      header: 'Lượt vào game',
      className: 'text-center',
      headerClassName: 'text-center',
      cell: (player) => (
        <span className="inline-flex items-center gap-1 font-mono font-bold text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/80 whitespace-nowrap shrink-0">
          <LogIn className="size-3 text-slate-400 shrink-0" />
          <span>{player.loginCount}</span>
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: (player) => {
        const isBlocked = player.status !== 'ACTIVE';
        return isBlocked ? (
          <div className="space-y-0.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 whitespace-nowrap shrink-0">
              <span className="size-1.5 rounded-full bg-rose-500 shrink-0" />
              <Lock className="size-3 shrink-0" />
              <span>{player.status === 'TEMPORARILY_BLOCKED' ? 'Khóa tạm thời' : 'Cấm vĩnh viễn'}</span>
            </span>
            {player.blockReason && (
              <p className="text-[11px] text-rose-600 line-clamp-1 italic max-w-[200px]">
                {player.blockReason}
              </p>
            )}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 whitespace-nowrap shrink-0">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <UserCheck className="size-3 shrink-0" />
            <span>Hoạt động</span>
          </span>
        );
      },
    },
  ], []);

  const actions = useMemo<(player: GamePlayer) => TableAction<GamePlayer>[]>(() => (player: GamePlayer) => {
    const isBlocked = player.status !== 'ACTIVE';
    return [
      {
        key: 'view',
        label: 'Xem chi tiết',
        icon: Eye,
        onClick: (p) => router.push(`/game-admin/${subdomain}/players/${encodeURIComponent(p.userId)}`),
      },
      {
        key: 'toggle-block',
        label: isBlocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản',
        icon: isBlocked ? Unlock : Lock,
        variant: isBlocked ? 'default' : 'danger',
        onClick: (p) => {
          setPendingAction({
            player: p,
            nextStatus: isBlocked ? 'ACTIVE' : 'BLOCKED',
          });
          setReason('');
        },
      },
    ];
  }, [router, subdomain]);

  return (
    <div className="space-y-4 sm:space-y-5 pb-12 w-full relative">
      {/* Top Progress Line khi API đang fetch */}
      {(playersQuery.isFetching || isManualRefreshing) && (
        <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-emerald-100 overflow-hidden">
          <div className="h-full w-2/5 bg-gradient-to-r from-emerald-500 via-teal-400 to-[#00873E] animate-[pulse_1s_ease-in-out_infinite] rounded-full" />
        </div>
      )}

      {/* 1. Phần Đầu Trang */}
      <PageHeader
        icon={Users}
        title={`Quản lý người chơi · ${game?.name ?? 'Trò chơi'}`}
        badge={
          <span className="rounded bg-emerald-100/90 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
            {game?.code ?? 'GAME'}
          </span>
        }
        description="Theo dõi danh sách tài khoản, số lượt đăng nhập SSO, thời gian hoạt động và quản lý trạng thái tài khoản người chơi."
        actions={
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isManualRefreshing || playersQuery.isFetching}
              className="h-8 px-3 gap-1.5 rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              <RefreshCw
                className={`size-3.5 ${
                  isManualRefreshing || playersQuery.isFetching ? 'animate-spin text-[#00873E]' : ''
                }`}
              />
              <span>{isManualRefreshing ? 'Đang tải…' : 'Làm mới'}</span>
            </Button>
          </div>
        }
        className="border-b border-slate-100 pb-3"
      />

      {/* 2. Bốn Thẻ Thống Kê Nhanh (Click Lọc Tức Thì) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Thẻ 1: Tất cả người chơi */}
        <button
          type="button"
          onClick={() => {
            setStatus(undefined);
            setPage(1);
          }}
          className={`text-left transition-all p-3.5 sm:p-4 rounded-xl border bg-white shadow-2xs hover:shadow-xs ${
            status === undefined
              ? 'border-[#00873E] ring-2 ring-[#00873E]/10 bg-emerald-50/20'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tất cả người chơi</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
              <Users className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900">
              {dashboardQuery.isLoading ? '—' : totalAllCount}
            </span>
            <span className="text-[11px] text-slate-500">tài khoản đã tham gia</span>
          </div>
        </button>

        {/* Thẻ 2: Đang hoạt động */}
        <button
          type="button"
          onClick={() => {
            setStatus('ACTIVE');
            setPage(1);
          }}
          className={`text-left transition-all p-3.5 sm:p-4 rounded-xl border bg-white shadow-2xs hover:shadow-xs ${
            status === 'ACTIVE'
              ? 'border-emerald-500 ring-2 ring-emerald-500/10 bg-emerald-50/30'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Đang hoạt động</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <UserCheck className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-emerald-700">
              {countActiveQuery.isLoading ? '—' : totalActiveCount}
            </span>
            <span className="text-[11px] text-slate-500">truy cập bình thường</span>
          </div>
        </button>

        {/* Thẻ 3: Đang bị hạn chế */}
        <button
          type="button"
          onClick={() => {
            setStatus('BLOCKED');
            setPage(1);
          }}
          className={`text-left transition-all p-3.5 sm:p-4 rounded-xl border bg-white shadow-2xs hover:shadow-xs ${
            status === 'PERMANENTLY_BANNED' || status === 'TEMPORARILY_BLOCKED'
              ? 'border-rose-500 ring-2 ring-rose-500/10 bg-rose-50/30'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Đang bị hạn chế</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
              <UserX className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-rose-700">
              {countBlockedQuery.isLoading ? '—' : totalBlockedCount}
            </span>
            <span className="text-[11px] text-slate-500">tạm ngưng truy cập</span>
          </div>
        </button>

        {/* Thẻ 4: Lượt vào game SSO */}
        <div className="text-left p-3.5 sm:p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Lượt vào game (SSO)</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
              <LogIn className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-indigo-700">
              {dashboardQuery.isLoading ? '—' : totalSsoLogins}
            </span>
            <span className="text-[11px] text-slate-500">lần xác thực thành công</span>
          </div>
        </div>
      </div>

      {/* 3. Bảng Quản Lý Người Chơi - Tích Hợp Tìm Kiếm & Dữ Liệu Chuẩn Admin */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        {/* Thanh công cụ: Tìm kiếm & Bộ lọc nhanh */}
        <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Nhóm Tabs trạng thái */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-200/60 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setStatus(undefined);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                status === undefined
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({totalAllCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatus('ACTIVE');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                status === 'ACTIVE'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đang hoạt động ({totalActiveCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatus('BLOCKED');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                status === 'BLOCKED'
                  ? 'bg-white text-rose-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đang bị hạn chế ({totalBlockedCount})
            </button>
          </div>

          {/* Nhóm Tìm kiếm & Lọc trạng thái */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Trạng thái đang tải ngầm */}
            {playersQuery.isFetching && !playersQuery.isLoading && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 rounded-full border border-emerald-200/80 shrink-0">
                <Loader2 className="size-3 animate-spin text-[#00873E]" />
                <span>Đang tải…</span>
              </div>
            )}

            {/* Ô tìm kiếm */}
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên hiển thị, username, User ID…"
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

            {/* Dropdown Lọc trạng thái */}
            <select
              aria-label="Lọc trạng thái người chơi"
              value={status ?? ''}
              onChange={(e) => {
                setStatus((e.target.value || undefined) as 'ACTIVE' | 'TEMPORARILY_BLOCKED' | 'PERMANENTLY_BANNED' | 'BLOCKED' | undefined);
                setPage(1);
              }}
              className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 outline-none transition focus:border-[#00873E] focus:ring-2 focus:ring-[#00873E]/10 cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">🟢 Đang hoạt động</option>
              <option value="TEMPORARILY_BLOCKED">🟠 Khóa tạm thời</option>
              <option value="PERMANENTLY_BANNED">🔴 Cấm vĩnh viễn</option>
              <option value="BLOCKED">🔴 Đã khóa (cũ)</option>
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

      {/* Bảng dữ liệu người chơi */}
      <CommonTable<GamePlayer>
        data={items}
        columns={columns}
        actions={actions}
        isLoading={playersQuery.isLoading && !playersQuery.data}
        showIndexColumn={true}
        onRowClick={(player) => router.push(`/game-admin/${subdomain}/players/${encodeURIComponent(player.userId)}`)}
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
        emptyIcon={hasActiveFilters ? SearchX : Users}
        emptyTitle={
          hasActiveFilters ? 'Không tìm thấy người chơi nào' : 'Chưa có người chơi tham gia'
        }
        emptyDescription={
          hasActiveFilters
            ? 'Không có người chơi nào khớp với từ khóa tìm kiếm hoặc bộ lọc trạng thái bạn vừa chọn.'
            : 'Tài khoản người chơi sẽ được tự động ghi nhận tại bảng này ngay khi game thủ đăng nhập (SSO) vào trò chơi lần đầu tiên.'
        }
      />

      {/* 4. Modal Khóa / Mở Khóa Tài Khoản Người Chơi */}
      {pendingAction &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-md my-auto max-h-[calc(100dvh-2.5rem)] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
              {/* Header Modal */}
              <div className="flex items-center gap-3">
                <div
                  className={`flex size-10 items-center justify-center rounded-xl ${
                    pendingAction.nextStatus === 'BLOCKED'
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {pendingAction.nextStatus === 'BLOCKED' ? (
                    <Lock className="size-5" />
                  ) : (
                    <Unlock className="size-5" />
                  )}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {pendingAction.nextStatus === 'BLOCKED'
                      ? 'Khóa tài khoản người chơi'
                      : 'Mở khóa tài khoản người chơi'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {pendingAction.nextStatus === 'BLOCKED'
                      ? 'Người chơi sẽ bị chặn đăng nhập SSO vào trò chơi này.'
                      : 'Cho phép người chơi đăng nhập lại vào trò chơi bình thường.'}
                  </p>
                </div>
              </div>

              {/* Thông tin tóm tắt người chơi */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 flex items-center gap-3">
                <UserAvatar
                  id={pendingAction.player.userId}
                  name={pendingAction.player.user.profile?.fullName}
                  username={pendingAction.player.user.username}
                  avatarUrl={pendingAction.player.user.profile?.avatarUrl}
                  status={pendingAction.player.status === 'ACTIVE' ? 'ACTIVE' : 'LOCKED'}
                  showStatusDot
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-xs truncate">
                    {pendingAction.player.user.profile?.fullName ||
                      pendingAction.player.user.username ||
                      'Người chơi'}
                  </p>
                  <p className="text-[11px] font-mono text-slate-400 truncate">
                    @{pendingAction.player.user.username} · ID:{' '}
                    {pendingAction.player.userId.slice(0, 8)}…
                  </p>
                </div>
              </div>

              {/* Ô nhập lý do */}
              <div className="space-y-1.5">
                <label
                  htmlFor="moderation-reason"
                  className="text-xs font-semibold text-slate-700 flex items-center justify-between"
                >
                  <span>Lý do thay đổi trạng thái (bắt buộc)</span>
                  <span className="text-[11px] text-slate-400 font-normal">Tối thiểu 3 ký tự</span>
                </label>
                <textarea
                  id="moderation-reason"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    pendingAction.nextStatus === 'BLOCKED'
                      ? 'Ví dụ: Vi phạm quy định nạp game, yêu cầu tạm ngưng từ hỗ trợ viên, phát hiện hành vi gian lận…'
                      : 'Ví dụ: Người chơi đã khiếu nại thành công, hết thời hạn tạm khóa tài khoản…'
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#00873E] focus:ring-2 focus:ring-[#00873E]/10 resize-none"
                />
              </div>

              {/* Thông báo lưu ý */}
              <div className="flex items-start gap-2 rounded-lg bg-amber-50/80 p-2.5 text-[11px] text-amber-800 border border-amber-200/60">
                <AlertCircle className="size-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  Thay đổi trạng thái sẽ có hiệu lực ngay ở lần đăng nhập (SSO) tiếp theo của người chơi.
                </span>
              </div>

              {/* Nút hành động */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPendingAction(null);
                    setReason('');
                  }}
                  className="h-9 px-3 text-xs"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={reason.trim().length < 3 || updateMutation.isPending}
                  onClick={() =>
                    updateMutation.mutate({
                      userId: pendingAction.player.userId,
                      nextStatus: pendingAction.nextStatus,
                      expectedUpdatedAt: pendingAction.player.updatedAt,
                      reason: reason.trim(),
                    })
                  }
                  className={`h-9 px-4 text-xs font-bold gap-1.5 text-white ${
                    pendingAction.nextStatus === 'BLOCKED'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-[#00873E] hover:bg-[#007033]'
                  }`}
                >
                  {updateMutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
                  <span>
                    {pendingAction.nextStatus === 'BLOCKED' ? 'Xác nhận khóa' : 'Xác nhận mở khóa'}
                  </span>
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
