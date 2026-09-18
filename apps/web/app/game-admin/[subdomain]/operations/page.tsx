'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings2 } from 'lucide-react';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/page-header';
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

  const context = useQuery({
    queryKey: ['game-admin', 'context', subdomain],
    queryFn: () => api.gameAdmin.context(subdomain),
    retry: false,
  });

  const gameId = context.data?.game.id;

  const operations = useQuery({
    queryKey: ['game-admin', 'operations', gameId],
    queryFn: () => api.gameAdmin.operations(gameId!),
    enabled: Boolean(gameId),
    retry: false,
  });

  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [expectedEndsAt, setExpectedEndsAt] = useState('');
  const [reason, setReason] = useState('');
  const [baseline, setBaseline] = useState<MaintenanceForm | null>(null);
  const [baselineVersion, setBaselineVersion] = useState<string | null>(null);
  const lastLoadedVersion = useRef<string | null>(null);

  const form: MaintenanceForm = { enabled, message, expectedEndsAt };
  const formDirty = Boolean(baseline && JSON.stringify(form) !== JSON.stringify(baseline));

  useEffect(() => {
    if (!operations.data) return;
    if (lastLoadedVersion.current === operations.data.updatedAt) return;

    const next = {
      enabled: operations.data.operationalStatus === 'MAINTENANCE',
      message: operations.data.maintenanceMessage ?? '',
      expectedEndsAt: toLocalInput(operations.data.maintenanceEndsAt),
    };
    lastLoadedVersion.current = operations.data.updatedAt;

    if (baseline && formDirty) return;
    setEnabled(next.enabled);
    setMessage(next.message);
    setExpectedEndsAt(next.expectedEndsAt);
    setBaseline(next);
    setBaselineVersion(operations.data.updatedAt);
  }, [operations.data, baseline, formDirty]);

  const update = useMutation({
    mutationFn: () =>
      api.gameAdmin.updateMaintenance(gameId!, {
        enabled,
        message: enabled ? message.trim() : null,
        expectedEndsAt: enabled && expectedEndsAt ? new Date(expectedEndsAt).toISOString() : null,
        reason: reason.trim(),
        expectedUpdatedAt: baselineVersion ?? '',
      }),
    onSuccess: (next) => {
      setReason('');
      const nextForm = {
        enabled: next.operationalStatus === 'MAINTENANCE',
        message: next.maintenanceMessage ?? '',
        expectedEndsAt: toLocalInput(next.maintenanceEndsAt),
      };
      setEnabled(nextForm.enabled);
      setMessage(nextForm.message);
      setExpectedEndsAt(nextForm.expectedEndsAt);
      setBaseline(nextForm);
      setBaselineVersion(next.updatedAt);
      queryClient.setQueryData(['game-admin', 'operations', gameId], next);
      void queryClient.invalidateQueries({ queryKey: ['game-admin', 'context', subdomain] });
      void queryClient.invalidateQueries({ queryKey: ['game-admin', 'dashboard', gameId] });
    },
  });

  if (context.isLoading || operations.isLoading) {
    return <p className="text-sm text-slate-500">Đang tải trạng thái vận hành…</p>;
  }

  if (context.isError || operations.isError || !context.data || !operations.data) {
    return (
      <p className="text-sm text-red-600">Bạn không có quyền quản lý vận hành game này.</p>
    );
  }

  const locked =
    operations.data.operationalStatus === 'DEGRADED' ||
    operations.data.operationalStatus === 'UNAVAILABLE';
  const messageInvalid = enabled && (message.trim().length < 3 || message.trim().length > 500);
  const reasonInvalid = reason.trim().length < 3 || reason.trim().length > 500;
  const disabled = locked || messageInvalid || reasonInvalid || update.isPending;

  const reloadServerOperations = async () => {
    const result = await operations.refetch();
    const server = result.data;
    if (!result.isSuccess || !server) return;
    const next = {
      enabled: server.operationalStatus === 'MAINTENANCE',
      message: server.maintenanceMessage ?? '',
      expectedEndsAt: toLocalInput(server.maintenanceEndsAt),
    };
    setEnabled(next.enabled);
    setMessage(next.message);
    setExpectedEndsAt(next.expectedEndsAt);
    setBaseline(next);
    setBaselineVersion(server.updatedAt);
    lastLoadedVersion.current = server.updatedAt;
    update.reset();
  };

  const game = context.data.game;

  return (
    <div className="w-full space-y-6">
      <PageHeader
        icon={Settings2}
        title="Vận hành game"
        badge={
          <span className="rounded bg-emerald-100/90 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
            {game.code}
          </span>
        }
        description={`Điều khiển trạng thái phục vụ và lịch bảo trì của ${game.name}. Phiên game đang chạy không bị ngắt.`}
        actions={
          <Button
            size="sm"
            disabled={disabled}
            onClick={() => update.mutate()}
            className="h-8 px-3.5 rounded-xl font-bold bg-[#00873E] text-white hover:bg-[#007033] shadow-xs"
          >
            {update.isPending ? 'Đang lưu…' : enabled ? 'Bật bảo trì' : 'Tắt bảo trì'}
          </Button>
        }
        className="border-b border-slate-100 pb-3"
      />

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Trạng thái hiện tại
            </p>
            <p className="mt-1 text-lg font-black text-slate-900">
              {statusLabel(operations.data.operationalStatus)}
            </p>
          </div>
          <span
            className={
              locked
                ? 'rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-bold text-red-700'
                : enabled
                ? 'rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-700'
                : 'rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-[#00873E]'
            }
          >
            {locked
              ? 'Do Command Hub quản lý'
              : enabled
              ? 'SSO đang tạm dừng'
              : 'Đang phục vụ'}
          </span>
        </div>

        {locked ? (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">
            Game đang ở trạng thái {statusLabel(operations.data.operationalStatus)}. Chỉ admin tổng
            mới có thể thay đổi trạng thái này.
          </p>
        ) : null}

        <label className="mt-5 flex items-center gap-3 text-xs font-bold text-slate-800 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            disabled={locked}
            onChange={(event) => setEnabled(event.target.checked)}
            className="rounded border-slate-300 text-[#00873E] focus:ring-[#00873E]"
          />
          <span>Bật chế độ bảo trì máy chủ</span>
        </label>

        {enabled ? (
          <div className="mt-4 space-y-4 rounded-xl bg-slate-50/70 p-4 border border-slate-100">
            <div>
              <label className="text-xs font-bold text-slate-700" htmlFor="maintenance-message">
                Thông báo hiển thị trên website game
              </label>
              <Textarea
                id="maintenance-message"
                className="mt-1.5 min-h-24 bg-white text-xs"
                maxLength={500}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Ví dụ: Game đang nâng cấp máy chủ, vui lòng quay lại sau."
              />
              <p className="mt-1 text-[11px] text-slate-400">{message.length}/500 ký tự</p>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700" htmlFor="maintenance-ends-at">
                Dự kiến mở lại
              </label>
              <Input
                id="maintenance-ends-at"
                className="mt-1.5 bg-white text-xs"
                type="datetime-local"
                value={expectedEndsAt}
                onChange={(event) => setExpectedEndsAt(event.target.value)}
              />
              <p className="mt-1 text-[11px] text-slate-400">Để trống nếu chưa xác định thời gian.</p>
            </div>
          </div>
        ) : null}

        <div className="mt-4">
          <label className="text-xs font-bold text-slate-700" htmlFor="maintenance-reason">
            Lý do thay đổi <span className="text-red-500">*</span>
          </label>
          <Input
            id="maintenance-reason"
            className="mt-1.5 text-xs"
            maxLength={500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Nhập lý do để ghi vào nhật ký kiểm toán (Audit Log)"
          />
          <p className="mt-1 text-[11px] text-slate-400">Bắt buộc, từ 3 đến 500 ký tự.</p>
        </div>

        {update.isError ? (
          <div className="mt-4 space-y-2 rounded-xl bg-red-50 p-3 text-xs text-red-700">
            <p>
              {getErrorMessage(
                update.error,
                'Không thể cập nhật trạng thái vận hành. Dữ liệu có thể đã thay đổi, hãy tải lại trang.',
              )}
            </p>
            <Button size="sm" variant="outline" onClick={() => void reloadServerOperations()}>
              Tải trạng thái mới
            </Button>
          </div>
        ) : null}
      </section>

      <p className="text-xs text-slate-400">
        💡 Khi bật bảo trì, website public vẫn xem được nhưng nút “Chơi ngay” bị ẩn và các lần SSO mới bị chặn. Người chơi đang ở trong game không bị đăng xuất đột ngột.
      </p>
    </div>
  );
}
