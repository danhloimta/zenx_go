'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { GamePlayer, GamePlayerActivityEntry } from '@zenx-go/api-client';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { GamePlayerProfileEditor } from '@/components/game-player-profile-editor';

const ACTIVITY_LABEL: Record<GamePlayerActivityEntry['action'], string> = {
  GAME_PLAYER_BLOCKED: 'Đã khóa player',
  GAME_PLAYER_UNBLOCKED: 'Đã mở khóa player',
  GAME_PLAYER_SUPPORT_NOTE_UPDATED: 'Đã cập nhật ghi chú nội bộ',
};

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString('vi-VN') : 'Chưa có';
}

function statusLabel(status: GamePlayer['status']) {
  return status === 'BLOCKED' ? 'Đã khóa' : 'Hoạt động';
}

export default function GamePlayerDetailPage() {
  const { subdomain, userId } = useParams<{ subdomain: string; userId: string }>();
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [noteVersion, setNoteVersion] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [noteConflict, setNoteConflict] = useState<{ note: string; updatedAt: string } | null>(null);
  const [pendingStatus, setPendingStatus] = useState<'ACTIVE' | 'BLOCKED' | null>(null);
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
  const canModerate = can('moderate', 'GamePlayer');
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

  const updateStatus = useMutation({
    mutationFn: (status: 'ACTIVE' | 'BLOCKED') => api.gameAdmin.updatePlayerStatus(gameId!, userId, {
      status,
      expectedUpdatedAt: player.data!.updatedAt,
      reason: reason.trim(),
    }),
    onSuccess: (updated) => {
      setPendingStatus(null);
      setReason('');
      queryClient.setQueryData(['game-admin', 'player', gameId, userId], updated);
      void queryClient.invalidateQueries({ queryKey: ['game-admin', 'player-activity', gameId, userId] });
      void queryClient.invalidateQueries({ queryKey: ['game-admin', 'players', gameId] });
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
  if (context.isError || player.isError || !context.data || !player.data) return <div className="space-y-3"><p className="text-sm text-red-600">Bạn không có quyền xem player này hoặc player không thuộc game hiện tại.</p><Button asChild variant="outline"><Link href="/admin/players">Quay lại danh sách player</Link></Button></div>;

  const current = player.data;
  const noteChanged = note !== (current.supportNote ?? '');
  const noteTooLong = note.length > 2_000;
  return <div className="mx-auto max-w-4xl space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><Link href="/admin/players" className="text-sm font-semibold text-emerald-700 hover:underline">← Người chơi</Link><h1 className="mt-2 text-3xl font-black">{current.user.profile?.fullName ?? current.user.username}</h1><p className="mt-1 text-sm text-slate-500">@{current.user.username}</p></div>
      <span className={current.status === 'BLOCKED' ? 'rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-700' : 'rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700'}>{statusLabel(current.status)}</span>
    </header>

    <section className="grid gap-4 md:grid-cols-3">
      <InfoCard label="Lần SSO đầu tiên" value={formatDate(current.firstLoginAt)} />
      <InfoCard label="Lần SSO gần nhất" value={formatDate(current.lastLoginAt)} />
      <InfoCard label="Tổng lượt SSO" value={String(current.loginCount)} />
    </section>

    {canManageProfile ? <GamePlayerProfileEditor gameId={gameId!} userId={userId} /> : null}

    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black">Ghi chú nội bộ</h2><p className="mt-1 text-sm text-slate-500">Chỉ đội ngũ quản trị game nhìn thấy.</p></div>{canModerate ? <Button variant={current.status === 'BLOCKED' ? 'outline' : 'destructive'} onClick={() => setPendingStatus(current.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED')}>{current.status === 'BLOCKED' ? 'Mở khóa player' : 'Khóa player'}</Button> : null}</div>
      {canEditNote ? <><Textarea className="mt-4 min-h-32" maxLength={2_000} value={note} onChange={(event) => { setNote(event.target.value); setNoteError(null); setNoteConflict(null); }} placeholder="Thêm ghi chú hỗ trợ nội bộ…" /><div className="mt-2 flex flex-wrap items-center justify-between gap-3"><p className={noteTooLong ? 'text-xs text-red-600' : 'text-xs text-slate-500'}>{note.length}/2000 ký tự</p><Button disabled={!noteChanged || noteTooLong || saveNote.isPending} onClick={() => saveNote.mutate()}>Lưu ghi chú</Button></div>{noteError ? <div className="mt-3 space-y-2 text-sm text-red-600"><p>{noteError}</p>{noteConflict ? <><p className="rounded-lg bg-amber-50 p-3 text-amber-800">Ghi chú trên máy chủ hiện là: <span className="font-semibold">{noteConflict.note || 'Chưa có ghi chú'}</span></p><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={useServerNote}>Khôi phục bản máy chủ</Button><Button size="sm" variant="outline" onClick={keepDraftAndUseLatestVersion}>Giữ bản nháp và ghi đè</Button></div></> : <Button size="sm" variant="outline" onClick={() => void refreshConflict()}>Kiểm tra bản mới</Button>}</div> : null}</> : <p className="mt-4 text-sm text-slate-500">Bạn không có quyền chỉnh sửa ghi chú nội bộ.</p>}
    </section>

    <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-black">Lịch sử hỗ trợ & moderation</h2>{activity.isLoading ? <p className="mt-4 text-sm text-slate-500">Đang tải lịch sử…</p> : activity.isError ? <p className="mt-4 text-sm text-red-600">Không thể tải lịch sử hoạt động.</p> : <><div className="mt-4 space-y-4">{activity.data?.items.map((entry) => <ActivityItem key={entry.id} entry={entry} />)}{activity.data?.items.length === 0 ? <p className="text-sm text-slate-500">Chưa có hoạt động hỗ trợ hoặc moderation.</p> : null}</div>{activity.data && activity.data.total > activity.data.pageSize ? <div className="mt-5 flex items-center justify-end gap-2"><Button size="sm" variant="outline" disabled={activityPage <= 1} onClick={() => setActivityPage(activityPage - 1)}>Trước</Button><span className="text-sm text-slate-500">Trang {activityPage} / {Math.max(1, Math.ceil(activity.data.total / activity.data.pageSize))}</span><Button size="sm" variant="outline" disabled={activityPage >= Math.ceil(activity.data.total / activity.data.pageSize)} onClick={() => setActivityPage(activityPage + 1)}>Sau</Button></div> : null}</>}</section>

    {pendingStatus ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><h2 className="text-lg font-black">{pendingStatus === 'BLOCKED' ? 'Khóa player' : 'Mở khóa player'}</h2><p className="mt-2 text-sm text-slate-500">Thay đổi chỉ có hiệu lực ở lần SSO tiếp theo.</p><Input className="mt-4" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Nhập lý do (tối thiểu 3 ký tự)" /><div className="mt-5 flex justify-end gap-3"><Button variant="outline" onClick={() => { setPendingStatus(null); setReason(''); }}>Hủy</Button><Button disabled={reason.trim().length < 3 || updateStatus.isPending} onClick={() => updateStatus.mutate(pendingStatus)}>Xác nhận</Button></div>{updateStatus.error ? <p className="mt-3 text-sm text-red-600">Không thể cập nhật. Player có thể vừa được thay đổi, hãy tải lại.</p> : null}</div></div> : null}
  </div>;
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-sm font-bold text-slate-900">{value}</p></div>;
}

function ActivityItem({ entry }: { entry: GamePlayerActivityEntry }) {
  return <div className="border-l-2 border-emerald-200 pl-4"><p className="font-semibold">{ACTIVITY_LABEL[entry.action]}</p><p className="mt-1 text-sm text-slate-500">{entry.actor?.displayName ?? 'Hệ thống'} · {formatDate(entry.createdAt)}</p>{entry.reason ? <p className="mt-1 text-sm text-slate-700">Lý do: {entry.reason}</p> : null}</div>;
}
