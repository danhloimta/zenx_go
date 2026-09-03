'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, Search, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { AdminAuditAction } from '@zenx-go/api-client';
import { useAdminAuditLogs, useAdminMe } from '@/hooks/use-admin';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

const actions: Array<{ value: '' | AdminAuditAction; label: string }> = [
  { value: '', label: 'Tất cả hành động' },
  { value: 'PROFILE_UPDATED', label: 'Cập nhật hồ sơ' },
  { value: 'STATUS_CHANGED', label: 'Đổi trạng thái' },
  { value: 'SESSIONS_REVOKED', label: 'Thu hồi phiên' },
  { value: 'PASSWORD_RESET', label: 'Đặt mật khẩu tạm' },
  { value: 'SENSITIVE_PROFILE_REVEALED', label: 'Xem CCCD' },
];

export default function AdminAuditLogsPage() {
  const admin = useAdminMe();
  const [action, setAction] = useState<'' | AdminAuditAction>('');
  const [targetId, setTargetId] = useState('');
  const [page, setPage] = useState(1);
  const query = useMemo(
    () => ({
      page,
      pageSize: 20,
      action: action || undefined,
      targetId: targetId.trim() || undefined,
    }),
    [page, action, targetId],
  );
  const logs = useAdminAuditLogs(query, Boolean(admin.data));
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900">Nhật ký hoạt động</h2>
        <p className="mt-1 text-sm text-slate-500">
          Theo dõi các thao tác quản trị và lý do thực hiện.
        </p>
      </div>
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Select
            value={action}
            onChange={(event) => {
              setAction(event.target.value as '' | AdminAuditAction);
              setPage(1);
            }}
            className="sm:w-64"
            aria-label="Lọc hành động"
          >
            {actions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={targetId}
              onChange={(event) => {
                setTargetId(event.target.value);
                setPage(1);
              }}
              placeholder="Lọc theo ID user…"
              className="pl-10"
              aria-label="Lọc theo ID user"
            />
          </div>
        </div>
      </section>
      {logs.isLoading ? (
        <Skeleton className="h-[520px] rounded-2xl" />
      ) : logs.isError || !logs.data ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
          Không thể tải nhật ký.
        </div>
      ) : (
        <>
          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="divide-y divide-slate-100">
              {logs.data.items.length ? (
                logs.data.items.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="flex min-w-0 gap-3">
                      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#00873E]">
                        <ShieldCheck className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800">
                          {actionLabel(entry.action)}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600">
                          {entry.reason}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400">
                          <span>Admin: {entry.actorUsername ?? '—'}</span>
                          <span>
                            Đối tượng:{' '}
                            {entry.targetId ? (
                              <Link
                                href={`/admin/users/${entry.targetId}`}
                                className="font-semibold text-[#00873E] hover:underline"
                              >
                                {entry.targetId.slice(0, 8)}…
                              </Link>
                            ) : (
                              '—'
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 text-[11px] text-slate-400">
                      {formatDate(entry.createdAt)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-sm text-slate-500">
                  Chưa có hoạt động phù hợp.
                </div>
              )}
            </div>
          </section>
          <div className="flex flex-col items-center justify-between gap-3 text-xs text-slate-500 sm:flex-row">
            <span>{logs.data.total.toLocaleString('vi-VN')} bản ghi</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={page <= 1 || logs.isFetching}
              >
                <ChevronLeft className="size-4" /> Trước
              </Button>
              <span className="min-w-24 text-center font-semibold text-slate-700">
                Trang {logs.data.page} / {Math.max(1, logs.data.totalPages ?? 1)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((value) => value + 1)}
                disabled={page >= (logs.data.totalPages ?? 1) || logs.isFetching}
              >
                Sau <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function actionLabel(action: string) {
  return (
    (
      {
        PROFILE_UPDATED: 'Cập nhật hồ sơ người dùng',
        STATUS_CHANGED: 'Đổi trạng thái tài khoản',
        SESSIONS_REVOKED: 'Thu hồi phiên đăng nhập',
        PASSWORD_RESET: 'Đặt mật khẩu tạm',
        SENSITIVE_PROFILE_REVEALED: 'Xem CCCD đầy đủ',
      } as Record<string, string>
    )[action] ?? action
  );
}
