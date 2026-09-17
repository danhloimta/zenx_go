'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import {
  Search,
  ChevronLeft,
  UserRound,
  Users,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  X,
  RefreshCw,
  Mail,
  Phone,
  Copy,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { useAdminMe, useAdminUsers } from '@/hooks/use-admin';
import { UserAvatar } from '@/components/user-avatar';
import { AccountStatusBadge } from '@/components/account-status-badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { AccountStatus, AdminUserSummary } from '@zenx-go/api-client';
import { CommonTable, type ColumnDef, type TableAction } from '@/components/ui/common-table';

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

  const columns = useMemo<ColumnDef<AdminUserSummary>[]>(
    () => [
      {
        id: 'user',
        header: 'Người dùng',
        minWidth: 230,
        cell: (user) => {
          const fullName = user.profile?.fullName || user.username;
          return (
            <div className="flex items-center gap-3">
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
                  className="block truncate text-sm font-bold text-slate-900 hover:text-[#00873E] hover:underline"
                >
                  {fullName}
                </Link>
                <span className="mt-0.5 block truncate text-xs font-medium text-slate-500">
                  @{user.username}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        id: 'contact',
        header: 'Thông tin liên hệ',
        minWidth: 220,
        cell: (user) => (
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
              <Mail className="size-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{user.email}</span>
            </p>
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <Phone className="size-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{user.phone || 'Chưa cập nhật SĐT'}</span>
            </p>
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Trạng thái',
        minWidth: 140,
        cell: (user) => <AccountStatusBadge status={user.status} variant="dot" size="sm" />,
      },
      {
        id: 'roles',
        header: 'Vai trò',
        minWidth: 160,
        cell: (user) =>
          user.roles.length ? (
            <div className="flex flex-wrap gap-1">
              {user.roles.map((role) => (
                <span
                  key={role.id}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                    role.code === 'SUPER_ADMIN'
                      ? 'bg-emerald-50 text-[#00873E] border-emerald-200'
                      : 'bg-violet-50 text-violet-700 border-violet-200'
                  }`}
                >
                  <ShieldCheck className="size-3" />
                  {role.name}
                </span>
              ))}
            </div>
          ) : (
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              Member
            </span>
          ),
      },
      {
        id: 'createdAt',
        header: 'Ngày tham gia',
        minWidth: 130,
        cell: (user) => (
          <span className="whitespace-nowrap text-xs font-medium text-slate-500">
            {formatDate(user.createdAt)}
          </span>
        ),
      },
    ],
    [],
  );

  const actions = (user: AdminUserSummary): TableAction<AdminUserSummary>[] => [
    {
      key: 'view-profile',
      label: 'Xem hồ sơ chi tiết',
      icon: ArrowUpRight,
      href: `/admin/users/${user.id}`,
    },
    {
      key: 'copy-email',
      label: 'Sao chép email',
      icon: Mail,
      onClick: () => {
        navigator.clipboard.writeText(user.email);
        toast.success('Đã sao chép email người dùng');
      },
    },
    {
      key: 'copy-id',
      label: 'Sao chép User ID',
      icon: Copy,
      onClick: () => {
        navigator.clipboard.writeText(user.id);
        toast.success('Đã sao chép ID người dùng');
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header & Title Section */}
      <PageHeader
        title="Quản lý người dùng"
        icon={Users}
        description="Tra cứu, theo dõi thông tin tài khoản và kiểm soát quyền hạn thành viên."
        badge={
          users.data ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
              {totalItems.toLocaleString('vi-VN')} tài khoản
            </span>
          ) : null
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || users.isFetching}
              className="h-8 text-xs gap-1.5 border-slate-200 bg-white font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              <RefreshCw
                className={`size-3.5 ${isRefreshing || users.isFetching ? 'animate-spin text-[#00873E]' : ''}`}
              />
              <span>{isRefreshing || users.isFetching ? 'Đang tải…' : 'Làm mới'}</span>
            </Button>

            <Button asChild variant="zenx-outline" size="sm" className="h-8 text-xs font-semibold shadow-2xs">
              <Link href="/admin">
                <ChevronLeft className="size-3.5" /> Về tổng quan
              </Link>
            </Button>
          </div>
        }
        className="pb-3 border-b border-slate-100"
      />

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
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
              className={`group inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-semibold whitespace-nowrap transition-all duration-150 ${
                active
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'border border-slate-200/90 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {tab.dotColor && !active ? (
                <span className={`size-1.5 shrink-0 rounded-full ${tab.dotColor}`} />
              ) : null}
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold tabular-nums transition-colors ${
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
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm username, email, số điện thoại, họ tên người dùng…"
            className="h-8 rounded-xl pl-9 pr-8 text-xs bg-white border-slate-200"
            aria-label="Tìm kiếm người dùng"
          />
          {search ? (
            <button
              onClick={() => setSearch('')}
              aria-label="Xóa từ khóa tìm kiếm"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="size-3" />
            </button>
          ) : null}
        </div>

        {hasActiveFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-8 px-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          >
            <X className="size-3 mr-1" /> Xóa bộ lọc
          </Button>
        ) : null}
      </div>

      {/* Main Content Area: CommonTable or Error Alert */}
      {users.isError && !users.data ? (
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
        <CommonTable<AdminUserSummary>
          showIndexColumn
          data={users.data?.items ?? []}
          columns={columns}
          actions={actions}
          actionHeaderTitle="Thao tác"
          isLoading={users.isLoading}
          isFetching={users.isFetching}
          emptyTitle="Không tìm thấy người dùng"
          emptyDescription={
            debouncedSearch
              ? `Không có kết quả nào khớp với từ khóa "${debouncedSearch}".`
              : 'Chưa có tài khoản nào phù hợp với bộ lọc hiện tại.'
          }
          emptyIcon={UserRound}
          emptyAction={
            hasActiveFilters ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="mt-3 gap-1.5 border-slate-200 font-semibold text-slate-700"
              >
                <X className="size-3.5" /> Xóa bộ lọc tìm kiếm
              </Button>
            ) : undefined
          }
          pagination={{
            page,
            pageSize,
            totalItems,
            onPageChange: (newPage) => setPage(newPage),
            onPageSizeChange: (newSize) => {
              setPageSize(newSize);
              setPage(1);
            },
            pageSizeOptions: [20, 50, 100],
          }}
        />
      )}
    </div>
  );
}
