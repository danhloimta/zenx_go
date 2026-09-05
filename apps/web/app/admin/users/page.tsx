'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  UserRound,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  X,
  RefreshCw,
  SlidersHorizontal,
  Mail,
  Phone,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useAdminMe, useAdminUsers } from '@/hooks/use-admin';
import { UserAvatar } from '@/components/user-avatar';
import { AccountStatusBadge } from '@/components/account-status-badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { AccountStatus, AdminUserSummary } from '@zenx-go/api-client';

const statusTabs: Array<{
  value: '' | AccountStatus;
  label: string;
  dotColor?: string;
}> = [
  { value: '', label: 'Tất cả' },
  { value: 'ACTIVE', label: 'Đang hoạt động', dotColor: 'bg-emerald-500' },
  { value: 'PENDING', label: 'Chờ xác minh', dotColor: 'bg-amber-400' },
  { value: 'SUSPENDED', label: 'Tạm ngưng', dotColor: 'bg-slate-400' },
  { value: 'LOCKED', label: 'Bị khóa', dotColor: 'bg-rose-500' },
  { value: 'DELETED', label: 'Đã xóa', dotColor: 'bg-rose-600' },
];

export default function AdminUsersPage() {
  const admin = useAdminMe();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<'' | AccountStatus>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, startTransition] = useTransition();

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
      pageSize,
      search: debouncedSearch || undefined,
      status: status || undefined,
    }),
    [page, pageSize, debouncedSearch, status],
  );

  const users = useAdminUsers(query, Boolean(admin.data));

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await users.refetch();
      startTransition(() => {
        toast.success('Đã tải lại danh sách người dùng');
      });
    } catch {
      toast.error('Không thể làm mới danh sách');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatus('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || status);
  const totalItems = users.data?.total ?? 0;
  const totalPages = Math.max(1, users.data?.totalPages ?? 1);
  const currentPage = users.data?.page ?? 1;

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="space-y-6">
      {/* Header & Title Section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Quản lý người dùng
            </h2>
            {users.data ? (
              <span className="rounded-full bg-[#E8F7EC] px-2.5 py-0.5 text-xs font-bold text-[#00873E]">
                {totalItems.toLocaleString('vi-VN')} tài khoản
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Tra cứu, theo dõi thông tin tài khoản và kiểm soát quyền hạn thành viên.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || users.isFetching}
            className="gap-2 border-slate-200 bg-white font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            <RefreshCw
              className={`size-3.5 ${isRefreshing || users.isFetching ? 'animate-spin text-[#00873E]' : ''}`}
            />
            <span>{isRefreshing || users.isFetching ? 'Đang tải…' : 'Làm mới'}</span>
          </Button>

          <Button asChild variant="zenx-outline" size="sm" className="font-semibold shadow-2xs">
            <Link href="/admin">
              <ChevronLeft className="size-4" /> Về tổng quan
            </Link>
          </Button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {statusTabs.map((tab) => {
          const active = status === tab.value;
          const countKey = tab.value === '' ? 'ALL' : tab.value;
          const count = users.data?.statusCounts?.[countKey];
          return (
            <button
              key={tab.value}
              onClick={() => {
                setStatus(tab.value);
                setPage(1);
              }}
              className={`group inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
                active
                  ? 'bg-[#00873E] text-white shadow-xs'
                  : 'border border-slate-200/90 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {tab.dotColor && !active ? (
                <span className={`size-2 shrink-0 rounded-full ${tab.dotColor}`} />
              ) : null}
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold transition-colors ${
                  active
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200/80 group-hover:text-slate-900'
                }`}
              >
                {count !== undefined ? count.toLocaleString('vi-VN') : '…'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar Section */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm username, email, số điện thoại, họ tên người dùng…"
              className="h-10 pl-10 pr-9 text-sm"
              aria-label="Tìm kiếm người dùng"
            />
            {search ? (
              <button
                onClick={() => setSearch('')}
                aria-label="Xóa từ khóa tìm kiếm"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap">
              <SlidersHorizontal className="size-3.5 text-slate-400" />
              <span>Số lượng:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#00873E] focus:ring-1 focus:ring-[#00873E]"
              >
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
                <option value={100}>100 / trang</option>
              </select>
            </div>

            {hasActiveFilters ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-9 px-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                <X className="size-3.5 mr-1" /> Xóa bộ lọc
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      {users.isLoading ? (
        <UsersSkeleton />
      ) : users.isError || !users.data ? (
        <div className="rounded-2xl border border-red-200/80 bg-red-50/70 p-6 text-sm text-red-700 shadow-xs">
          <div className="flex items-center gap-3">
            <ShieldAlert className="size-5 shrink-0 text-red-600" />
            <p className="font-semibold">Không thể tải danh sách người dùng.</p>
          </div>
          <p className="mt-2 text-xs text-red-600">
            Có lỗi xảy ra trong quá trình truy vấn dữ liệu tài khoản từ máy chủ.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 border-red-200 bg-white text-red-700 hover:bg-red-50"
            onClick={() => users.refetch()}
          >
            <RefreshCw className="mr-1.5 size-3.5" /> Thử lại
          </Button>
        </div>
      ) : (
        <>
          {/* Table Container (Desktop / Tablet) */}
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Người dùng</th>
                    <th className="px-5 py-3.5">Liên hệ</th>
                    <th className="whitespace-nowrap px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5">Vai trò</th>
                    <th className="px-5 py-3.5">Ngày tham gia</th>
                    <th className="px-5 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.data.items.map((user) => (
                    <UserTableRow key={user.id} user={user} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="divide-y divide-slate-100 md:hidden">
              {users.data.items.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>

            {/* Empty State */}
            {!users.data.items.length ? (
              <div className="p-12 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <UserRound className="size-7" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-800">
                  Không tìm thấy người dùng
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {debouncedSearch
                    ? `Không có kết quả nào khớp với từ khóa "${debouncedSearch}".`
                    : 'Chưa có tài khoản nào phù hợp với bộ lọc hiện tại.'}
                </p>
                {hasActiveFilters ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                    className="mt-4 gap-1.5 border-slate-200 font-semibold text-slate-700"
                  >
                    <X className="size-3.5" /> Xóa bộ lọc tìm kiếm
                  </Button>
                ) : null}
              </div>
            ) : null}
          </section>

          {/* Pagination Controls */}
          {users.data.items.length > 0 ? (
            <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-3.5 shadow-2xs sm:flex-row">
              <span className="text-xs font-medium text-slate-500">
                Hiển thị <strong className="text-slate-800">{startIndex}</strong> -{' '}
                <strong className="text-slate-800">{endIndex}</strong> trong tổng số{' '}
                <strong className="text-slate-900">{totalItems.toLocaleString('vi-VN')}</strong> tài
                khoản
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(1)}
                  disabled={page <= 1 || users.isFetching}
                  className="size-8 p-0 border-slate-200"
                  aria-label="Trang đầu tiên"
                >
                  <ChevronsLeft className="size-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={page <= 1 || users.isFetching}
                  className="h-8 gap-1 px-2.5 text-xs font-semibold border-slate-200"
                >
                  <ChevronLeft className="size-3.5" /> Trước
                </Button>

                <span className="min-w-24 text-center text-xs font-bold text-slate-800 px-2">
                  Trang {currentPage} / {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  disabled={page >= totalPages || users.isFetching}
                  className="h-8 gap-1 px-2.5 text-xs font-semibold border-slate-200"
                >
                  Sau <ChevronRight className="size-3.5" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(totalPages)}
                  disabled={page >= totalPages || users.isFetching}
                  className="size-8 p-0 border-slate-200"
                  aria-label="Trang cuối cùng"
                >
                  <ChevronsRight className="size-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function UserTableRow({ user }: { user: AdminUserSummary }) {
  const fullName = user.profile?.fullName || user.username;

  return (
    <tr className="group transition duration-150 hover:bg-slate-50/80">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3.5">
          <UserAvatar
            id={user.id}
            name={fullName}
            username={user.username}
            email={user.email}
            avatarUrl={user.profile?.avatarUrl}
            status={user.status}
            showStatusDot
            size="md"
          />
          <div className="min-w-0">
            <Link
              href={`/admin/users/${user.id}`}
              className="block truncate text-sm font-bold text-slate-900 group-hover:text-[#00873E] hover:underline"
            >
              {fullName}
            </Link>
            <span className="mt-0.5 block truncate text-xs text-slate-500 font-medium">
              @{user.username}
            </span>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <p className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
          <Mail className="size-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{user.email}</span>
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
          <Phone className="size-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{user.phone || 'Chưa cập nhật SĐT'}</span>
        </p>
      </td>

      <td className="whitespace-nowrap px-5 py-4">
        <AccountStatusBadge status={user.status} variant="dot" size="sm" />
      </td>

      <td className="px-5 py-4">
        {user.roles.length ? (
          <div className="flex flex-wrap gap-1">
            {user.roles.map((role) => (
              <span
                key={role}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                  role === 'SUPER_ADMIN'
                    ? 'bg-emerald-50 text-[#00873E] border-emerald-200'
                    : 'bg-violet-50 text-violet-700 border-violet-200'
                }`}
              >
                <ShieldCheck className="size-3" />
                {role}
              </span>
            ))}
          </div>
        ) : (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
            Member
          </span>
        )}
      </td>

      <td className="whitespace-nowrap px-5 py-4 text-xs font-medium text-slate-500">
        {formatDate(user.createdAt)}
      </td>

      <td className="px-5 py-4 text-right">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-8 gap-1 px-2.5 text-xs font-semibold border-slate-200 bg-white hover:border-[#00873E]/40 hover:bg-[#E8F7EC] hover:text-[#00873E]"
        >
          <Link href={`/admin/users/${user.id}`} aria-label={`Xem chi tiết ${user.username}`}>
            <span>Xem hồ sơ</span>
            <ArrowUpRight className="size-3.5" />
          </Link>
        </Button>
      </td>
    </tr>
  );
}

function UserCard({ user }: { user: AdminUserSummary }) {
  const fullName = user.profile?.fullName || user.username;

  return (
    <Link
      href={`/admin/users/${user.id}`}
      className="block p-4 transition duration-150 hover:bg-slate-50/80"
    >
      <div className="flex items-start gap-3.5">
        <UserAvatar
          id={user.id}
          name={fullName}
          username={user.username}
          email={user.email}
          avatarUrl={user.profile?.avatarUrl}
          status={user.status}
          showStatusDot
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">{fullName}</p>
              <p className="mt-0.5 truncate text-xs font-medium text-slate-500">@{user.username}</p>
            </div>
            <AccountStatusBadge status={user.status} variant="dot" size="sm" />
          </div>

          <div className="mt-2.5 space-y-1 text-xs text-slate-600">
            <p className="flex items-center gap-1.5 truncate">
              <Mail className="size-3 text-slate-400 shrink-0" />
              <span>{user.email}</span>
            </p>
            {user.phone ? (
              <p className="flex items-center gap-1.5 truncate">
                <Phone className="size-3 text-slate-400 shrink-0" />
                <span>{user.phone}</span>
              </p>
            ) : null}
          </div>

          <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            <span>Tạo ngày: {formatDate(user.createdAt)}</span>
            <span className="inline-flex items-center font-bold text-[#00873E]">
              Xem hồ sơ <ArrowUpRight className="size-3 ml-0.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function UsersSkeleton() {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6, 7].map((value) => (
          <Skeleton key={value} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
