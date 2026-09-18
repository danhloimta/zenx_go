'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { GamePlayer, GamePlayerActivityEntry } from '@zenx-go/api-client';
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  Calendar,
  Check,
  Clock,
  Copy,
  Edit3,
  FileText,
  History,
  Info,
  Layers,
  Loader2,
  Lock,
  LogIn,
  MessageSquare,
  MessageSquareOff,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Unlock,
  UserRound,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/user-avatar';
import { GamePlayerProfileEditor } from '@/components/game-player-profile-editor';
import { toast } from 'sonner';

const ACTIVITY_LABEL: Record<string, string> = {
  GAME_PLAYER_BLOCKED: 'Đã khóa player',
  GAME_PLAYER_UNBLOCKED: 'Đã mở khóa player',
  GAME_PLAYER_TEMPORARILY_BLOCKED: 'Đã khóa player tạm thời',
  GAME_PLAYER_PERMANENTLY_BANNED: 'Đã khóa player',
  GAME_PLAYER_TEMPORARY_LOCK_RELEASED: 'Đã gỡ khóa tạm thời',
  GAME_PLAYER_PERMANENT_BAN_RELEASED: 'Đã gỡ cấm vĩnh viễn',
  GAME_PLAYER_CHAT_BLOCKED: 'Đã khóa chat player',
  GAME_PLAYER_CHAT_UNBLOCKED: 'Đã mở chat player',
  GAME_PLAYER_SUPPORT_NOTE_UPDATED: 'Đã cập nhật ghi chú nội bộ',
};

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString('vi-VN') : 'Chưa có';
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '—';
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
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} tháng trước`;
  return `${Math.floor(diffMonths / 12)} năm trước`;
}

function toDateTimeLocal(value: Date) {
  const offset = value.getTimezoneOffset();
  return new Date(value.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function statusLabel(status: GamePlayer['status']) {
  if (status === 'PERMANENTLY_BANNED' || status === 'BLOCKED') return 'Đã khóa';
  if (status === 'TEMPORARILY_BLOCKED') return 'Khóa tạm thời';
  return 'Hoạt động';
}

export default function GamePlayerDetailPage() {
  const { subdomain, userId } = useParams<{ subdomain: string; userId: string }>();
  const queryClient = useQueryClient();

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'activity'>('overview');
  const [copiedId, setCopiedId] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Support note state
  const [note, setNote] = useState('');
  const [noteVersion, setNoteVersion] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [noteConflict, setNoteConflict] = useState<{ note: string; updatedAt: string } | null>(null);

  // Moderation modals state
  const [pendingRestriction, setPendingRestriction] = useState<'TEMPORARY' | 'PERMANENT' | 'RELEASE' | null>(null);
  const [pendingChat, setPendingChat] = useState<boolean | null>(null);
  const [temporaryExpiresAt, setTemporaryExpiresAt] = useState('');
  const [reason, setReason] = useState('');
  const [activityPage, setActivityPage] = useState(1);

  const context = useQuery({
    queryKey: ['game-admin', 'context', subdomain],
    queryFn: () => api.gameAdmin.context(subdomain),
    retry: false,
  });
  const gameId = context.data?.game.id;

  const player = useQuery({
    queryKey: ['game-admin', 'player', gameId, userId],
    queryFn: () => api.gameAdmin.player(gameId!, userId),
    enabled: Boolean(gameId),
    retry: false,
  });

  const activity = useQuery({
    queryKey: ['game-admin', 'player-activity', gameId, userId, activityPage],
    queryFn: () => api.gameAdmin.playerActivity(gameId!, userId, { page: activityPage, pageSize: 20 }),
    enabled: Boolean(gameId),
    retry: false,
  });

  const can = (action: string, subject: string) =>
    context.data?.isSuperAdmin ||
    context.data?.abilityRules.some((rule) => rule.action === action && rule.subject === subject);

  const canTemporaryLock = can('lock', 'GamePlayer');
  const canPermanentBan = can('ban', 'GamePlayer');
  const canChatModerate = can('moderate', 'GamePlayerChat');
  const canEditNote = can('support-note', 'GamePlayer');
  const canManageProfile = can('manage', 'GamePlayerProfile');

  useEffect(() => {
    if (player.data && noteVersion === null) {
      setNote(player.data.supportNote ?? '');
      setNoteVersion(player.data.updatedAt);
    }
  }, [noteVersion, player.data]);

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(true);
      toast.success('Đã sao chép User ID vào clipboard');
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      toast.error('Không thể sao chép');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        player.refetch(),
        activity.refetch(),
      ]);
      toast.success('Đã làm mới thông tin người chơi');
    } catch {
      toast.error('Lỗi khi làm mới dữ liệu');
    } finally {
      setIsRefreshing(false);
    }
  };

  const saveNote = useMutation({
    mutationFn: () =>
      api.gameAdmin.updatePlayerSupportNote(gameId!, userId, {
        note: note.trim() || null,
        expectedUpdatedAt: noteVersion ?? player.data!.updatedAt,
      }),
    onSuccess: (updated) => {
      setNote(updated.supportNote ?? '');
      setNoteVersion(updated.updatedAt);
      setNoteError(null);
      setNoteConflict(null);
      toast.success('Đã cập nhật ghi chú nội bộ');
      queryClient.setQueryData(['game-admin', 'player', gameId, userId], updated);
      void queryClient.invalidateQueries({ queryKey: ['game-admin', 'player-activity', gameId, userId] });
      void queryClient.invalidateQueries({ queryKey: ['game-admin', 'players', gameId] });
    },
    onError: async () => {
      const msg = 'Không thể lưu ghi chú. Player có thể vừa được thay đổi; bản nháp hiện tại vẫn được giữ lại.';
      setNoteError(msg);
      toast.error(msg);
      const result = await player.refetch();
      if (result.data) setNoteConflict({ note: result.data.supportNote ?? '', updatedAt: result.data.updatedAt });
    },
  });

  const updateRestriction = useMutation({
    mutationFn: () => {
      const input = { expectedUpdatedAt: player.data!.updatedAt, reason: reason.trim() };
      if (pendingRestriction === 'TEMPORARY')
        return api.gameAdmin.temporaryLockPlayer(gameId!, userId, {
          ...input,
          expiresAt: new Date(temporaryExpiresAt).toISOString(),
        });
      if (pendingRestriction === 'PERMANENT')
        return api.gameAdmin.permanentBanPlayer(gameId!, userId, input);
      return api.gameAdmin.releasePlayerRestriction(gameId!, userId, input);
    },
    onSuccess: (updated) => {
      const isRelease = pendingRestriction === 'RELEASE';
      toast.success(
        isRelease
          ? 'Đã gỡ hạn chế người chơi thành công'
          : pendingRestriction === 'TEMPORARY'
            ? 'Đã khóa tạm thời tài khoản người chơi'
            : 'Đã khóa tài khoản người chơi thành công',
      );
      setPendingRestriction(null);
      setTemporaryExpiresAt('');
      setReason('');
      setNoteVersion(updated.updatedAt);
      queryClient.setQueryData(['game-admin', 'player', gameId, userId], updated);
      void queryClient.invalidateQueries({ queryKey: ['game-admin', 'player-activity', gameId, userId] });
      void queryClient.invalidateQueries({ queryKey: ['game-admin', 'players', gameId] });
    },
    onError: () => {
      toast.error('Không thể cập nhật trạng thái người chơi. Vui lòng kiểm tra lại quyền hạn hoặc thử lại.');
    },
  });

  const updateChat = useMutation({
    mutationFn: (locked: boolean) =>
      api.gameAdmin.updatePlayerChatRestriction(gameId!, userId, {
        locked,
        expectedUpdatedAt: player.data!.updatedAt,
        reason: reason.trim(),
      }),
    onSuccess: (updated) => {
      toast.success(
        updated.chatBlocked
          ? 'Đã khóa chat của người chơi trong game này'
          : 'Đã mở chat của người chơi trong game này',
      );
      setPendingChat(null);
      setReason('');
      setNoteVersion(updated.updatedAt);
      queryClient.setQueryData(['game-admin', 'player', gameId, userId], updated);
      void queryClient.invalidateQueries({ queryKey: ['game-admin', 'player-activity', gameId, userId] });
    },
    onError: () => {
      toast.error('Không thể cập nhật cấu hình chat của người chơi.');
    },
  });

  const useServerNote = () => {
    if (!noteConflict) return;
    setNote(noteConflict.note);
    setNoteVersion(noteConflict.updatedAt);
    setNoteConflict(null);
    setNoteError(null);
  };

  const keepDraftAndUseLatestVersion = () => {
    if (!noteConflict) return;
    setNoteVersion(noteConflict.updatedAt);
    setNoteConflict(null);
    setNoteError(null);
  };

  const refreshConflict = async () => {
    const result = await player.refetch();
    if (result.data) {
      setNoteConflict({ note: result.data.supportNote ?? '', updatedAt: result.data.updatedAt });
    }
  };

  // Loading state
  if (context.isLoading || player.isLoading) {
    return (
      <div className="w-full space-y-6 pb-12">
        <Skeleton className="h-6 w-48 rounded-md" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  // Error state
  if (context.isError || player.isError || !context.data || !player.data) {
    return (
      <div className="mx-auto max-w-2xl space-y-5 py-12 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shadow-xs">
          <ShieldAlert className="size-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-black text-slate-900">Không tìm thấy người chơi</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Bạn không có quyền truy cập người chơi này hoặc tài khoản chưa từng đăng nhập (SSO) vào trò chơi{' '}
            <strong className="text-slate-700">{subdomain}</strong>.
          </p>
        </div>
        <div>
          <Button asChild variant="outline" className="h-9 px-4 text-xs font-semibold gap-1.5">
            <Link href="/admin/players">
              <ArrowLeft className="size-3.5" />
              <span>Quay lại danh sách người chơi</span>
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const current = player.data;
  const displayName = current.user.profile?.fullName || current.user.username;
  const currentIsPermanentBan = current.status === 'PERMANENTLY_BANNED' || current.status === 'BLOCKED';
  const canReleaseRestriction = currentIsPermanentBan ? canPermanentBan : canTemporaryLock;
  const noteChanged = note !== (current.supportNote ?? '');
  const noteTooLong = note.length > 2_000;

  return (
    <div className="w-full space-y-6 pb-14">
      {/* 1. Header Navigation & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/players"
          className="group inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#00873E] transition-colors"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Danh sách người chơi</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 px-2.5 text-xs font-medium text-slate-600 border-slate-200 bg-white shadow-2xs gap-1.5"
            title="Làm mới dữ liệu người chơi"
          >
            <RotateCcw className={`size-3.5 ${isRefreshing ? 'animate-spin text-[#00873E]' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </Button>
        </div>
      </div>

      {/* 2. Hero Profile Card */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Avatar & Thông tin cơ bản */}
          <div className="flex items-start gap-4">
            <UserAvatar
              id={current.userId}
              name={current.user.profile?.fullName}
              username={current.user.username}
              avatarUrl={current.user.profile?.avatarUrl}
              status={current.status === 'ACTIVE' ? 'ACTIVE' : 'LOCKED'}
              showStatusDot
              size="xl"
            />

            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {displayName}
                </h1>
                {current.user.username && (
                  <span className="font-mono text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                    @{current.user.username}
                  </span>
                )}
              </div>

              {/* ID & Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                {/* User ID Copy Button */}
                <button
                  type="button"
                  onClick={() => handleCopyId(current.userId)}
                  className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500 bg-slate-50 hover:bg-slate-100 hover:text-slate-800 px-2 py-0.5 rounded-md border border-slate-200/80 transition-colors"
                  title="Click để sao chép User ID"
                >
                  <span>ID: {current.userId.slice(0, 8)}…{current.userId.slice(-4)}</span>
                  {copiedId ? (
                    <Check className="size-3 text-emerald-600" />
                  ) : (
                    <Copy className="size-3 text-slate-400" />
                  )}
                </button>

                {/* Account Status Badge */}
                {current.status === 'ACTIVE' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-[#00873E]">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Hoạt động</span>
                  </span>
                ) : current.status === 'TEMPORARILY_BLOCKED' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                    <Lock className="size-3 text-amber-600" />
                    <span>Khóa tạm thời</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                    <Ban className="size-3 text-rose-600" />
                    <span>Đã khóa</span>
                  </span>
                )}

                {/* Chat Status Badge */}
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                    current.chatBlocked
                      ? 'border-purple-200 bg-purple-50 text-purple-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  {current.chatBlocked ? (
                    <>
                      <MessageSquareOff className="size-3" />
                      <span>Đã khóa chat</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="size-3 text-slate-400" />
                      <span>Chat mở</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 self-start md:self-center border-t md:border-t-0 border-slate-100 w-full md:w-auto">
            {canTemporaryLock && current.status === 'ACTIVE' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setPendingRestriction('TEMPORARY');
                  setTemporaryExpiresAt(toDateTimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000)));
                  setReason('');
                }}
                className="h-9 px-3 text-xs font-semibold gap-1.5 border-amber-200 text-amber-800 bg-amber-50/50 hover:bg-amber-100/70"
              >
                <Clock className="size-3.5 text-amber-600" />
                <span>Khóa tạm</span>
              </Button>
            )}

            {canPermanentBan && current.status !== 'PERMANENTLY_BANNED' && current.status !== 'BLOCKED' && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setPendingRestriction('PERMANENT');
                  setReason('');
                }}
                className="h-9 px-3.5 text-xs font-bold gap-1.5 shadow-xs bg-rose-600 hover:bg-rose-700 text-white"
              >
                <Ban className="size-3.5" />
                <span>Khóa player</span>
              </Button>
            )}

            {canReleaseRestriction && current.status !== 'ACTIVE' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setPendingRestriction('RELEASE');
                  setReason('');
                }}
                className="h-9 px-3.5 text-xs font-bold gap-1.5 border-emerald-300 text-[#00873E] bg-emerald-50/60 hover:bg-emerald-100/80 shadow-xs"
              >
                <Unlock className="size-3.5 text-[#00873E]" />
                <span>Gỡ hạn chế</span>
              </Button>
            )}

            {canChatModerate && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setReason('');
                  setPendingChat(!current.chatBlocked);
                }}
                disabled={updateChat.isPending}
                className={`h-9 px-3 text-xs font-semibold gap-1.5 ${
                  current.chatBlocked
                    ? 'border-purple-200 text-purple-700 bg-purple-50/60 hover:bg-purple-100'
                    : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                }`}
              >
                {current.chatBlocked ? (
                  <>
                    <MessageSquare className="size-3.5 text-purple-600" />
                    <span>Mở chat</span>
                  </>
                ) : (
                  <>
                    <MessageSquareOff className="size-3.5 text-slate-500" />
                    <span>Khóa chat</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* 3. Four Metric Stats Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Tình trạng tài khoản</span>
            <div
              className={`flex size-7 items-center justify-center rounded-lg ${
                current.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-[#00873E]'
                  : 'bg-rose-50 text-rose-600'
              }`}
            >
              {current.status === 'ACTIVE' ? (
                <ShieldCheck className="size-4" />
              ) : (
                <ShieldAlert className="size-4" />
              )}
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-lg font-black text-slate-900 tracking-tight">
              {statusLabel(current.status)}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400 truncate">
              {current.blockReason || (current.status === 'ACTIVE' ? 'Không có hạn chế' : 'Chưa ghi chú')}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Đăng nhập gần nhất</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-lg font-black text-slate-900 tracking-tight">
              {formatRelativeTime(current.lastLoginAt)}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400 truncate">
              {formatDate(current.lastLoginAt)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Lần SSO đầu tiên</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Calendar className="size-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-base font-bold text-slate-900 tracking-tight truncate pt-0.5">
              {formatDate(current.firstLoginAt)}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Khởi tạo tham gia game
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Lượt vào game (SSO)</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-[#00873E]">
              <LogIn className="size-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-lg font-black text-slate-900 tracking-tight font-mono">
              {current.loginCount.toLocaleString('vi-VN')}{' '}
              <span className="text-xs font-normal text-slate-400">lượt</span>
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Đăng nhập qua cổng ZENX
            </p>
          </div>
        </div>
      </section>

      {/* 4. Navigation Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 transition-colors ${
            activeTab === 'overview'
              ? 'border-[#00873E] text-[#00873E]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="size-4" />
          <span>Vận hành & Hạn chế</span>
          {noteChanged && (
            <span className="size-2 rounded-full bg-amber-500 animate-pulse" title="Ghi chú có thay đổi chưa lưu" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 transition-colors ${
            activeTab === 'profile'
              ? 'border-[#00873E] text-[#00873E]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <UserRound className="size-4" />
          <span>Hồ sơ ZENX</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 transition-colors ${
            activeTab === 'activity'
              ? 'border-[#00873E] text-[#00873E]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <History className="size-4" />
          <span>Nhật ký hoạt động</span>
          {activity.data?.total ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
              {activity.data.total}
            </span>
          ) : null}
        </button>
      </div>

      {/* 5. Tab Contents */}
      {/* TAB 1: VẬN HÀNH & HẠN CHẾ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Card: Hạn chế đăng nhập */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div
                    className={`flex size-7 items-center justify-center rounded-lg ${
                      current.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-[#00873E]'
                        : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    {current.status === 'ACTIVE' ? <ShieldCheck className="size-4" /> : <Lock className="size-4" />}
                  </div>
                  <h2 className="text-base font-bold text-slate-900">Hạn chế quyền truy cập</h2>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Hạn chế đăng nhập chỉ áp dụng riêng cho người chơi trong tựa game này. Người chơi vẫn có thể đăng nhập vào cổng portal hoặc game khác nếu không bị khóa toàn cục.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {canTemporaryLock && current.status === 'ACTIVE' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPendingRestriction('TEMPORARY');
                      setTemporaryExpiresAt(toDateTimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000)));
                      setReason('');
                    }}
                    className="h-8 px-3 text-xs font-semibold gap-1.5 border-amber-200 text-amber-800 bg-amber-50/50 hover:bg-amber-100/70"
                  >
                    <Clock className="size-3 text-amber-600" />
                    <span>Khóa tạm</span>
                  </Button>
                )}

                {canPermanentBan && current.status !== 'PERMANENTLY_BANNED' && current.status !== 'BLOCKED' && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setPendingRestriction('PERMANENT');
                      setReason('');
                    }}
                    className="h-8 px-3 text-xs font-bold gap-1.5 shadow-xs bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    <Ban className="size-3" />
                    <span>Khóa player</span>
                  </Button>
                )}

                {canReleaseRestriction && current.status !== 'ACTIVE' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPendingRestriction('RELEASE');
                      setReason('');
                    }}
                    className="h-8 px-3 text-xs font-bold gap-1.5 border-emerald-300 text-[#00873E] bg-emerald-50/60 hover:bg-emerald-100/80 shadow-xs"
                  >
                    <Unlock className="size-3 text-[#00873E]" />
                    <span>Gỡ hạn chế</span>
                  </Button>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 pt-1">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Trạng thái hiện tại</span>
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span
                    className={`size-2 rounded-full ${
                      current.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  <span>{statusLabel(current.status)}</span>
                </p>
              </div>

              {current.status === 'TEMPORARILY_BLOCKED' ? (
                <div className="rounded-xl border border-amber-200/60 bg-amber-50/40 p-3.5 space-y-1">
                  <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Hết hạn khóa tạm</span>
                  <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Clock className="size-3.5 text-amber-600" />
                    <span>{formatDate(current.blockedUntil)}</span>
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Lý do ghi nhận</span>
                  <p className="text-xs font-medium text-slate-700 line-clamp-2 italic">
                    {current.blockReason ? `"${current.blockReason}"` : 'Chưa có lý do ghi nhận'}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Card: Kiểm duyệt Chat */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
                    <MessageSquare className="size-4" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900">Kiểm duyệt trò chuyện (Chat)</h2>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Cấu hình chặn tin nhắn chat trong trò chơi dành riêng cho tài khoản này.
                </p>
              </div>

              {canChatModerate && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReason('');
                    setPendingChat(!current.chatBlocked);
                  }}
                  disabled={updateChat.isPending}
                  className={`h-8 px-3 text-xs font-semibold gap-1.5 ${
                    current.chatBlocked
                      ? 'border-purple-200 text-purple-700 bg-purple-50/60 hover:bg-purple-100'
                      : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                  }`}
                >
                  {current.chatBlocked ? (
                    <>
                      <MessageSquare className="size-3.5 text-purple-600" />
                      <span>Mở chat</span>
                    </>
                  ) : (
                    <>
                      <MessageSquareOff className="size-3.5 text-slate-500" />
                      <span>Khóa chat</span>
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 flex items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Trạng thái kênh chat</span>
                <p className="text-xs font-semibold text-slate-800">
                  {current.chatBlocked ? (
                    <span className="text-purple-700 font-bold">
                      Đang bị khóa chat {current.chatBlockReason ? `(Lý do: ${current.chatBlockReason})` : ''}
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-bold">Kênh trò chuyện đang mở bình thường</span>
                  )}
                </p>
              </div>
            </div>
          </section>

          {/* Card: Ghi chú hỗ trợ nội bộ */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <FileText className="size-4" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900">Ghi chú hỗ trợ nội bộ</h2>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Chỉ đội ngũ Vận hành & Chăm sóc khách hàng nhìn thấy. Dùng để ghi chú lịch sử giao dịch, tài khoản nghi vấn hoặc lưu ý hỗ trợ.
                </p>
              </div>
            </div>

            {canEditNote ? (
              <div className="space-y-3 pt-1">
                <div className="relative">
                  <Textarea
                    className="min-h-32 text-xs leading-relaxed resize-none rounded-xl border-slate-200 focus:border-[#00873E] focus:ring-[#00873E]/10"
                    maxLength={2_000}
                    value={note}
                    onChange={(event) => {
                      setNote(event.target.value);
                      setNoteError(null);
                      setNoteConflict(null);
                    }}
                    placeholder="Thêm ghi chú hỗ trợ nội bộ…"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className={noteTooLong ? 'text-xs text-rose-600 font-bold' : 'text-xs text-slate-400'}>
                    {note.length} / 2.000 ký tự
                  </p>

                  <Button
                    type="button"
                    disabled={!noteChanged || noteTooLong || saveNote.isPending}
                    onClick={() => saveNote.mutate()}
                    className="h-8 px-3.5 text-xs font-bold gap-1.5 bg-[#00873E] hover:bg-[#007033] text-white shadow-xs"
                  >
                    {saveNote.isPending ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Edit3 className="size-3" />
                    )}
                    <span>Lưu ghi chú</span>
                  </Button>
                </div>

                {/* Conflict banner */}
                {noteError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-700 space-y-2.5 animate-in fade-in">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertCircle className="size-4 shrink-0 text-rose-600" />
                      <span>{noteError}</span>
                    </div>
                    {noteConflict ? (
                      <div className="space-y-2 rounded-lg bg-amber-50/80 border border-amber-200/80 p-3 text-amber-900">
                        <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
                          Nội dung mới nhất trên máy chủ ({formatDate(noteConflict.updatedAt)}):
                        </p>
                        <p className="font-mono text-xs whitespace-pre-wrap bg-white/80 p-2 rounded border border-amber-200/60">
                          {noteConflict.note || '(Chưa có nội dung ghi chú)'}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <Button size="sm" variant="outline" onClick={useServerNote} className="h-7 text-xs font-semibold">
                            Khôi phục bản máy chủ
                          </Button>
                          <Button size="sm" variant="outline" onClick={keepDraftAndUseLatestVersion} className="h-7 text-xs font-semibold">
                            Giữ bản nháp và ghi đè
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => void refreshConflict()} className="h-7 text-xs">
                        Kiểm tra bản mới
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-xs text-slate-500">
                Bạn không có quyền chỉnh sửa ghi chú hỗ trợ nội bộ của người chơi.
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 2: HỒ SƠ ZENX */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {canManageProfile ? (
            <GamePlayerProfileEditor gameId={gameId!} userId={userId} />
          ) : (
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-[#00873E]">
                    <UserRound className="size-4" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900">Hồ sơ định danh ZENX</h2>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Thông tin hồ sơ người dùng trên toàn hệ thống ZENX (chế độ chỉ xem).
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Họ và tên</span>
                  <p className="text-xs font-bold text-slate-800">
                    {current.user.profile?.fullName || 'Chưa cập nhật'}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tên đăng nhập</span>
                  <p className="text-xs font-mono font-bold text-slate-800">
                    @{current.user.username}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">User ID</span>
                  <p className="text-xs font-mono text-slate-700">
                    {current.userId}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Lần SSO đầu tiên</span>
                  <p className="text-xs font-medium text-slate-700">
                    {formatDate(current.firstLoginAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 border border-slate-200/60">
                <Info className="size-4 shrink-0 text-slate-400" />
                <span>
                  Bạn cần có quyền quản lý hồ sơ (GamePlayerProfile) để xem và chỉnh sửa các trường định danh nhạy cảm (Email, SĐT, Địa chỉ).
                </span>
              </div>
            </section>
          )}
        </div>
      )}

      {/* TAB 3: NHẬT KÝ HOẠT ĐỘNG (AUDIT TIMELINE) */}
      {activeTab === 'activity' && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <History className="size-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Nhật ký hỗ trợ & kiểm duyệt</h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Toàn bộ thao tác khóa tài khoản, mở khóa, hạn chế chat và cập nhật ghi chú của người chơi này.
              </p>
            </div>
          </div>

          {activity.isLoading ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : activity.isError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-700">
              Không thể tải lịch sử hoạt động. Vui lòng thử lại sau.
            </div>
          ) : activity.data?.items.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <History className="size-8 mx-auto stroke-1" />
              <p className="text-xs">Chưa có hoạt động hỗ trợ hoặc kiểm duyệt nào được ghi nhận.</p>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <div className="relative pl-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200/80 space-y-4">
                {activity.data?.items.map((entry) => (
                  <ActivityTimelineItem key={entry.id} entry={entry} />
                ))}
              </div>

              {/* Phân trang lịch sử */}
              {activity.data && activity.data.total > activity.data.pageSize && (
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                  <span>
                    Trang <strong className="text-slate-800">{activityPage}</strong> /{' '}
                    {Math.max(1, Math.ceil(activity.data.total / activity.data.pageSize))}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={activityPage <= 1}
                      onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                      className="h-7 px-2.5 text-xs font-semibold"
                    >
                      Trước
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={activityPage >= Math.ceil(activity.data.total / activity.data.pageSize)}
                      onClick={() => setActivityPage((p) => p + 1)}
                      className="h-7 px-2.5 text-xs font-semibold"
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* 6. MODALS / DIALOGS */}
      {/* Modal: Hạn chế tài khoản (Khóa tạm / Khóa player / Gỡ hạn chế) */}
      {pendingRestriction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            {/* Header Modal */}
            <div className="flex items-center gap-3">
              <div
                className={`flex size-10 items-center justify-center rounded-xl shrink-0 ${
                  pendingRestriction === 'PERMANENT'
                    ? 'bg-rose-50 text-rose-600'
                    : pendingRestriction === 'TEMPORARY'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {pendingRestriction === 'PERMANENT' ? (
                  <Ban className="size-5" />
                ) : pendingRestriction === 'TEMPORARY' ? (
                  <Clock className="size-5" />
                ) : (
                  <Unlock className="size-5" />
                )}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {pendingRestriction === 'TEMPORARY'
                    ? 'Khóa player tạm thời'
                    : pendingRestriction === 'PERMANENT'
                      ? 'Khóa tài khoản player'
                      : 'Gỡ hạn chế player'}
                </h2>
                <p className="text-xs text-slate-500">
                  Thay đổi chỉ có hiệu lực ở lần SSO tiếp theo của người chơi trong game này.
                </p>
              </div>
            </div>

            {/* Thông tin tóm tắt người chơi */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 flex items-center gap-3">
              <UserAvatar
                id={current.userId}
                name={current.user.profile?.fullName}
                username={current.user.username}
                avatarUrl={current.user.profile?.avatarUrl}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 text-xs truncate">
                  {displayName}
                </p>
                <p className="text-[11px] font-mono text-slate-400 truncate">
                  @{current.user.username} · ID: {current.userId.slice(0, 8)}…
                </p>
              </div>
            </div>

            {/* Khóa tạm: Lựa chọn mốc thời gian */}
            {pendingRestriction === 'TEMPORARY' && (
              <div className="space-y-2 rounded-xl border border-amber-200/70 bg-amber-50/40 p-3">
                <label className="text-xs font-semibold text-amber-900 block">
                  Thời điểm hết hạn khóa tạm
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[24, 36, 48].map((hours) => (
                    <Button
                      key={hours}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setTemporaryExpiresAt(toDateTimeLocal(new Date(Date.now() + hours * 60 * 60 * 1000)))
                      }
                      className="h-7 px-2.5 text-xs font-semibold bg-white border-amber-200 text-amber-900"
                    >
                      {hours} giờ
                    </Button>
                  ))}
                </div>
                <Input
                  className="mt-1 text-xs bg-white border-amber-200"
                  type="datetime-local"
                  value={temporaryExpiresAt}
                  onChange={(event) => setTemporaryExpiresAt(event.target.value)}
                />
              </div>
            )}

            {/* Nhập lý do */}
            <div className="space-y-1.5">
              <label
                htmlFor="restriction-reason"
                className="text-xs font-semibold text-slate-700 flex items-center justify-between"
              >
                <span>Lý do thao tác (bắt buộc)</span>
                <span className="text-[11px] text-slate-400 font-normal">Tối thiểu 3 ký tự</span>
              </label>
              <Input
                id="restriction-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Nhập lý do (tối thiểu 3 ký tự)"
                className="text-xs"
              />
            </div>

            {/* Nút hành động */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setPendingRestriction(null);
                  setReason('');
                }}
                className="h-9 px-3 text-xs"
              >
                Hủy
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={
                  reason.trim().length < 3 ||
                  (pendingRestriction === 'TEMPORARY' && !temporaryExpiresAt) ||
                  updateRestriction.isPending
                }
                onClick={() => updateRestriction.mutate()}
                className={`h-9 px-4 text-xs font-bold gap-1.5 text-white ${
                  pendingRestriction === 'PERMANENT'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : pendingRestriction === 'TEMPORARY'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-[#00873E] hover:bg-[#007033]'
                }`}
              >
                {updateRestriction.isPending && <Loader2 className="size-3.5 animate-spin" />}
                <span>Xác nhận</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Khóa / Mở Chat */}
      {pendingChat !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex size-10 items-center justify-center rounded-xl shrink-0 ${
                  pendingChat ? 'bg-purple-50 text-purple-700' : 'bg-emerald-50 text-[#00873E]'
                }`}
              >
                {pendingChat ? <MessageSquareOff className="size-5" /> : <MessageSquare className="size-5" />}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {pendingChat ? 'Khóa chat player' : 'Mở chat player'}
                </h2>
                <p className="text-xs text-slate-500">
                  Cấu hình chỉ áp dụng trong tựa game này.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="chat-reason"
                className="text-xs font-semibold text-slate-700 flex items-center justify-between"
              >
                <span>Lý do thao tác (bắt buộc)</span>
                <span className="text-[11px] text-slate-400 font-normal">Tối thiểu 3 ký tự</span>
              </label>
              <Input
                id="chat-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Nhập lý do (tối thiểu 3 ký tự)"
                className="text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setPendingChat(null);
                  setReason('');
                }}
                className="h-9 px-3 text-xs"
              >
                Hủy
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={reason.trim().length < 3 || updateChat.isPending}
                onClick={() => updateChat.mutate(pendingChat)}
                className={`h-9 px-4 text-xs font-bold gap-1.5 text-white ${
                  pendingChat ? 'bg-purple-700 hover:bg-purple-800' : 'bg-[#00873E] hover:bg-[#007033]'
                }`}
              >
                {updateChat.isPending && <Loader2 className="size-3.5 animate-spin" />}
                <span>Xác nhận</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityTimelineItem({ entry }: { entry: GamePlayerActivityEntry }) {
  const isLock =
    entry.action === 'GAME_PLAYER_BLOCKED' ||
    entry.action === 'GAME_PLAYER_PERMANENTLY_BANNED' ||
    entry.action === 'GAME_PLAYER_TEMPORARILY_BLOCKED';
  const isChat =
    entry.action === 'GAME_PLAYER_CHAT_BLOCKED' || entry.action === 'GAME_PLAYER_CHAT_UNBLOCKED';
  const isNote = entry.action === 'GAME_PLAYER_SUPPORT_NOTE_UPDATED';

  return (
    <div className="relative flex items-start gap-3">
      {/* Node Dot Icon */}
      <div
        className={`absolute -left-6 mt-0.5 flex size-5 items-center justify-center rounded-full border-2 border-white text-white shadow-xs ${
          isLock
            ? 'bg-rose-500'
            : isChat
              ? 'bg-purple-500'
              : isNote
                ? 'bg-blue-500'
                : 'bg-emerald-500'
        }`}
      >
        {isLock ? (
          <Lock className="size-2.5" />
        ) : isChat ? (
          <MessageSquare className="size-2.5" />
        ) : isNote ? (
          <FileText className="size-2.5" />
        ) : (
          <Unlock className="size-2.5" />
        )}
      </div>

      <div className="min-w-0 flex-1 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-bold text-xs text-slate-900">
            {ACTIVITY_LABEL[entry.action] ?? entry.action}
          </p>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Clock className="size-3" />
            <span>{formatDate(entry.createdAt)}</span>
          </span>
        </div>

        <p className="text-[11px] text-slate-500">
          Người thực hiện:{' '}
          <strong className="font-semibold text-slate-700">
            {entry.actor?.displayName ?? 'Hệ thống'}
          </strong>
        </p>

        {entry.reason && (
          <p className="text-xs font-medium text-slate-700 rounded-lg bg-white p-2 border border-slate-200/60 italic">
            "{entry.reason}"
          </p>
        )}
      </div>
    </div>
  );
}
