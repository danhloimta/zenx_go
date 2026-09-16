'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ExternalLink,
  FileText,
  Gamepad2,
  Globe,
  History,
  Loader2,
  Palette,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/user-avatar';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { GamePlayer } from '@zenx-go/api-client';

export default function GameAdminDashboardPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, startTransition] = useTransition();

  const context = useQuery({
    queryKey: ['game-admin', 'context', subdomain],
    queryFn: () => api.gameAdmin.context(subdomain),
    retry: false,
  });

  const gameId = context.data?.game.id;

  const dashboard = useQuery({
    queryKey: ['game-admin', 'dashboard', gameId],
    queryFn: () => api.gameAdmin.dashboard(gameId!),
    enabled: Boolean(gameId),
    retry: false,
  });

  const articlesQuery = useQuery({
    queryKey: ['game-admin', 'articles', gameId],
    queryFn: () => api.gameAdmin.content.articles(gameId!, { pageSize: 5 }),
    enabled: Boolean(gameId),
    retry: false,
  });

  const eventsQuery = useQuery({
    queryKey: ['game-admin', 'events', gameId],
    queryFn: () => api.gameAdmin.content.events(gameId!, { pageSize: 5 }),
    enabled: Boolean(gameId),
    retry: false,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        dashboard.refetch(),
        articlesQuery.refetch(),
        eventsQuery.refetch(),
        context.refetch(),
      ]);
      startTransition(() => {
        toast.success('Đã cập nhật số liệu mới nhất');
      });
    } catch {
      toast.error('Có lỗi khi tải lại dữ liệu');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (context.isLoading || (context.data && dashboard.isLoading)) {
    return <GameDashboardSkeleton />;
  }

  if (context.isError || !context.data) {
    return (
      <div className="rounded-xl border border-red-200/80 bg-red-50/70 p-5 text-sm text-red-700 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="size-4.5 shrink-0 text-red-600" />
          <p className="font-semibold">Không tìm thấy thông tin quản trị của game này.</p>
        </div>
        <p className="mt-1.5 text-xs text-red-600">
          Vui lòng kiểm tra lại quyền của tài khoản hoặc đường dẫn trang web.
        </p>
      </div>
    );
  }

  if (dashboard.isError || !dashboard.data) {
    return (
      <div className="rounded-xl border border-red-200/80 bg-red-50/70 p-5 text-sm text-red-700 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="size-4.5 shrink-0 text-red-600" />
          <p className="font-semibold">Chưa tải được số liệu tổng quan của game.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-3.5 h-7.5 border-red-200 bg-white text-xs text-red-700 hover:bg-red-50"
          onClick={() => dashboard.refetch()}
        >
          <RefreshCw className="mr-1.5 size-3" /> Bấm để thử lại
        </Button>
      </div>
    );
  }

  const game = context.data.game;
  const totals = dashboard.data.totals;
  const recentPlayers = dashboard.data.recentPlayers;
  const articles = articlesQuery.data?.items ?? [];

  const currentDateFormatted = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const activeRate =
    totals.totalPlayers > 0
      ? ((totals.active7d / totals.totalPlayers) * 100).toFixed(1)
      : '0';

  const retentionRate =
    totals.totalPlayers > 0
      ? Math.round((totals.returning / totals.totalPlayers) * 100)
      : 0;

  const operationalBadgeConfig: Record<string, { label: string; className: string }> = {
    AVAILABLE: {
      label: 'Đang mở chơi',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    MAINTENANCE: {
      label: 'Đang bảo trì',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    UNAVAILABLE: {
      label: 'Tạm dừng',
      className: 'bg-slate-100 text-slate-600 border-slate-200',
    },
  };

  const opStatus = operationalBadgeConfig[game.operationalStatus] || {
    label: game.operationalStatus,
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const isAnyFetching = dashboard.isFetching || articlesQuery.isFetching || isRefreshing;

  return (
    <div className="space-y-4 sm:space-y-4.5 pb-8 w-full relative">
      {/* Thanh tiến trình trên cùng khi API đang tải/cập nhật dữ liệu */}
      {isAnyFetching && (
        <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-emerald-100/80 overflow-hidden">
          <div className="h-full w-2/5 bg-gradient-to-r from-emerald-500 via-teal-400 to-[#00873E] animate-[pulse_1s_ease-in-out_infinite] rounded-full" />
        </div>
      )}

      {/* 1. Phần Đầu Trang - Rõ Ràng & Thân Thiện */}
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-2xs ring-1 ring-emerald-500/30 overflow-hidden">
            {game.logoUrl ? (
              <img src={game.logoUrl} alt={game.name} className="size-full object-cover" />
            ) : (
              <Gamepad2 className="size-5" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="rounded bg-emerald-100/80 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
                {game.code}
              </span>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                Tổng quan {game.name}
              </h1>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${opStatus.className}`}
              >
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {opStatus.label}
              </span>
              {game.isPublic ? (
                <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                  Hiển thị công khai
                </span>
              ) : (
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  Chỉ xem nội bộ
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Địa chỉ web game: <strong className="text-slate-700 font-mono">{game.subdomain}.lvh.me</strong> · {currentDateFormatted}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Huy hiệu thông báo trạng thái cập nhật ngầm */}
          {isAnyFetching && !isRefreshing && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 rounded-full border border-emerald-200/80">
              <Loader2 className="size-3 animate-spin text-[#00873E]" />
              <span>Đang cập nhật…</span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-7.5 px-2.5 gap-1.5 rounded-lg border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            <RefreshCw
              className={`size-3 ${
                isRefreshing || dashboard.isFetching ? 'animate-spin text-[#00873E]' : ''
              }`}
            />
            <span>{isRefreshing ? 'Đang cập nhật…' : 'Làm mới'}</span>
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-7.5 px-2.5 gap-1.5 rounded-lg border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            <a
              href={`http://${game.subdomain}.lvh.me:3001`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Globe className="size-3 text-emerald-600" />
              <span>Xem trang web game</span>
              <ExternalLink className="size-2.5 text-slate-400" />
            </a>
          </Button>

          <Button
            asChild
            size="sm"
            className="h-7.5 px-2.5 gap-1.5 rounded-lg bg-[#00873E] text-xs font-semibold text-white shadow-2xs hover:bg-[#007033]"
          >
            <Link href="/admin/presentation">
              <Palette className="size-3" />
              <span>Đổi giao diện</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Bốn Khối Số Liệu Chính - Dễ Hiểu, Không Thuật Ngữ Khó */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {/* Khối 1: Tổng người chơi */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs transition duration-150 hover:-translate-y-0.5 hover:shadow-xs">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                Tổng số người chơi
              </p>
              <p className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-slate-900 truncate">
                {totals.totalPlayers.toLocaleString('vi-VN')}
              </p>
            </div>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#00873E] ring-1 ring-emerald-200/60 transition group-hover:scale-105">
              <Users className="size-4.5" />
            </div>
          </div>

          <div className="mt-2.5 flex flex-col gap-1 border-t border-slate-100 pt-2 text-[11px]">
            <div className="flex items-center justify-between text-slate-600">
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 rounded-full px-1.5 py-0.2 text-[10.5px]">
                <TrendingUp className="size-2.5" />
                +{totals.newToday} người hôm nay
              </span>
              <span className="text-slate-500 font-semibold text-[10.5px]">
                +{totals.new7d} trong tuần qua
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 truncate">
              +{totals.new30d} người đăng ký trong 30 ngày qua
            </p>
          </div>
        </div>

        {/* Khối 2: Người chơi trong tuần qua */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs transition duration-150 hover:-translate-y-0.5 hover:shadow-xs">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                Người chơi trong tuần qua
              </p>
              <p className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-slate-900 truncate">
                {totals.active7d.toLocaleString('vi-VN')}
              </p>
            </div>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-200/60 transition group-hover:scale-105">
              <Activity className="size-4.5" />
            </div>
          </div>

          <div className="mt-2.5 flex flex-col gap-1 border-t border-slate-100 pt-2 text-[11px]">
            <div className="flex items-center justify-between text-slate-600">
              <span className="inline-flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 rounded-full px-1.5 py-0.2 text-[10.5px]">
                {activeRate}% trên tổng số người chơi
              </span>
              <span className="text-slate-500 font-semibold text-[10.5px]">
                {totals.active30d} người trong tháng
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 truncate">
              Số người có vào game trong 7 ngày gần đây
            </p>
          </div>
        </div>

        {/* Khối 3: Người chơi gắn bó */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs transition duration-150 hover:-translate-y-0.5 hover:shadow-xs">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                Người chơi gắn bó
              </p>
              <p className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-slate-900 truncate">
                {totals.returning.toLocaleString('vi-VN')}
              </p>
            </div>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 ring-1 ring-violet-200/60 transition group-hover:scale-105">
              <UserCheck className="size-4.5" />
            </div>
          </div>

          <div className="mt-2.5 flex flex-col gap-1 border-t border-slate-100 pt-2 text-[11px]">
            <div className="flex items-center justify-between text-slate-600">
              <span className="inline-flex items-center gap-1 font-semibold text-violet-700 bg-violet-50 rounded-full px-1.5 py-0.2 text-[10.5px]">
                {retentionRate}% quay lại chơi tiếp
              </span>
              <span className="text-slate-400 text-[10.5px]">Quen thuộc</span>
            </div>
            <p className="text-[10.5px] text-slate-400 truncate">
              Số người đã vào game từ 2 lần trở lên
            </p>
          </div>
        </div>

        {/* Khối 4: Tổng lượt vào game */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs transition duration-150 hover:-translate-y-0.5 hover:shadow-xs">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                Tổng lượt vào game
              </p>
              <p className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-slate-900 truncate">
                {totals.totalSsoLogins.toLocaleString('vi-VN')}
              </p>
            </div>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 ring-1 ring-amber-200/60 transition group-hover:scale-105">
              <ShieldCheck className="size-4.5" />
            </div>
          </div>

          <div className="mt-2.5 flex flex-col gap-1 border-t border-slate-100 pt-2 text-[11px]">
            <div className="flex items-center justify-between text-slate-600">
              <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 rounded-full px-1.5 py-0.2 text-[10.5px]">
                Đăng nhập an toàn
              </span>
              <span className="text-slate-500 font-semibold text-[10.5px]">
                Trung bình{' '}
                {totals.totalPlayers > 0
                  ? (totals.totalSsoLogins / totals.totalPlayers).toFixed(1)
                  : '0'}{' '}
                lượt / người
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 truncate">
              Tổng số lần người chơi mở và đăng nhập vào game
            </p>
          </div>
        </div>
      </div>

      {/* 3. Bảng Tình Hình Người Chơi - Đơn Giản Dễ Nhìn */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs">
        <div className="flex flex-col justify-between gap-1.5 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-xs sm:text-sm font-black tracking-tight text-slate-900">
              Tình hình người chơi mới & người chơi vào game
            </h3>
            <p className="text-[11px] text-slate-500">
              Theo dõi lượng người mới và lượng người vào game theo từng mốc thời gian
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            Tổng cộng: {totals.totalPlayers.toLocaleString('vi-VN')} người chơi
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5">
            <p className="text-[10.5px] font-semibold text-slate-500">Mới hôm nay</p>
            <p className="mt-0.5 text-base sm:text-lg font-black text-emerald-600">
              +{totals.newToday}
            </p>
            <p className="text-[10px] text-slate-400">Đăng ký hôm nay</p>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5">
            <p className="text-[10.5px] font-semibold text-slate-500">Mới tuần này</p>
            <p className="mt-0.5 text-base sm:text-lg font-black text-blue-600">
              +{totals.new7d}
            </p>
            <p className="text-[10px] text-slate-400">Đăng ký 7 ngày qua</p>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5">
            <p className="text-[10.5px] font-semibold text-slate-500">Vào chơi tuần này</p>
            <p className="mt-0.5 text-base sm:text-lg font-black text-violet-600">
              {totals.active7d}
            </p>
            <p className="text-[10px] text-slate-400">{activeRate}% tổng người chơi</p>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5">
            <p className="text-[10.5px] font-semibold text-slate-500">Vào chơi tháng này</p>
            <p className="mt-0.5 text-base sm:text-lg font-black text-amber-600">
              {totals.active30d}
            </p>
            <p className="text-[10px] text-slate-400">Trong 30 ngày qua</p>
          </div>
        </div>
      </div>

      {/* 4. Lối Tắt Thao Tác Nhanh */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-[#00873E]" />
            <h3 className="text-xs font-bold text-slate-900">Lối tắt thao tác nhanh</h3>
          </div>
          <span className="text-[11px] text-slate-400">Các tính năng hay dùng cho game {game.name}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <Link
            href="/admin/presentation"
            className="group flex flex-col items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white p-2.5 text-center shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-[#00873E]/40 hover:shadow-xs"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 transition group-hover:scale-105 group-hover:bg-violet-600 group-hover:text-white">
              <Palette className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-900 group-hover:text-[#00873E]">
                Đổi giao diện
              </p>
              <p className="text-[9.5px] text-slate-400">Hình ảnh & Banner</p>
            </div>
          </Link>

          <Link
            href="/admin/articles/new"
            className="group flex flex-col items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white p-2.5 text-center shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-[#00873E]/40 hover:shadow-xs"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#00873E] transition group-hover:scale-105 group-hover:bg-[#00873E] group-hover:text-white">
              <FileText className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-900 group-hover:text-[#00873E]">
                Viết bài mới
              </p>
              <p className="text-[9.5px] text-slate-400">Đăng tin tức & thông báo</p>
            </div>
          </Link>

          <Link
            href="/admin/events"
            className="group flex flex-col items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white p-2.5 text-center shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-[#00873E]/40 hover:shadow-xs"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 transition group-hover:scale-105 group-hover:bg-amber-600 group-hover:text-white">
              <CalendarDays className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-900 group-hover:text-[#00873E]">
                Sự kiện game
              </p>
              <p className="text-[9.5px] text-slate-400">Tạo sự kiện & quà tặng</p>
            </div>
          </Link>

          <Link
            href="/admin/players"
            className="group flex flex-col items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white p-2.5 text-center shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-[#00873E]/40 hover:shadow-xs"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
              <Users className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-900 group-hover:text-[#00873E]">
                Danh sách người chơi
              </p>
              <p className="text-[9.5px] text-slate-400">Xem thông tin tài khoản</p>
            </div>
          </Link>

          <Link
            href="/admin/audit"
            className="group flex flex-col items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white p-2.5 text-center shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-[#00873E]/40 hover:shadow-xs"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition group-hover:scale-105 group-hover:bg-slate-800 group-hover:text-white">
              <History className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-900 group-hover:text-[#00873E]">
                Lịch sử thao tác
              </p>
              <p className="text-[9.5px] text-slate-400">Xem ai đã làm gì</p>
            </div>
          </Link>

          <a
            href={`http://${game.subdomain}.lvh.me:3001`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white p-2.5 text-center shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-[#00873E]/40 hover:shadow-xs"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 transition group-hover:scale-105 group-hover:bg-teal-600 group-hover:text-white">
              <Globe className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-900 group-hover:text-[#00873E]">
                Trang web game
              </p>
              <p className="text-[9.5px] text-slate-400">Xem giao diện người chơi</p>
            </div>
          </a>
        </div>
      </div>

      {/* 5. Hai Cột Hoạt Động Cân Đối */}
      <div className="grid gap-3.5 sm:gap-4 xl:grid-cols-2">
        {/* Cột Trái: Người chơi mới vào game gần đây */}
        <section className="rounded-xl border border-slate-200/80 bg-white shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Người chơi vừa vào game gần đây
                  </h3>
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[9.5px] font-bold text-slate-600">
                    Mới nhất
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">
                  Danh sách tài khoản người chơi đăng nhập game gần đây nhất
                </p>
              </div>
              <Link
                href="/admin/players"
                className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-[#00873E] hover:underline ml-2"
              >
                <span>Xem tất cả ({totals.totalPlayers} người)</span>
                <ArrowRight className="size-3" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentPlayers.length ? (
                recentPlayers.map((player) => (
                  <ModernGamePlayerRow key={player.id} player={player} />
                ))
              ) : (
                <div className="p-8 text-center">
                  <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-slate-50 text-slate-300">
                    <Users className="size-5" />
                  </div>
                  <p className="mt-2.5 text-xs font-semibold text-slate-700">
                    Chưa có người chơi nào đăng nhập vào game
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400 max-w-xs mx-auto">
                    Khi người chơi dùng tài khoản đăng nhập vào game hoặc vào trang web game, danh sách sẽ tự động xuất hiện ở đây.
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="mt-3 h-7 text-[11px] font-semibold"
                  >
                    <a
                      href={`http://${game.subdomain}.lvh.me:3001`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Mở trang web game để thử đăng nhập <ExternalLink className="ml-1 size-2.5" />
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 p-2.5 text-center bg-slate-50/40 rounded-b-xl">
            <Link
              href="/admin/players"
              className="inline-flex items-center justify-center gap-1 text-xs font-bold text-slate-600 hover:text-[#00873E] transition-colors"
            >
              Mở danh sách tất cả người chơi <ArrowRight className="size-3" />
            </Link>
          </div>
        </section>

        {/* Cột Phải: Tin tức & Sự kiện game */}
        <section className="rounded-xl border border-slate-200/80 bg-white shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Tin tức & Sự kiện của game
                  </h3>
                  <span className="rounded-full bg-emerald-50 px-1.5 py-0.2 text-[9.5px] font-bold text-[#00873E]">
                    Bài viết
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">
                  Các bài viết giới thiệu, hướng dẫn chơi và sự kiện của game
                </p>
              </div>
              <Link
                href="/admin/articles"
                className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-[#00873E] hover:underline ml-2"
              >
                <span>Xem tất cả ({articles.length} bài)</span>
                <ArrowRight className="size-3" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {articles.length ? (
                articles.map((article) => (
                  <div
                    key={article.id}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 transition duration-150 hover:bg-slate-50/80 sm:px-5"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 font-mono text-xs font-bold ring-1 ring-violet-200/60">
                        <FileText className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/articles/${article.id}`}
                          className="truncate text-xs font-bold text-slate-900 hover:text-[#00873E] hover:underline"
                        >
                          {article.title}
                        </Link>
                        <p className="truncate text-[10.5px] text-slate-400">
                          <span className="font-medium text-slate-600">
                            {article.category || 'Tin tức'}
                          </span>
                          <span className="mx-1 text-slate-300">·</span>
                          <span>{formatDate(article.createdAt)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <span
                        className={`rounded-full border px-1.5 py-0.2 text-[9.5px] font-semibold ${
                          article.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {article.status === 'PUBLISHED' ? 'Đã đăng' : 'Bản nháp'}
                      </span>
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="size-7 rounded-lg text-slate-400 hover:text-[#00873E] hover:bg-[#E8F7EC]"
                      >
                        <Link href={`/admin/articles/${article.id}`}>
                          <ArrowUpRight className="size-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-slate-50 text-slate-300">
                    <FileText className="size-5" />
                  </div>
                  <p className="mt-2.5 text-xs font-semibold text-slate-700">
                    Chưa có bài viết nào cho {game.name}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400 max-w-xs mx-auto">
                    Bạn có thể viết tin tức cập nhật, thông báo bảo trì hoặc bài hướng dẫn tân thủ.
                  </p>
                  <Button
                    asChild
                    size="sm"
                    className="mt-3 h-7 bg-[#00873E] text-[11px] font-semibold hover:bg-[#007033]"
                  >
                    <Link href="/admin/articles/new">
                      <FileText className="mr-1 size-3" /> Viết bài đầu tiên ngay
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 p-2.5 text-center bg-slate-50/40 rounded-b-xl">
            <Link
              href="/admin/articles"
              className="inline-flex items-center justify-center gap-1 text-xs font-bold text-slate-600 hover:text-[#00873E] transition-colors"
            >
              Mở trang quản lý bài viết <ArrowRight className="size-3" />
            </Link>
          </div>
        </section>
      </div>

      {/* 6. Chân Trang - Tình Trạng Hoạt Động Của Game */}
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-[11px] text-slate-600">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-[#00873E]" />
            <span className="font-bold text-slate-800">
              Trạng thái hoạt động của game:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-5 font-medium text-slate-500">
            <div className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>
                Đăng nhập tài khoản: <strong className="text-slate-700">Hoạt động tốt</strong>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>
                Địa chỉ web: <strong className="text-slate-700 font-mono">{game.subdomain}.lvh.me</strong>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>
                Quyền của bạn:{' '}
                <strong className="text-slate-700">
                  {context.data.isSuperAdmin ? 'Toàn quyền quản trị' : 'Quản lý game'}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>
                Lưu nhật ký: <strong className="text-slate-700">Đang bật</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModernGamePlayerRow({ player }: { player: GamePlayer }) {
  const displayName = player.user.profile?.fullName || player.user.username;

  return (
    <div className="group flex items-center justify-between gap-3 px-4 py-2.5 transition duration-150 hover:bg-slate-50/80 sm:px-5">
      <div className="flex min-w-0 items-center gap-2.5">
        <UserAvatar
          id={player.user.id}
          name={displayName}
          username={player.user.username}
          avatarUrl={player.user.profile?.avatarUrl}
          status={player.status === 'BLOCKED' ? 'LOCKED' : 'ACTIVE'}
          showStatusDot
          size="sm"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Link
              href={`/admin/players/${player.userId}`}
              className="truncate text-xs font-bold text-slate-900 group-hover:text-[#00873E] hover:underline"
            >
              {displayName}
            </Link>
            <span
              className={`rounded px-1 py-0.2 text-[9px] font-bold ${
                player.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {player.status === 'ACTIVE' ? 'Bình thường' : 'Bị chặn'}
            </span>
          </div>
          <p className="truncate text-[10.5px] text-slate-500">
            <span className="font-medium text-slate-700">@{player.user.username}</span>
            <span className="mx-1 text-slate-300">·</span>
            <span>Đã vào game {player.loginCount} lần</span>
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="text-[10.5px] font-medium text-slate-400">
          {formatDate(player.lastLoginAt)}
        </span>
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="size-7 rounded-lg text-slate-400 opacity-0 group-hover:opacity-100 hover:text-[#00873E] hover:bg-[#E8F7EC] transition-all"
        >
          <Link
            href={`/admin/players/${player.userId}`}
            aria-label={`Xem chi tiết người chơi ${player.user.username}`}
          >
            <ArrowUpRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function GameDashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-4.5 pb-8 w-full relative">
      {/* Top Progress Line */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-emerald-100 overflow-hidden">
        <div className="h-full w-2/5 bg-gradient-to-r from-emerald-500 via-teal-400 to-[#00873E] animate-[pulse_1s_ease-in-out_infinite] rounded-full" />
      </div>

      {/* Header Skeleton */}
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-12 rounded" />
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-4 w-20 rounded-full" />
            </div>
            <Skeleton className="h-3 w-48 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-7.5 w-24 rounded-lg" />
          <Skeleton className="h-7.5 w-36 rounded-lg" />
          <Skeleton className="h-7.5 w-28 rounded-lg" />
        </div>
      </div>

      {/* 4 KPI Cards Skeleton */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((v) => (
          <div key={v} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="size-7 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-20 rounded" />
            <Skeleton className="h-2.5 w-32 rounded" />
          </div>
        ))}
      </div>

      {/* Growth Strip Skeleton */}
      <Skeleton className="h-16 rounded-xl" />

      {/* Launchpad Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5">
        {[1, 2, 3, 4, 5, 6].map((v) => (
          <Skeleton key={v} className="h-20 rounded-xl" />
        ))}
      </div>

      {/* Activity Columns Skeleton */}
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
          <Skeleton className="h-5 w-36 rounded" />
          <div className="space-y-2.5 pt-2">
            {[1, 2, 3, 4].map((v) => (
              <Skeleton key={v} className="h-12 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
          <Skeleton className="h-5 w-36 rounded" />
          <div className="space-y-2.5 pt-2">
            {[1, 2, 3, 4].map((v) => (
              <Skeleton key={v} className="h-12 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
