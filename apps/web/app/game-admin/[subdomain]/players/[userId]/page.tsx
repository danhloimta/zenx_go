'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { GamePlayer, GamePlayerActivityEntry } from '@zenx-go/api-client';
import { Ban, Lock, MessageSquareOff, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/page-header';
import { GamePlayerProfileEditor } from '@/components/game-player-profile-editor';

const ACTIVITY_LABEL: Record<string, string> = {
  GAME_PLAYER_BLOCKED: 'Đã khóa player',
  GAME_PLAYER_UNBLOCKED: 'Đã mở khóa player',
  GAME_PLAYER_TEMPORARILY_BLOCKED: 'Đã khóa player tạm thời',
  GAME_PLAYER_PERMANENTLY_BANNED: 'Đã cấm player vĩnh viễn',
  GAME_PLAYER_TEMPORARY_LOCK_RELEASED: 'Đã gỡ khóa tạm thời',
  GAME_PLAYER_PERMANENT_BAN_RELEASED: 'Đã gỡ cấm vĩnh viễn',
  GAME_PLAYER_CHAT_BLOCKED: 'Đã khóa chat player',
  GAME_PLAYER_CHAT_UNBLOCKED: 'Đã mở chat player',
  GAME_PLAYER_SUPPORT_NOTE_UPDATED: 'Đã cập nhật ghi chú nội bộ',
};

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString('vi-VN') : 'Chưa có';
}

