'use client';

import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { AlertCircle, ChevronLeft, ChevronRight, History, Monitor, ShieldCheck } from 'lucide-react';
import type { ActivityCategory, UserActivityLog } from '@zenx-go/api-client';
import { api } from '@/lib/api';
import { useAccount } from '@/hooks/use-account';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';
import { getErrorMessage } from '@/lib/errors';

const categories: Array<{ value: ActivityCategory; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'LOGIN', label: 'Đăng nhập' },
  { value: 'SECURITY', label: 'Bảo mật' },
];

function ActivityContent() {
  const account = useAccount();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const category = categories.some((item) => item.value === params.get('category'))
    ? (params.get('category') as ActivityCategory)
    : 'ALL';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const query = useQuery({
    queryKey: ['account', 'activity-logs', page, category],
    queryFn: () => api.account.activityLogs({ page, pageSize: 20, category }),
    enabled: Boolean(account.data),
    retry: false,
  });

  const update = (next: Partial<{ page: number; category: ActivityCategory }>) => {
    const value = new URLSearchParams(params.toString());
    const nextPage = next.page ?? page;
    const nextCategory = next.category ?? category;
    if (nextPage <= 1) {
      value.delete('page');
    } else {
      value.set('page', String(nextPage));
    }
    if (nextCategory === 'ALL') {
      value.delete('category');
    } else {
      value.set('category', nextCategory);
    }
    router.replace(value.size ? `${pathname}?${value}` : pathname, { scroll: false });
  };

  return (
    <div className="w-full space-y-6 pb-10">
      <PageHeader
        icon={ShieldCheck}
        title="Lịch sử hoạt động"
        description="Các lần đăng nhập và thay đổi bảo mật trong 180 ngày gần đây."
      />
      <div className="flex flex-wrap gap-2">
        {categories.map((item) => (
          <Button
            key={item.value}
            size="sm"
            variant={category === item.value ? 'default' : 'outline'}
            onClick={() => update({ category: item.value, page: 1 })}
          >
            {item.label}
          </Button>
        ))}
      </div>
      {query.isLoading ? (
        <Skeleton className="h-80 rounded-xl" />
      ) : query.isError ? (
        <Alert>
          <AlertCircle className="size-4" />
          {getErrorMessage(query.error, 'Không thể tải lịch sử hoạt động.')}
        </Alert>
      ) : (
        <ActivityTable items={query.data?.items ?? []} />
      )}
      {query.data && (query.data.totalPages ?? 1) > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => update({ page: page - 1 })}
          >
            <ChevronLeft className="size-4" />Trước
          </Button>
          <span className="text-sm text-slate-600">
            Trang {page}/{query.data.totalPages ?? 1}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= (query.data.totalPages ?? 1)}
            onClick={() => update({ page: page + 1 })}
          >
            Sau<ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ActivityPage() {
  return (
    <Suspense fallback={<Skeleton className="h-80 rounded-xl" />}>
      <ActivityContent />
    </Suspense>
  );
}

function activityLabel(item: UserActivityLog) {
  const labels: Record<string, string> = { ACCOUNT_REGISTERED: 'Đăng ký tài khoản', LOGIN_PASSWORD: 'Đăng nhập bằng mật khẩu', LOGIN_GOOGLE: 'Đăng nhập bằng Google', LOGIN_FACEBOOK: 'Đăng nhập bằng Facebook', LOGOUT: 'Đăng xuất', PASSWORD_CHANGED: 'Đổi mật khẩu', PASSWORD_RESET: 'Đặt lại mật khẩu', EMAIL_CHANGED: 'Đổi email', PHONE_CHANGED: 'Đổi số điện thoại', SOCIAL_LINKED: 'Liên kết tài khoản mạng xã hội', SOCIAL_UNLINKED: 'Hủy liên kết tài khoản mạng xã hội', SENSITIVE_PROFILE_UPDATED: 'Cập nhật thông tin nhạy cảm', ADMIN_CONTACT_CHANGED: 'Quản trị viên đã thay đổi thông tin liên hệ', ADMIN_SENSITIVE_PROFILE_CHANGED: 'Quản trị viên đã thay đổi thông tin nhạy cảm', ADMIN_STATUS_CHANGED: 'Quản trị viên đã thay đổi trạng thái tài khoản', ADMIN_ROLES_CHANGED: 'Quản trị viên đã thay đổi vai trò', ADMIN_SESSIONS_REVOKED: 'Quản trị viên đã thu hồi các phiên đăng nhập', ADMIN_PASSWORD_RESET: 'Quản trị viên đã đặt lại mật khẩu' };
  return labels[item.eventType] ?? 'Hoạt động bảo mật';
}

function ActivityTable({ items }: { items: UserActivityLog[] }) {
  if (!items.length) return <div className="rounded-xl border bg-white p-12 text-center text-sm text-slate-500"><History className="mx-auto mb-3 size-8 text-slate-400" />Chưa có lịch sử hoạt động.</div>;
  return <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b bg-slate-50 text-slate-600"><tr><th className="p-4 font-semibold">Thời gian</th><th className="p-4 font-semibold">Hoạt động</th><th className="p-4 font-semibold">IP</th><th className="p-4 font-semibold">Thiết bị đăng nhập</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b last:border-0"><td className="p-4 whitespace-nowrap text-slate-600">{new Date(item.createdAt).toLocaleString('vi-VN')}</td><td className="p-4"><span className={item.outcome === 'FAILED' ? 'text-red-600' : 'text-slate-900'}>{activityLabel(item)}{item.outcome === 'FAILED' ? ' (thất bại)' : ''}</span></td><td className="p-4 font-mono text-xs text-slate-600">{item.ipAddress ?? '—'}</td><td className="p-4 text-slate-600"><span className="inline-flex items-center gap-2"><Monitor className="size-4" />{item.deviceLabel ?? 'Không xác định'}</span></td></tr>)}</tbody></table></div>;
}
