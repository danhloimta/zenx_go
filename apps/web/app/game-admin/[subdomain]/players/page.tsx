'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { GamePlayer } from '@zenx-go/api-client';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
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
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

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

function getAvatarInitials(name?: string | null, username?: string | null): string {
  const target = (name || username || 'U').trim();
  const parts = target.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return target.slice(0, 2).toUpperCase();
}

export default function GamePlayersPage() {
  const { subdomain } = useParams<{ subdomain: string }>();

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'BLOCKED' | undefined>(undefined);
  const [page, setPage] = useState(1);
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
    queryKey: ['game-admin', 'players', gameId, page, debounced, status],
    queryFn: () =>
      api.gameAdmin.players(gameId!, {
        page,
        pageSize: 10,
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
    queryKey: ['game-admin', 'players', gameId, 'count', 'blocked'],
    queryFn: () => api.gameAdmin.players(gameId!, { page: 1, pageSize: 10, status: 'BLOCKED' }),
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
  const totalPages = playersQuery.data?.totalPages ?? 1;

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
    countBlockedQuery.data?.total ??
    (!debounced && status === 'BLOCKED' ? playersQuery.data?.total : 0) ??
    0;
  const totalSsoLogins = dashboardQuery.data?.totals.totalSsoLogins ?? 0;

  const hasActiveFilters = Boolean(search || status !== undefined);

  return (
    <div className="space-y-4 sm:space-y-5 pb-12 w-full relative">
      {/* Top Progress Line khi API đang fetch */}
      {(playersQuery.isFetching || isManualRefreshing) && (
        <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-emerald-100 overflow-hidden">
          <div className="h-full w-2/5 bg-gradient-to-r from-emerald-500 via-teal-400 to-[#00873E] animate-[pulse_1s_ease-in-out_infinite] rounded-full" />
        </div>
      )}

      {/* 1. Phần Đầu Trang */}
      <div className="flex flex-col gap-3.5 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-emerald-100/90 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-800">
              {game?.code ?? 'GAME'}
            </span>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
              Quản lý người chơi · {game?.name ?? 'Trò chơi'}
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Theo dõi danh sách tài khoản, số lượt đăng nhập SSO, thời gian hoạt động và quản lý trạng thái tài khoản người chơi.
          </p>
        </div>

        {/* Nút hành động đầu trang */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isManualRefreshing || playersQuery.isFetching}
            className="h-9 px-3 gap-1.5 rounded-lg border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            <RefreshCw
              className={`size-3.5 ${
                isManualRefreshing || playersQuery.isFetching ? 'animate-spin text-[#00873E]' : ''
              }`}
            />
            <span>{isManualRefreshing ? 'Đang tải…' : 'Làm mới'}</span>
          </Button>
        </div>
      </div>

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

        {/* Thẻ 3: Đã bị khóa */}
        <button
          type="button"
          onClick={() => {
            setStatus('BLOCKED');
            setPage(1);
          }}
          className={`text-left transition-all p-3.5 sm:p-4 rounded-xl border bg-white shadow-2xs hover:shadow-xs ${
            status === 'BLOCKED'
              ? 'border-rose-500 ring-2 ring-rose-500/10 bg-rose-50/30'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Đã bị khóa</span>
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
              Đã khóa ({totalBlockedCount})
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
                setStatus((e.target.value || undefined) as 'ACTIVE' | 'BLOCKED' | undefined);
                setPage(1);
              }}
              className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 outline-none transition focus:border-[#00873E] focus:ring-2 focus:ring-[#00873E]/10 cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">🟢 Đang hoạt động</option>
              <option value="BLOCKED">🔴 Đã khóa</option>
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

        {/* Bảng dữ liệu người chơi */}
        {playersQuery.isLoading && !playersQuery.data ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 py-2 border-b border-slate-100 last:border-0"
              >
                <Skeleton className="size-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-4 w-32 shrink-0" />
                <Skeleton className="h-6 w-20 rounded-full shrink-0" />
                <Skeleton className="h-8 w-20 rounded-lg shrink-0" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          /* Trạng thái trống */
          <div className="flex flex-col items-center justify-center p-12 text-center">
            {hasActiveFilters ? (
              <>
                <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <SearchX className="size-6" />
                </div>
                <h3 className="mt-3.5 text-sm font-bold text-slate-900">
                  Không tìm thấy người chơi nào
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm">
                  Không có người chơi nào khớp với từ khóa tìm kiếm hoặc bộ lọc trạng thái bạn vừa chọn.
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
                  <Users className="size-6" />
                </div>
                <h3 className="mt-3.5 text-sm font-bold text-slate-900">
                  Chưa có người chơi tham gia
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm">
                  Tài khoản người chơi sẽ được tự động ghi nhận tại bảng này ngay khi game thủ đăng nhập (SSO) vào trò chơi lần đầu tiên.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Người chơi</th>
                  <th className="py-3 px-4 w-52">Đăng nhập gần nhất</th>
                  <th className="py-3 px-4 w-32 text-center">Lượt vào game</th>
                  <th className="py-3 px-4 w-36">Trạng thái</th>
                  <th className="py-3 px-4 w-36 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {items.map((player) => {
                  const isBlocked = player.status === 'BLOCKED';
                  const displayName =
                    player.user.profile?.fullName || player.user.username || 'Người chơi';
                  const initials = getAvatarInitials(
                    player.user.profile?.fullName,
                    player.user.username,
                  );
                  const lastLoginRelative = formatRelativeTime(player.lastLoginAt);
                  const lastLoginExact = formatDate(player.lastLoginAt);
                  const firstLoginExact = formatDate(player.firstLoginAt);

                  return (
                    <tr
                      key={player.id}
                      className="group hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Cột 1: Thông tin người chơi */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-3">
                          {/* Avatar hoặc Initials */}
                          <div className="size-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-800 font-bold text-xs shadow-2xs">
                            {player.user.profile?.avatarUrl ? (
                              <img
                                src={player.user.profile.avatarUrl}
                                alt={displayName}
                                className="size-full object-cover"
                              />
                            ) : (
                              <span>{initials}</span>
                            )}
                          </div>

                          {/* Tên & Username & ID */}
                          <Link href={`/admin/players/${encodeURIComponent(player.userId)}`} className="min-w-0 flex-1 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500/40">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-slate-900 text-sm leading-snug truncate">
                                {displayName}
                              </p>
                              {player.user.username && (
                                <span className="font-mono text-slate-400 text-xs truncate">
                                  @{player.user.username}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 pt-0.5 text-[11px] text-slate-400">
                              <span className="font-mono">ID: {player.userId.slice(0, 8)}…</span>
                              <span>•</span>
                              <span>Tham gia: {firstLoginExact}</span>
                            </div>
                          </Link>
                        </div>
                      </td>

                      {/* Cột 2: Đăng nhập gần nhất */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="space-y-0.5">
                          <p className="text-slate-800 font-medium text-xs flex items-center gap-1">
                            <Clock className="size-3 text-slate-400" />
                            <span>{lastLoginRelative}</span>
                          </p>
                          <p className="text-[11px] text-slate-400">{lastLoginExact}</p>
                        </div>
                      </td>

                      {/* Cột 3: Lượt vào game qua SSO */}
                      <td className="py-3.5 px-4 align-middle text-center">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/80">
                          <LogIn className="size-3 text-slate-400" />
                          <span>{player.loginCount}</span>
                        </span>
                      </td>

                      {/* Cột 4: Trạng thái */}
                      <td className="py-3.5 px-4 align-middle">
                        {isBlocked ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
                              <span className="size-1.5 rounded-full bg-rose-500" />
                              <Lock className="size-3" />
                              <span>Đã khóa</span>
                            </span>
                            {player.blockReason && (
                              <p className="text-[11px] text-rose-600 line-clamp-1 italic">
                                {player.blockReason}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <UserCheck className="size-3" />
                            <span>Hoạt động</span>
                          </span>
                        )}
                      </td>

                      {/* Cột 5: Thao tác */}
                      <td className="py-3.5 px-4 align-middle text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPendingAction({
                              player,
                              nextStatus: isBlocked ? 'ACTIVE' : 'BLOCKED',
                            });
                            setReason('');
                          }}
                          className={`h-8 px-2.5 text-xs font-semibold rounded-lg shadow-2xs transition-all ${
                            isBlocked
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300'
                              : 'border-slate-200 bg-white text-slate-700 hover:text-red-600 hover:bg-red-50 hover:border-red-200'
                          }`}
                        >
                          {isBlocked ? (
                            <>
                              <Unlock className="size-3.5 mr-1" />
                              <span>Mở khóa</span>
                            </>
                          ) : (
                            <>
                              <Lock className="size-3.5 mr-1 text-slate-400" />
                              <span>Khóa</span>
                            </>
                          )}
                        </Button>
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
              Hiển thị người chơi{' '}
              <strong className="text-slate-800">
                {(page - 1) * 10 + 1} - {Math.min(page * 10, totalItems)}
              </strong>{' '}
              trên tổng số <strong className="text-slate-800">{totalItems}</strong> tài khoản
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

      {/* 4. Modal Khóa / Mở Khóa Tài Khoản Người Chơi */}
      {pendingAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
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
              <div className="size-9 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                {getAvatarInitials(
                  pendingAction.player.user.profile?.fullName,
                  pendingAction.player.user.username,
                )}
              </div>
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
        </div>
      )}
    </div>
  );
}
