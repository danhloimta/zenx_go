'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { GameAuditEntry } from '@zenx-go/api-client';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Check,
  Eye,
  History,
  KeyRound,
  Lock,
  Loader2,
  Palette,
  RefreshCw,
  Search,
  SearchX,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Unlock,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

// Cấu hình nhãn hành động thuần Việt & icon
const AUDIT_ACTION_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: any; targetLabel: string }
> = {
  GAME_ADMIN_ROLES_REPLACED: {
    label: 'Cập nhật vai trò quản trị',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: ShieldCheck,
    targetLabel: 'Tài khoản quản trị',
  },
  GAME_PLAYER_BLOCKED: {
    label: 'Khóa tài khoản người chơi',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: Lock,
    targetLabel: 'Người chơi',
  },
  GAME_PLAYER_UNBLOCKED: {
    label: 'Mở khóa tài khoản người chơi',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: Unlock,
    targetLabel: 'Người chơi',
  },
  GAME_SSO_CLIENT_CREATED: {
    label: 'Tạo kết nối SSO game',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    icon: KeyRound,
    targetLabel: 'Kết nối SSO',
  },
  GAME_SSO_CLIENT_UPDATED: {
    label: 'Cập nhật kết nối SSO game',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    icon: KeyRound,
    targetLabel: 'Kết nối SSO',
  },
  GAME_PRESENTATION_UPDATED: {
    label: 'Cập nhật giao diện game',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Palette,
    targetLabel: 'Giao diện web',
  },
  ROLE_CREATED: {
    label: 'Tạo vai trò mới',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: Shield,
    targetLabel: 'Vai trò hệ thống',
  },
};

function getActionConfig(action: string) {
  if (AUDIT_ACTION_CONFIG[action]) return AUDIT_ACTION_CONFIG[action];
  const formatted = action
    .replace(/^GAME_/, '')
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
  return {
    label: formatted,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: History,
    targetLabel: 'Đối tượng',
  };
}

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

