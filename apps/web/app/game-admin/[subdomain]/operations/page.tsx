'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { GameOperations } from '@zenx-go/api-client';

function toLocalInput(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function statusLabel(status: GameOperations['operationalStatus']) {
  if (status === 'MAINTENANCE') return 'Đang bảo trì';
  if (status === 'DEGRADED') return 'Hiệu năng suy giảm';
  if (status === 'UNAVAILABLE') return 'Không khả dụng';
  return 'Sẵn sàng phục vụ';
}

type MaintenanceForm = { enabled: boolean; message: string; expectedEndsAt: string };

export default function GameOperationsPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const queryClient = useQueryClient();
  const context = useQuery({ queryKey: ['game-admin', 'context', subdomain], queryFn: () => api.gameAdmin.context(subdomain), retry: false });
  const gameId = context.data?.game.id;
  const operations = useQuery({ queryKey: ['game-admin', 'operations', gameId], queryFn: () => api.gameAdmin.operations(gameId!), enabled: Boolean(gameId), retry: false });
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [expectedEndsAt, setExpectedEndsAt] = useState('');
  const [reason, setReason] = useState('');
  const [baseline, setBaseline] = useState<MaintenanceForm | null>(null);
  const form: MaintenanceForm = { enabled, message, expectedEndsAt };
  const formDirty = Boolean(baseline && JSON.stringify(form) !== JSON.stringify(baseline));

  useEffect(() => {
    if (!operations.data) return;
    const next = { enabled: operations.data.operationalStatus === 'MAINTENANCE', message: operations.data.maintenanceMessage ?? '', expectedEndsAt: toLocalInput(operations.data.maintenanceEndsAt) };
    if (!baseline || !formDirty) {
      setEnabled(next.enabled);
      setMessage(next.message);
      setExpectedEndsAt(next.expectedEndsAt);
      setBaseline(next);
    }
  }, [operations.data, baseline, formDirty]);

  const update = useMutation({
    mutationFn: () => api.gameAdmin.updateMaintenance(gameId!, {
      enabled,
      message: enabled ? message.trim() || null : null,
      expectedEndsAt: enabled && expectedEndsAt ? new Date(expectedEndsAt).toISOString() : null,
      expectedUpdatedAt: operations.data!.updatedAt,
      reason: reason.trim(),
    }),
    onSuccess: (next) => {
      setReason('');
      const nextForm = { enabled: next.operationalStatus === 'MAINTENANCE', message: next.maintenanceMessage ?? '', expectedEndsAt: toLocalInput(next.maintenanceEndsAt) };
      setEnabled(nextForm.enabled);
      setMessage(nextForm.message);
      setExpectedEndsAt(nextForm.expectedEndsAt);
      setBaseline(nextForm);
      queryClient.setQueryData(['game-admin', 'operations', gameId], next);
      void queryClient.invalidateQueries({ queryKey: ['game-admin', 'context', subdomain] });
      void queryClient.invalidateQueries({ queryKey: ['game-admin', 'dashboard', gameId] });
    },
  });

  if (context.isLoading || operations.isLoading) return <p className="text-sm text-slate-500">Đang tải trạng thái vận hành…</p>;
  if (context.isError || operations.isError || !context.data || !operations.data) return <p className="text-sm text-red-600">Bạn không có quyền quản lý vận hành game này.</p>;

  const locked = operations.data.operationalStatus === 'DEGRADED' || operations.data.operationalStatus === 'UNAVAILABLE';
  const messageInvalid = enabled && (message.trim().length < 3 || message.trim().length > 500);
  const reasonInvalid = reason.trim().length < 3 || reason.trim().length > 500;
  const disabled = locked || messageInvalid || reasonInvalid || update.isPending;

  return <div className="mx-auto max-w-3xl space-y-6">
    <header><h1 className="text-3xl font-black">Vận hành</h1><p className="mt-1 text-sm text-slate-500">Điều khiển trạng thái phục vụ của {context.data.game.name}. Phiên game đang chạy không bị ngắt.</p></header>
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trạng thái hiện tại</p><p className="mt-1 text-xl font-black">{statusLabel(operations.data.operationalStatus)}</p></div><span className={locked ? 'rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-700' : enabled ? 'rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700' : 'rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700'}>{locked ? 'Do Command Hub quản lý' : enabled ? 'SSO đang tạm dừng' : 'Đang phục vụ'}</span></div>
      {locked ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Game đang ở trạng thái {statusLabel(operations.data.operationalStatus)}. Chỉ admin tổng mới có thể thay đổi trạng thái này.</p> : null}
      <label className="mt-5 flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={enabled} disabled={locked} onChange={(event) => setEnabled(event.target.checked)} /> Bật chế độ bảo trì</label>
      {enabled ? <div className="mt-4 space-y-4"><div><label className="text-sm font-semibold" htmlFor="maintenance-message">Thông báo hiển thị trên website</label><Textarea id="maintenance-message" className="mt-2 min-h-28" maxLength={500} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ví dụ: Game đang nâng cấp máy chủ, vui lòng quay lại sau." /><p className="mt-1 text-xs text-slate-500">{message.length}/500 ký tự</p></div><div><label className="text-sm font-semibold" htmlFor="maintenance-ends-at">Dự kiến mở lại</label><Input id="maintenance-ends-at" className="mt-2" type="datetime-local" value={expectedEndsAt} onChange={(event) => setExpectedEndsAt(event.target.value)} /><p className="mt-1 text-xs text-slate-500">Để trống nếu chưa xác định thời gian.</p></div></div> : null}
      <div className="mt-4"><label className="text-sm font-semibold" htmlFor="maintenance-reason">Lý do thay đổi</label><Input id="maintenance-reason" className="mt-2" maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Nhập lý do để ghi vào audit" /><p className="mt-1 text-xs text-slate-500">Bắt buộc, từ 3 đến 500 ký tự.</p></div>
      {update.isError ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{getErrorMessage(update.error, 'Không thể cập nhật trạng thái vận hành. Dữ liệu có thể đã thay đổi, hãy tải lại trang.')}</p> : null}
      <div className="mt-5 flex justify-end"><Button disabled={disabled} onClick={() => update.mutate()}>{update.isPending ? 'Đang lưu…' : enabled ? 'Bật bảo trì' : 'Tắt bảo trì'}</Button></div>
    </section>
    <p className="text-sm text-slate-500">Khi bật bảo trì, public site vẫn xem được nhưng nút “Chơi ngay” bị ẩn và các lần SSO mới bị chặn. Người chơi đang ở trong game không bị đăng xuất.</p>
  </div>;
}
