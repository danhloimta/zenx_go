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
  Globe,
  History,
  LayoutDashboard,
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
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/user-avatar';
import { InfoTooltip } from '@/components/ui/tooltip';
import { formatDate } from '@/lib/utils';
import { formatCategoryLabel } from '@/lib/games-data';
import { toast } from 'sonner';
import type { GameRecentPlayer } from '@zenx-go/api-client';

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
    DEGRADED: {
      label: 'Không ổn định',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    DECOMMISSIONED: {
      label: 'Đã ngừng cung cấp',
      className: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    UNAVAILABLE: {
      label: 'Tạm dừng',
      className: 'bg-slate-100 text-slate-600 border-slate-200',
    },
  };

  const opStatus = operationalBadgeConfig[game.operationalStatus] || {
    label: 'Chưa rõ',
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

      {/* 1. Phần Đầu Trang - Tối giản, gọn gàng */}
      <PageHeader
        icon={LayoutDashboard}
        title={game.name}
        badge={
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-emerald-100/80 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
              {game.code}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${opStatus.className}`}
            >
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {opStatus.label}
            </span>
            {game.isPublic ? (
              <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                Công khai
              </span>
            ) : (
              <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                Nội bộ
              </span>
            )}
          </div>
        }
        description={
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <a
              href={`http://${game.subdomain}.lvh.me:3001`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-slate-700 hover:text-[#00873E] hover:underline"
            >
              <span>{game.subdomain}.lvh.me</span>
              <ExternalLink className="size-3 text-slate-400" />
            </a>
          </div>
        }
        actions={
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Làm mới dữ liệu"
              className="size-8 rounded-lg border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw
                className={`size-3.5 ${
                  isRefreshing || dashboard.isFetching ? 'animate-spin text-[#00873E]' : ''
                }`}
              />
            </Button>

            <Button
              asChild
              size="sm"
              className="h-8 px-3 gap-1.5 rounded-lg bg-[#00873E] text-xs font-semibold text-white shadow-2xs hover:bg-[#007033]"
            >
              <Link href="/admin/presentation">
                <Palette className="size-3.5" />
                <span>Đổi giao diện</span>
              </Link>
            </Button>
          </div>
        }
        className="border-b border-slate-100 pb-3"
      />

      {/* 2. Bốn Khối Số Liệu Chính - Tinh gọn, dùng Tooltip khi cần */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {/* Khối 1: Tổng người chơi */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs transition duration-150 hover:-translate-y-0.5 hover:shadow-xs">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-slate-500">Tổng người chơi</p>
                <InfoTooltip content="Tổng số tài khoản đã từng đăng nhập vào game này." />
              </div>
              <p className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-slate-900 truncate">
                {totals.totalPlayers.toLocaleString('vi-VN')}
              </p>
            </div>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#00873E] ring-1 ring-emerald-200/60">
              <Users className="size-4.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
            <span className="font-semibold text-emerald-700">+{totals.newToday} hôm nay</span>
            <span className="text-slate-400">+{totals.new7d} tuần này</span>
          </div>
        </div>

        {/* Khối 2: Người chơi trong tuần qua */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs transition duration-150 hover:-translate-y-0.5 hover:shadow-xs">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-slate-500">Hoạt động tuần qua</p>
                <InfoTooltip content="Số người chơi có đăng nhập vào game trong 7 ngày gần nhất." />
              </div>
              <p className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-slate-900 truncate">
                {totals.active7d.toLocaleString('vi-VN')}
              </p>
            </div>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-200/60">
              <Activity className="size-4.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
            <span className="font-semibold text-blue-700">{activeRate}% tổng số</span>
            <span className="text-slate-400">{totals.active30d} trong tháng</span>
          </div>
        </div>

        {/* Khối 3: Người chơi quay lại */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs transition duration-150 hover:-translate-y-0.5 hover:shadow-xs">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-slate-500">Người chơi gắn bó</p>
                <InfoTooltip content="Tài khoản đã đăng nhập vào game từ 2 lần trở lên." />
              </div>
              <p className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-slate-900 truncate">
                {totals.returning.toLocaleString('vi-VN')}
              </p>
            </div>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 ring-1 ring-violet-200/60">
              <UserCheck className="size-4.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
            <span className="font-semibold text-violet-700">{retentionRate}% quay lại</span>
            <span className="text-slate-400">≥ 2 lần chơi</span>
          </div>
        </div>

        {/* Khối 4: Tổng lượt vào game */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs transition duration-150 hover:-translate-y-0.5 hover:shadow-xs">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-slate-500">Lượt vào game</p>
                <InfoTooltip content="Tổng số phiên đăng nhập thành công vào game qua tài khoản ZENX GO." />
              </div>
              <p className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-slate-900 truncate">
                {totals.totalSsoLogins.toLocaleString('vi-VN')}
              </p>
            </div>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 ring-1 ring-amber-200/60">
              <TrendingUp className="size-4.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
            <span className="font-semibold text-amber-700">
              {totals.totalPlayers > 0
                ? (totals.totalSsoLogins / totals.totalPlayers).toFixed(1)
                : '0'}{' '}
              lượt / người
            </span>
            <span className="text-slate-400">Trung bình</span>
          </div>
        </div>
      </div>

      {/* 3. Lối Tắt Thao Tác Nhanh - Tối giản, bỏ chữ chú thích thừa */}
      <div>
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <Sparkles className="size-3.5 text-[#00873E]" />
          <h3 className="text-xs font-bold text-slate-900">Thao tác nhanh</h3>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <Link
            href="/admin/presentation"
            className="group flex flex-col items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white p-3 text-center shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-[#00873E]/40 hover:shadow-xs"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 transition group-hover:scale-105 group-hover:bg-violet-600 group-hover:text-white">
              <Palette className="size-4" />
            </div>
            <p className="text-xs font-bold text-slate-800 group-hover:text-[#00873E]">
              Giao diện
            </p>
          </Link>

          <Link
            href="/admin/articles/new"
            className="group flex flex-col items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white p-3 text-center shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-[#00873E]/40 hover:shadow-xs"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#00873E] transition group-hover:scale-105 group-hover:bg-[#00873E] group-hover:text-white">
              <FileText className="size-4" />
            </div>
            <p className="text-xs font-bold text-slate-800 group-hover:text-[#00873E]">
              Viết bài
            </p>
          </Link>

          <Link
            href="/admin/events"
            className="group flex flex-col items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white p-3 text-center shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-[#00873E]/40 hover:shadow-xs"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 transition group-hover:scale-105 group-hover:bg-amber-600 group-hover:text-white">
              <CalendarDays className="size-4" />
            </div>
            <p className="text-xs font-bold text-slate-800 group-hover:text-[#00873E]">
              Sự kiện
            </p>
          </Link>

          <Link
            href="/admin/players"
            className="group flex flex-col items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white p-3 text-center shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-[#00873E]/40 hover:shadow-xs"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
              <Users className="size-4" />
            </div>
            <p className="text-xs font-bold text-slate-800 group-hover:text-[#00873E]">
              Người chơi
            </p>
          </Link>

          <Link
            href="/admin/audit"
            className="group flex flex-col items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white p-3 text-center shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-[#00873E]/40 hover:shadow-xs"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition group-hover:scale-105 group-hover:bg-slate-800 group-hover:text-white">
              <History className="size-4" />
            </div>
            <p className="text-xs font-bold text-slate-800 group-hover:text-[#00873E]">
              Nhật ký
            </p>
          </Link>

          <a
            href={`http://${game.subdomain}.lvh.me:3001`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white p-3 text-center shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-[#00873E]/40 hover:shadow-xs"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 transition group-hover:scale-105 group-hover:bg-teal-600 group-hover:text-white">
              <Globe className="size-4" />
            </div>
            <p className="text-xs font-bold text-slate-800 group-hover:text-[#00873E]">
              Web game
            </p>
          </a>
        </div>
      </div>

      {/* 4. Hai Cột Hoạt Động - Gọn gàng, không lặp lại nút */}
      <div className="grid gap-3.5 sm:gap-4 xl:grid-cols-2">
        {/* Cột Trái: Người chơi gần đây */}
        <section className="rounded-xl border border-slate-200/80 bg-white shadow-2xs flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
              Người chơi gần đây
            </h3>
            <Link
              href="/admin/players"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#00873E] hover:underline"
            >
              <span>Xem tất cả ({totals.totalPlayers})</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {recentPlayers.length ? (
              recentPlayers.map((player) => (
                <ModernGamePlayerRow key={player.id} player={player} />
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Chưa có lượt đăng nhập nào
              </div>
            )}
          </div>
        </section>

        {/* Cột Phải: Bài viết */}
        <section className="rounded-xl border border-slate-200/80 bg-white shadow-2xs flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
              Bài viết & Tin tức
            </h3>
            <Link
              href="/admin/articles"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#00873E] hover:underline"
            >
              <span>Xem tất cả ({articles.length})</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {articles.length ? (
              articles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 transition duration-150 hover:bg-slate-50/80 sm:px-5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 ring-1 ring-violet-200/60">
                      <FileText className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/articles/${article.id}`}
                        className="truncate text-xs font-bold text-slate-900 hover:text-[#00873E] hover:underline"
                      >
                        {article.title}
                      </Link>
                      <p className="text-[10.5px] text-slate-400">
                        <span>{formatCategoryLabel(article.category)}</span>
                        <span className="mx-1">·</span>
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
                <p className="text-xs text-slate-400">Chưa có bài viết nào</p>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="mt-2.5 h-7 text-xs"
                >
                  <Link href="/admin/articles/new">Viết bài mới</Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 5. Chân Trang - Dòng trạng thái mảnh, tinh gọn */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200/60 bg-slate-50/70 px-3.5 py-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Hệ thống đăng nhập game hoạt động bình thường</span>
        </div>
        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
          <span>Quyền: <strong className="font-semibold text-slate-700">{context.data.isSuperAdmin ? 'Toàn quyền' : 'Quản trị viên'}</strong></span>
        </div>
      </div>
    </div>
  );
}

function ModernGamePlayerRow({ player }: { player: GameRecentPlayer }) {
  const displayName = player.user.profile?.fullName || player.user.username;

  return (
    <div className="group flex items-center justify-between gap-3 px-4 py-2.5 transition duration-150 hover:bg-slate-50/80 sm:px-5">
      <div className="flex min-w-0 items-center gap-2.5">
        <UserAvatar
          id={player.user.id}
          name={displayName}
          username={player.user.username}
          avatarUrl={player.user.profile?.avatarUrl}
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