export default function GameAuditPage() {
  const { subdomain } = useParams<{ subdomain: string }>();

  const [searchActor, setSearchActor] = useState('');
  const [debouncedActor, setDebouncedActor] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<GameAuditEntry | null>(null);

  // Debounce tìm kiếm theo người thực hiện
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedActor(searchActor.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchActor]);

  // 1. Lấy thông tin ngữ cảnh game
  const context = useQuery({
    queryKey: ['game-admin', 'context', subdomain],
    queryFn: () => api.gameAdmin.context(subdomain),
    retry: false,
  });

  const game = context.data?.game;
  const gameId = game?.id;

  // 2. Query nhật ký tổng quan (để tính 4 thẻ KPI)
  const overviewQuery = useQuery({
    queryKey: ['game-admin', 'audit', gameId, 'overview'],
    queryFn: () => api.gameAdmin.audit(gameId!, { page: 1, pageSize: 50 }),
    enabled: Boolean(gameId),
    staleTime: 30_000,
  });

  // 3. Query danh sách nhật ký chính theo bộ lọc
  const auditQuery = useQuery({
    queryKey: [
      'game-admin',
      'audit',
      gameId,
      page,
      debouncedActor,
      actionFilter,
      fromDate,
      toDate,
    ],
    queryFn: () =>
      api.gameAdmin.audit(gameId!, {
        page,
        pageSize: 20,
        action: actionFilter || undefined,
        actorUserId: debouncedActor || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
      }),
    enabled: Boolean(gameId),
    retry: false,
    placeholderData: (previous) => previous,
  });

  const isSearchLoading =
    searchActor !== debouncedActor || (auditQuery.isFetching && searchActor.length > 0);

  const handleRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      await Promise.all([auditQuery.refetch(), overviewQuery.refetch()]);
      toast.success('Đã cập nhật nhật ký hoạt động mới nhất');
    } catch {
      toast.error('Lỗi khi tải lại dữ liệu nhật ký');
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const resetAllFilters = () => {
    setSearchActor('');
    setDebouncedActor('');
    setActionFilter('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  if (context.isError || (!context.isLoading && !context.data)) {
    return (
      <div className="rounded-xl border border-red-200/80 bg-red-50/80 p-6 text-sm text-red-700 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="size-5 shrink-0 text-red-600" />
          <h3 className="font-bold text-base">Không có quyền xem nhật ký hoạt động</h3>
        </div>
        <p className="mt-2 text-xs text-red-600 leading-relaxed">
          Tài khoản của bạn chưa được phân quyền xem nhật ký hoạt động hoặc trò chơi không tồn tại. Vui lòng kiểm tra lại.
        </p>
      </div>
    );
  }

  const rawItems = auditQuery.data?.items ?? [];
  // Lọc thêm theo tên người thực hiện nếu có nhập từ khóa tìm kiếm
  const items = debouncedActor
    ? rawItems.filter((entry) => {
        const query = debouncedActor.toLowerCase();
        const username = entry.actor?.username?.toLowerCase() ?? '';
        const displayName = entry.actor?.displayName?.toLowerCase() ?? '';
        const actorId = entry.actor?.id?.toLowerCase() ?? '';
        return (
          username.includes(query) || displayName.includes(query) || actorId.includes(query)
        );
      })
    : rawItems;

  const totalItems = auditQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / 20));

  // Thống kê các số liệu cho 4 thẻ KPI
  const allLogs = overviewQuery.data?.items ?? rawItems;
  const totalAllCount = overviewQuery.data?.total ?? totalItems;

  const roleLogsCount = allLogs.filter(
    (l) => l.action.includes('ROLE') || l.action.includes('ADMIN'),
  ).length;
  const playerLogsCount = allLogs.filter((l) => l.action.includes('PLAYER')).length;
  const ssoLogsCount = allLogs.filter(
    (l) => l.action.includes('SSO') || l.action.includes('PRESENTATION'),
  ).length;

  // Tính số lượng hôm nay & 7 ngày
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const todayCount = allLogs.filter((l) => now - new Date(l.createdAt).getTime() < oneDayMs).length;
  const last7dCount = allLogs.filter(
    (l) => now - new Date(l.createdAt).getTime() < 7 * oneDayMs,
  ).length;

  const hasActiveFilters = Boolean(searchActor || actionFilter || fromDate || toDate);

  return (
    <div className="space-y-4 sm:space-y-5 pb-12 w-full relative">
      {/* Top Progress Line khi API đang fetch */}
      {(auditQuery.isFetching || isManualRefreshing) && (
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
              Nhật ký hoạt động · {game?.name ?? 'Trò chơi'}
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Lưu vết toàn bộ các thay đổi vận hành, phân quyền quản trị, bảo mật và điều phối người chơi trong trò chơi.
          </p>
        </div>

        {/* Nút hành động đầu trang */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isManualRefreshing || auditQuery.isFetching}
            className="h-9 px-3 gap-1.5 rounded-lg border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            <RefreshCw
              className={`size-3.5 ${
                isManualRefreshing || auditQuery.isFetching ? 'animate-spin text-[#00873E]' : ''
              }`}
            />
            <span>{isManualRefreshing ? 'Đang tải…' : 'Làm mới'}</span>
          </Button>
        </div>
      </div>

      {/* 2. Bốn Thẻ Thống Kê Nhanh (Click Lọc Tức Thì) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Thẻ 1: Tất cả hoạt động */}
        <button
          type="button"
          onClick={() => {
            resetAllFilters();
          }}
          className={`text-left transition-all p-3.5 sm:p-4 rounded-xl border bg-white shadow-2xs hover:shadow-xs ${
            !actionFilter
              ? 'border-[#00873E] ring-2 ring-[#00873E]/10 bg-emerald-50/20'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tất cả hoạt động</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
              <History className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900">
              {overviewQuery.isLoading ? '—' : totalAllCount}
            </span>
            <span className="text-[11px] text-slate-500">lượt thao tác được ghi lại</span>
          </div>
        </button>

        {/* Thẻ 2: Phân quyền & Vai trò */}
        <button
          type="button"
          onClick={() => {
            setActionFilter('GAME_ADMIN_ROLES_REPLACED');
            setPage(1);
          }}
          className={`text-left transition-all p-3.5 sm:p-4 rounded-xl border bg-white shadow-2xs hover:shadow-xs ${
            actionFilter === 'GAME_ADMIN_ROLES_REPLACED'
              ? 'border-indigo-500 ring-2 ring-indigo-500/10 bg-indigo-50/30'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Phân quyền quản trị</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
              <ShieldCheck className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-indigo-700">
              {overviewQuery.isLoading ? '—' : roleLogsCount}
            </span>
            <span className="text-[11px] text-slate-500">thay đổi quyền & vai trò</span>
          </div>
        </button>

        {/* Thẻ 3: Người chơi & Bảo mật */}
        <button
          type="button"
          onClick={() => {
            setActionFilter('GAME_PLAYER_BLOCKED');
            setPage(1);
          }}
          className={`text-left transition-all p-3.5 sm:p-4 rounded-xl border bg-white shadow-2xs hover:shadow-xs ${
            actionFilter === 'GAME_PLAYER_BLOCKED' || actionFilter === 'GAME_PLAYER_UNBLOCKED'
              ? 'border-rose-500 ring-2 ring-rose-500/10 bg-rose-50/30'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Khóa & Mở người chơi</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
              <Lock className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-rose-700">
              {overviewQuery.isLoading ? '—' : playerLogsCount}
            </span>
            <span className="text-[11px] text-slate-500">thao tác điều phối</span>
          </div>
        </button>

        {/* Thẻ 4: Hệ thống & SSO */}
        <button
          type="button"
          onClick={() => {
            setActionFilter('GAME_SSO_CLIENT_CREATED');
            setPage(1);
          }}
          className={`text-left transition-all p-3.5 sm:p-4 rounded-xl border bg-white shadow-2xs hover:shadow-xs ${
            actionFilter.includes('SSO') || actionFilter.includes('PRESENTATION')
              ? 'border-emerald-500 ring-2 ring-emerald-500/10 bg-emerald-50/30'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Cấu hình & Kết nối SSO</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <KeyRound className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-emerald-700">
              {overviewQuery.isLoading ? '—' : ssoLogsCount}
            </span>
            <span className="text-[11px] text-slate-500">cài đặt hệ thống game</span>
          </div>
        </button>
      </div>

      {/* 3. Bảng Nhật Ký Hoạt Động - Tích Hợp Tìm Kiếm & Dữ Liệu Chuẩn Admin */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        {/* Thanh công cụ: Tìm kiếm & Bộ lọc nhanh */}
        <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Nhóm Tabs mốc thời gian */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-200/60 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setFromDate('');
                setToDate('');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                !fromDate && !toDate
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({totalAllCount})
            </button>
            <button
              type="button"
              onClick={() => {
                const todayStr = new Date().toISOString().split('T')[0];
                setFromDate(todayStr);
                setToDate(todayStr);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                fromDate && fromDate === toDate
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hôm nay ({todayCount})
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date(Date.now() - 7 * oneDayMs);
                setFromDate(d.toISOString().split('T')[0]);
                setToDate('');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                fromDate && !toDate && fromDate !== new Date().toISOString().split('T')[0]
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 ngày qua ({last7dCount})
            </button>
          </div>

          {/* Nhóm Tìm kiếm & Lọc */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Trạng thái đang tải ngầm */}
            {auditQuery.isFetching && !auditQuery.isLoading && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 rounded-full border border-emerald-200/80 shrink-0">
                <Loader2 className="size-3 animate-spin text-[#00873E]" />
                <span>Đang tải…</span>
              </div>
            )}

            {/* Ô tìm kiếm người thực hiện */}
            <div className="relative w-full sm:w-60">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                value={searchActor}
                onChange={(e) => setSearchActor(e.target.value)}
                placeholder="Tìm tên, username người thao tác…"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#00873E] focus:ring-2 focus:ring-[#00873E]/10"
              />
              {isSearchLoading ? (
                <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 animate-spin text-[#00873E]" />
              ) : searchActor ? (
                <button
                  type="button"
                  onClick={() => setSearchActor('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  title="Xóa tìm kiếm"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>

            {/* Dropdown Lọc loại hành động */}
            <select
              aria-label="Lọc loại hành động"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 outline-none transition focus:border-[#00873E] focus:ring-2 focus:ring-[#00873E]/10 cursor-pointer"
            >
              <option value="">Tất cả loại hành động</option>
              <option value="GAME_ADMIN_ROLES_REPLACED">🛡️ Phân quyền quản trị</option>
              <option value="GAME_PLAYER_BLOCKED">🔴 Khóa người chơi</option>
              <option value="GAME_PLAYER_UNBLOCKED">🟢 Mở khóa người chơi</option>
              <option value="GAME_SSO_CLIENT_CREATED">🔑 Tạo kết nối SSO</option>
              <option value="GAME_SSO_CLIENT_UPDATED">🔑 Sửa kết nối SSO</option>
              <option value="GAME_PRESENTATION_UPDATED">🎨 Cập nhật giao diện</option>
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

        {/* Bảng dữ liệu nhật ký */}
        {auditQuery.isLoading && !auditQuery.data ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 py-2 border-b border-slate-100 last:border-0"
              >
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-4 w-28 shrink-0" />
                <Skeleton className="h-4 w-28 shrink-0" />
                <Skeleton className="h-4 w-32 shrink-0" />
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
                  Không tìm thấy hoạt động nào
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm">
                  Không có bản ghi nhật ký nào khớp với bộ lọc hành động hoặc người thực hiện bạn vừa chọn.
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
                  <History className="size-6" />
                </div>
                <h3 className="mt-3.5 text-sm font-bold text-slate-900">
                  Chưa có nhật ký hoạt động nào
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm">
                  Mọi thao tác thay đổi phân quyền, cập nhật giao diện hoặc điều phối người chơi sẽ được tự động ghi nhận lại tại đây.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Hành động & Lý do</th>
                  <th className="py-3 px-4 w-52">Người thực hiện</th>
                  <th className="py-3 px-4 w-48">Đối tượng tác động</th>
                  <th className="py-3 px-4 w-44">Thời gian</th>
                  <th className="py-3 px-4 w-28 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {items.map((entry) => {
                  const actionCfg = getActionConfig(entry.action);
                  const ActionIcon = actionCfg.icon;
                  const relativeTime = formatRelativeTime(entry.createdAt);
                  const exactTime = formatDate(entry.createdAt);
                  const actorName = entry.actor?.displayName || entry.actor?.username || 'Hệ thống';
                  const initials = getAvatarInitials(entry.actor?.displayName, entry.actor?.username);

                  return (
                    <tr
                      key={entry.id}
                      className="group hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Cột 1: Hành động & Lý do */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${actionCfg.badgeClass}`}
                            >
                              <ActionIcon className="size-3" />
                              <span>{actionCfg.label}</span>
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {entry.action}
                            </span>
                          </div>

                          {entry.reason ? (
                            <p className="text-xs text-slate-600 font-medium line-clamp-1 italic">
                              “{entry.reason}”
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">
                              Không kèm ghi chú lý do
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Cột 2: Người thực hiện */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center border border-slate-200 shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs truncate">
                              {actorName}
                            </p>
                            {entry.actor?.username && (
                              <p className="font-mono text-[11px] text-slate-400 truncate">
                                @{entry.actor.username}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cột 3: Đối tượng tác động */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-800 text-xs">
                            {actionCfg.targetLabel || entry.targetType}
                          </p>
                          {entry.targetId && (
                            <p className="font-mono text-[11px] text-slate-400 truncate">
                              ID: {entry.targetId.slice(0, 8)}…
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Cột 4: Thời gian */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="space-y-0.5">
                          <p className="text-slate-800 font-medium text-xs flex items-center gap-1">
                            <Clock className="size-3 text-slate-400" />
                            <span>{relativeTime}</span>
                          </p>
                          <p className="text-[11px] text-slate-400">{exactTime}</p>
                        </div>
                      </td>

                      {/* Cột 5: Chi tiết */}
                      <td className="py-3.5 px-4 align-middle text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedEntry(entry)}
                          className="h-8 px-2.5 rounded-lg border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs gap-1"
                        >
                          <Eye className="size-3.5 text-slate-500" />
                          <span>Xem</span>
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
              Hiển thị hoạt động{' '}
              <strong className="text-slate-800">
                {(page - 1) * 10 + 1} - {Math.min(page * 10, totalItems)}
              </strong>{' '}
              trên tổng số <strong className="text-slate-800">{totalItems}</strong> lượt ghi
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
                {page} / {totalPages}
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

      {/* 4. Drawer Chi Tiết Hoạt Động (Slide-Over Panel) */}
      {selectedEntry && (
        <AuditDetailDrawer
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </div>
  );
}

function AuditDetailDrawer({
  entry,
  onClose,
}: {
  entry: GameAuditEntry;
  onClose: () => void;
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const actionCfg = getActionConfig(entry.action);
  const ActionIcon = actionCfg.icon;

  const handleCopy = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Đã sao chép dữ liệu vào bộ nhớ tạm');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="relative h-full w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-2xl z-10 border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-200">
        <div className="space-y-6">
          {/* Header Drawer */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-bold ${actionCfg.badgeClass}`}
                >
                  <ActionIcon className="size-3.5" />
                  <span>{actionCfg.label}</span>
                </span>
                <span className="font-mono text-xs text-slate-400">
                  {entry.action}
                </span>
              </div>
              <h2 className="text-base font-black text-slate-900 pt-1">
                Chi tiết thay đổi dữ liệu
              </h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 px-2.5 text-xs"
            >
              <X className="size-4" />
              <span className="sr-only">Đóng</span>
            </Button>
          </div>

          {/* Hộp thông tin metadata */}
          <div className="grid grid-cols-2 gap-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 text-xs">
            <div>
              <span className="text-slate-500 font-medium">Người thực hiện</span>
              <p className="font-bold text-slate-900 mt-1">
                {entry.actor?.displayName ?? 'Hệ thống'}
              </p>
              {entry.actor?.username && (
                <p className="font-mono text-[11px] text-slate-400">
                  @{entry.actor.username}
                </p>
              )}
            </div>

            <div>
              <span className="text-slate-500 font-medium">Thời gian thực hiện</span>
              <p className="font-bold text-slate-900 mt-1">
                {formatDate(entry.createdAt)}
              </p>
              <p className="text-[11px] text-slate-400">
                {formatRelativeTime(entry.createdAt)}
              </p>
            </div>

            <div>
              <span className="text-slate-500 font-medium">Loại đối tượng</span>
              <p className="font-bold text-slate-900 mt-1">
                {actionCfg.targetLabel || entry.targetType}
              </p>
            </div>

            <div>
              <span className="text-slate-500 font-medium">Mã đối tượng (Target ID)</span>
              <p className="font-mono text-[11px] text-slate-700 mt-1 truncate">
                {entry.targetId ?? '—'}
              </p>
            </div>
          </div>

          {/* Lý do thay đổi */}
          {entry.reason && (
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3.5 space-y-1">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                Ghi chú lý do thao tác:
              </span>
              <p className="text-xs text-amber-900 font-medium leading-relaxed">
                {entry.reason}
              </p>
            </div>
          )}

          {/* Biến đổi dữ liệu: Trước & Sau */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Dữ liệu biến đổi (Before & After Diff)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Trước thay đổi */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-slate-400" />
                    <span>Trước thay đổi</span>
                  </span>
                  {Boolean(entry.beforeData) && (
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          JSON.stringify(entry.beforeData, null, 2),
                          'before',
                        )
                      }
                      className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1"
                    >
                      {copiedKey === 'before' ? (
                        <Check className="size-3 text-emerald-600" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                      <span>Sao chép</span>
                    </button>
                  )}
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-900 p-3.5 max-h-72 overflow-auto text-xs text-slate-100 font-mono leading-relaxed">
                  {entry.beforeData ? (
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(entry.beforeData, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-slate-500 italic">Không có dữ liệu trước thay đổi</span>
                  )}
                </div>
              </div>

              {/* Sau thay đổi */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Sau thay đổi</span>
                  </span>
                  {Boolean(entry.afterData) && (
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          JSON.stringify(entry.afterData, null, 2),
                          'after',
                        )
                      }
                      className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1"
                    >
                      {copiedKey === 'after' ? (
                        <Check className="size-3 text-emerald-600" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                      <span>Sao chép</span>
                    </button>
                  )}
                </div>
                <div className="rounded-xl border border-emerald-950/40 bg-slate-900 p-3.5 max-h-72 overflow-auto text-xs text-emerald-300 font-mono leading-relaxed ring-1 ring-emerald-500/20">
                  {entry.afterData ? (
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(entry.afterData, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-slate-500 italic">Không có dữ liệu sau thay đổi</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Drawer */}
        <div className="border-t border-slate-100 pt-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-9 px-4 text-xs font-semibold"
          >
            Đóng bảng chi tiết
          </Button>
        </div>
      </aside>
    </div>
  );
}
