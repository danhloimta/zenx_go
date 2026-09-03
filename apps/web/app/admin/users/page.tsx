'use client';

import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, UserRound, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAdminMe, useAdminUsers } from '@/hooks/use-admin';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import type { AccountStatus, AdminUserSummary } from '@zenx-go/api-client';

const statuses: Array<{ value: '' | AccountStatus; label: string }> = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'PENDING', label: 'Chờ xác minh' },
  { value: 'SUSPENDED', label: 'Tạm ngưng' },
  { value: 'LOCKED', label: 'Bị khóa' },
];

export default function AdminUsersPage() {
  const admin = useAdminMe();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<'' | AccountStatus>('');
  const [page, setPage] = useState(1);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);
  const query = useMemo(
    () => ({
      page,
      pageSize: 20,
      search: debouncedSearch || undefined,
      status: status || undefined,
    }),
    [page, debouncedSearch, status],
  );
  const users = useAdminUsers(query, Boolean(admin.data));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900">Người dùng</h2>
        <p className="mt-1 text-sm text-slate-500">Tìm kiếm, xem và xử lý vòng đời tài khoản.</p>
      </div>
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm username, email, số điện thoại, họ tên…"
              className="pl-10"
              aria-label="Tìm người dùng"
            />
          </div>
          <Select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as '' | AccountStatus);
              setPage(1);
            }}
            className="md:w-56"
            aria-label="Lọc trạng thái"
          >
            {statuses.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </section>
      {users.isLoading ? (
        <UsersSkeleton />
      ) : users.isError || !users.data ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
          Không thể tải danh sách người dùng.
        </div>
      ) : (
        <>
          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Người dùng</th>
                    <th className="px-5 py-3">Liên hệ</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3">Quyền</th>
                    <th className="px-5 py-3">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.data.items.map((user) => (
                    <UserTableRow key={user.id} user={user} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-slate-100 md:hidden">
              {users.data.items.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
            {!users.data.items.length ? (
              <div className="p-12 text-center">
                <UserRound className="mx-auto size-10 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Không tìm thấy người dùng
                </p>
                <p className="mt-1 text-xs text-slate-500">Thử thay đổi từ khóa hoặc bộ lọc.</p>
              </div>
            ) : null}
          </section>
          <div className="flex flex-col items-center justify-between gap-3 text-xs text-slate-500 sm:flex-row">
            <span>
              Hiển thị {users.data.items.length} / {users.data.total.toLocaleString('vi-VN')} người
              dùng
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={page <= 1 || users.isFetching}
              >
                <ChevronLeft className="size-4" /> Trước
              </Button>
              <span className="min-w-24 text-center font-semibold text-slate-700">
                Trang {users.data.page} / {Math.max(1, users.data.totalPages ?? 1)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((value) => value + 1)}
                disabled={page >= (users.data.totalPages ?? 1) || users.isFetching}
              >
                <Sau /> Sau
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function UserTableRow({ user }: { user: AdminUserSummary }) {
  return (
    <tr className="transition hover:bg-slate-50">
      <td className="px-5 py-4">
        <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3">
          <Avatar user={user} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-slate-800">
              {user.profile?.fullName || user.username}
            </span>
            <span className="mt-0.5 block truncate text-xs text-slate-500">@{user.username}</span>
          </span>
        </Link>
      </td>
      <td className="px-5 py-4">
        <p className="text-xs text-slate-700">{user.email}</p>
        <p className="mt-1 text-xs text-slate-500">{user.phone || 'Chưa có số điện thoại'}</p>
      </td>
      <td className="px-5 py-4">
        <StatusPill status={user.status ?? ''} />
      </td>
      <td className="px-5 py-4">
        {user.roles.length ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">
            <ShieldCheck className="size-3" />
            {user.roles.join(', ')}
          </span>
        ) : (
          <span className="text-xs text-slate-400">User</span>
        )}
      </td>
      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
        {formatDate(user.createdAt)}
      </td>
    </tr>
  );
}

function UserCard({ user }: { user: AdminUserSummary }) {
  return (
    <Link href={`/admin/users/${user.id}`} className="block p-4 transition hover:bg-slate-50">
      <div className="flex items-start gap-3">
        <Avatar user={user} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-800">
                {user.profile?.fullName || user.username}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-500">@{user.username}</p>
            </div>
            <StatusPill status={user.status ?? ''} />
          </div>
          <p className="mt-3 truncate text-xs text-slate-600">{user.email}</p>
          <p className="mt-1 text-xs text-slate-500">
            {user.phone || 'Chưa có số điện thoại'} · {formatDate(user.createdAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}

function Avatar({ user }: { user: AdminUserSummary }) {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-50 text-[#00873E]">
      {user.profile?.avatarUrl ? (
        <img src={user.profile.avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        <UserRound className="size-5" />
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const meta = (
    {
      ACTIVE: ['Đang hoạt động', 'bg-emerald-50 text-emerald-700'],
      PENDING: ['Chờ xác minh', 'bg-amber-50 text-amber-700'],
      SUSPENDED: ['Tạm ngưng', 'bg-slate-100 text-slate-700'],
      LOCKED: ['Bị khóa', 'bg-red-50 text-red-700'],
    } as Record<string, [string, string]>
  )[status] ?? [status, 'bg-slate-100 text-slate-700'];
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ${meta[1]}`}
    >
      {meta[0]}
    </span>
  );
}

function Sau() {
  return <ChevronRight className="size-4" />;
}

function UsersSkeleton() {
  return (
    <div className="space-y-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      {[1, 2, 3, 4, 5, 6].map((value) => (
        <Skeleton key={value} className="h-14 rounded-xl" />
      ))}
    </div>
  );
}