function toDateTimeLocal(value: Date) {
  const offset = value.getTimezoneOffset();
  return new Date(value.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function statusLabel(status: GamePlayer['status']) {
  if (status === 'PERMANENTLY_BANNED' || status === 'BLOCKED') return 'Cấm vĩnh viễn';
  if (status === 'TEMPORARILY_BLOCKED') return 'Khóa tạm thời';
  return 'Hoạt động';
}

export default function GamePlayerDetailPage() {
  const { subdomain, userId } = useParams<{ subdomain: string; userId: string }>();
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [noteVersion, setNoteVersion] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [noteConflict, setNoteConflict] = useState<{ note: string; updatedAt: string } | null>(null);
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

  const can = (action: string, subject: string) => context.data?.isSuperAdmin || context.data?.abilityRules.some((rule) => rule.action === action && rule.subject === subject);
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

  const saveNote = useMutation({
    mutationFn: () => api.gameAdmin.updatePlayerSupportNote(gameId!, userId, {
      note: note.trim() || null,
      expectedUpdatedAt: noteVersion ?? player.data!.updatedAt,
    }),
    onSuccess: (updated) => {
      setNote(updated.supportNote ?? '');
      setNoteVersion(updated.updatedAt);
      setNoteError(null);
      setNoteConflict(null);
      queryClient.setQueryData(['game-admin', 'player', gameId, userId], updated);
      void queryClient.invalidateQueries({ queryKey: ['game-admin', 'player-activity', gameId, userId] });
      void queryClient.invalidateQueries({ queryKey: ['game-admin', 'players', gameId] });
    },
    onError: async () => {
      setNoteError('Không thể lưu ghi chú. Player có thể vừa được thay đổi; bản nháp hiện tại vẫn được giữ lại.');
      const result = await player.refetch();
      if (result.data) setNoteConflict({ note: result.data.supportNote ?? '', updatedAt: result.data.updatedAt });
    },
  });

  const updateRestriction = useMutation({
    mutationFn: () => {
      const input = { expectedUpdatedAt: player.data!.updatedAt, reason: reason.trim() };
      if (pendingRestriction === 'TEMPORARY') return api.gameAdmin.temporaryLockPlayer(gameId!, userId, { ...input, expiresAt: new Date(temporaryExpiresAt).toISOString() });
      if (pendingRestriction === 'PERMANENT') return api.gameAdmin.permanentBanPlayer(gameId!, userId, input);
      return api.gameAdmin.releasePlayerRestriction(gameId!, userId, input);
    },
    onSuccess: (updated) => {
      setPendingRestriction(null);
      setTemporaryExpiresAt('');
      setReason('');
      setNoteVersion(updated.updatedAt);
      queryClient.setQueryData(['game-admin', 'player', gameId, userId], updated);
      void queryClient.invalidateQueries({ queryKey: ['game-admin', 'player-activity', gameId, userId] });
      void queryClient.invalidateQueries({ queryKey: ['game-admin', 'players', gameId] });
    },
  });

  const updateChat = useMutation({
    mutationFn: (locked: boolean) => api.gameAdmin.updatePlayerChatRestriction(gameId!, userId, { locked, expectedUpdatedAt: player.data!.updatedAt, reason: reason.trim() }),
    onSuccess: (updated) => {
      setPendingChat(null);
      setReason('');
      setNoteVersion(updated.updatedAt);
      queryClient.setQueryData(['game-admin', 'player', gameId, userId], updated);
      void queryClient.invalidateQueries({ queryKey: ['game-admin', 'player-activity', gameId, userId] });
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

  if (context.isLoading || player.isLoading) return <p className="text-sm text-slate-500">Đang tải player…</p>;
  if (context.isError || player.isError || !context.data || !player.data) return <div className="space-y-3"><p className="text-sm text-red-600">Bạn không có quyền xem player này hoặc player không thuộc game hiện tại.</p><Button asChild variant="outline"><Link href={`/game-admin/${subdomain}/players`}>Quay lại danh sách player</Link></Button></div>;

  const current = player.data;
  const currentIsPermanentBan = current.status === 'PERMANENTLY_BANNED' || current.status === 'BLOCKED';
  const canReleaseRestriction = currentIsPermanentBan ? canPermanentBan : canTemporaryLock;
  const noteChanged = note !== (current.supportNote ?? '');
  const noteTooLong = note.length > 2_000;
  return <div className="mx-auto max-w-4xl space-y-6">
    <PageHeader
      icon={Users}
      eyebrow={<Link href={`/game-admin/${subdomain}/players`} className="inline-flex items-center gap-1 font-semibold text-[#00873E] hover:underline">← Quay lại danh sách người chơi</Link>}
      title={current.user.profile?.fullName ?? current.user.username}
      badge={<span className={current.status === 'ACTIVE' ? 'rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-[#00873E]' : 'rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700'}>{statusLabel(current.status)}</span>}
      description={`@${current.user.username}`}
      className="border-b border-slate-100 pb-3"
    />

    <section className="grid gap-4 md:grid-cols-3">
      <InfoCard label="Lần SSO đầu tiên" value={formatDate(current.firstLoginAt)} />
      <InfoCard label="Lần SSO gần nhất" value={formatDate(current.lastLoginAt)} />
      <InfoCard label="Tổng lượt SSO" value={String(current.loginCount)} />
    </section>

    {canManageProfile ? <GamePlayerProfileEditor gameId={gameId!} userId={userId} /> : null}

    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black">Hạn chế tài khoản</h2><p className="mt-1 text-sm text-slate-500">Chỉ áp dụng cho player trong game này.</p></div><div className="flex flex-wrap gap-2">{canTemporaryLock && current.status === 'ACTIVE' ? <Button size="sm" variant="outline" onClick={() => { setPendingRestriction('TEMPORARY'); setTemporaryExpiresAt(toDateTimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000))); setReason(''); }}><Lock className="mr-1.5 size-3.5" />Khóa tạm</Button> : null}{canPermanentBan && current.status !== 'PERMANENTLY_BANNED' && current.status !== 'BLOCKED' ? <Button size="sm" variant="destructive" onClick={() => { setPendingRestriction('PERMANENT'); setReason(''); }}><Ban className="mr-1.5 size-3.5" />Cấm vĩnh viễn</Button> : null}{canReleaseRestriction && current.status !== 'ACTIVE' ? <Button size="sm" variant="outline" onClick={() => { setPendingRestriction('RELEASE'); setReason(''); }}>Gỡ hạn chế</Button> : null}</div></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2"><InfoCard label="Trạng thái" value={statusLabel(current.status)} />{current.status === 'TEMPORARILY_BLOCKED' ? <InfoCard label="Hết hạn khóa tạm" value={formatDate(current.blockedUntil)} /> : <InfoCard label="Lý do" value={current.blockReason ?? 'Chưa ghi nhận'} />}</div>
    </section>

    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black">Khóa chat</h2><p className="mt-1 text-sm text-slate-500">Cấu hình được lưu riêng theo game; tính năng chat sẽ áp dụng sau.</p></div>{canChatModerate ? <Button size="sm" variant={current.chatBlocked ? 'outline' : 'destructive'} onClick={() => { setReason(''); setPendingChat(!current.chatBlocked); }} disabled={updateChat.isPending}>{current.chatBlocked ? <><MessageSquareOff className="mr-1.5 size-3.5" />Mở chat</> : <><MessageSquareOff className="mr-1.5 size-3.5" />Khóa chat</>}</Button> : null}</div>
      <p className="mt-4 text-sm text-slate-600">{current.chatBlocked ? `Đã khóa${current.chatBlockReason ? `: ${current.chatBlockReason}` : ''}` : 'Chat đang mở'}</p>
    </section>

    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black">Ghi chú nội bộ</h2><p className="mt-1 text-sm text-slate-500">Chỉ đội ngũ quản trị game nhìn thấy.</p></div></div>
      {canEditNote ? <><Textarea className="mt-4 min-h-32" maxLength={2_000} value={note} onChange={(event) => { setNote(event.target.value); setNoteError(null); setNoteConflict(null); }} placeholder="Thêm ghi chú hỗ trợ nội bộ…" /><div className="mt-2 flex flex-wrap items-center justify-between gap-3"><p className={noteTooLong ? 'text-xs text-red-600' : 'text-xs text-slate-500'}>{note.length}/2000 ký tự</p><Button disabled={!noteChanged || noteTooLong || saveNote.isPending} onClick={() => saveNote.mutate()}>Lưu ghi chú</Button></div>{noteError ? <div className="mt-3 space-y-2 text-sm text-red-600"><p>{noteError}</p>{noteConflict ? <><p className="rounded-lg bg-amber-50 p-3 text-amber-800">Ghi chú trên máy chủ hiện là: <span className="font-semibold">{noteConflict.note || 'Chưa có ghi chú'}</span></p><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={useServerNote}>Khôi phục bản máy chủ</Button><Button size="sm" variant="outline" onClick={keepDraftAndUseLatestVersion}>Giữ bản nháp và ghi đè</Button></div></> : <Button size="sm" variant="outline" onClick={() => void refreshConflict()}>Kiểm tra bản mới</Button>}</div> : null}</> : <p className="mt-4 text-sm text-slate-500">Bạn không có quyền chỉnh sửa ghi chú nội bộ.</p>}
    </section>

    <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-black">Lịch sử hỗ trợ & moderation</h2>{activity.isLoading ? <p className="mt-4 text-sm text-slate-500">Đang tải lịch sử…</p> : activity.isError ? <p className="mt-4 text-sm text-red-600">Không thể tải lịch sử hoạt động.</p> : <><div className="mt-4 space-y-4">{activity.data?.items.map((entry) => <ActivityItem key={entry.id} entry={entry} />)}{activity.data?.items.length === 0 ? <p className="text-sm text-slate-500">Chưa có hoạt động hỗ trợ hoặc moderation.</p> : null}</div>{activity.data && activity.data.total > activity.data.pageSize ? <div className="mt-5 flex items-center justify-end gap-2"><Button size="sm" variant="outline" disabled={activityPage <= 1} onClick={() => setActivityPage(activityPage - 1)}>Trước</Button><span className="text-sm text-slate-500">Trang {activityPage} / {Math.max(1, Math.ceil(activity.data.total / activity.data.pageSize))}</span><Button size="sm" variant="outline" disabled={activityPage >= Math.ceil(activity.data.total / activity.data.pageSize)} onClick={() => setActivityPage(activityPage + 1)}>Sau</Button></div> : null}</>}</section>

    {pendingRestriction ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><h2 className="text-lg font-black">{pendingRestriction === 'TEMPORARY' ? 'Khóa player tạm thời' : pendingRestriction === 'PERMANENT' ? 'Cấm player vĩnh viễn' : 'Gỡ hạn chế player'}</h2><p className="mt-2 text-sm text-slate-500">Thay đổi chỉ có hiệu lực trong game này ở lần SSO tiếp theo.</p>{pendingRestriction === 'TEMPORARY' ? <><label className="mt-4 block text-sm font-semibold text-slate-700">Thời điểm hết hạn</label><div className="mt-2 flex flex-wrap gap-2">{[24, 36, 48].map((hours) => <Button key={hours} type="button" size="sm" variant="outline" onClick={() => setTemporaryExpiresAt(toDateTimeLocal(new Date(Date.now() + hours * 60 * 60 * 1000)))}>{hours} giờ</Button>)}</div><Input className="mt-3" type="datetime-local" value={temporaryExpiresAt} onChange={(event) => setTemporaryExpiresAt(event.target.value)} /></> : null}<Input className="mt-4" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Nhập lý do (tối thiểu 3 ký tự)" /><div className="mt-5 flex justify-end gap-3"><Button variant="outline" onClick={() => { setPendingRestriction(null); setReason(''); }}>Hủy</Button><Button disabled={reason.trim().length < 3 || (pendingRestriction === 'TEMPORARY' && !temporaryExpiresAt) || updateRestriction.isPending} onClick={() => updateRestriction.mutate()}>Xác nhận</Button></div>{updateRestriction.error ? <p className="mt-3 text-sm text-red-600">Không thể cập nhật. Player có thể vừa được thay đổi hoặc quyền chưa đủ.</p> : null}</div></div> : null}
    {pendingChat !== null ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><h2 className="text-lg font-black">{pendingChat ? 'Khóa chat player' : 'Mở chat player'}</h2><p className="mt-2 text-sm text-slate-500">Cấu hình chỉ áp dụng trong game này.</p><Input className="mt-4" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Nhập lý do (tối thiểu 3 ký tự)" /><div className="mt-5 flex justify-end gap-3"><Button variant="outline" onClick={() => { setPendingChat(null); setReason(''); }}>Hủy</Button><Button disabled={reason.trim().length < 3 || updateChat.isPending} onClick={() => updateChat.mutate(pendingChat)}>Xác nhận</Button></div>{updateChat.error ? <p className="mt-3 text-sm text-red-600">Không thể cập nhật cấu hình chat.</p> : null}</div></div> : null}
  </div>;
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-sm font-bold text-slate-900">{value}</p></div>;
}

function ActivityItem({ entry }: { entry: GamePlayerActivityEntry }) {
  return <div className="border-l-2 border-emerald-200 pl-4"><p className="font-semibold">{ACTIVITY_LABEL[entry.action]}</p><p className="mt-1 text-sm text-slate-500">{entry.actor?.displayName ?? 'Hệ thống'} · {formatDate(entry.createdAt)}</p>{entry.reason ? <p className="mt-1 text-sm text-slate-700">Lý do: {entry.reason}</p> : null}</div>;
}
