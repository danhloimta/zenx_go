'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  Plus,
  Search,
  Users,
  Lock,
  Layers,
  Settings,
  CheckCircle2,
  XCircle,
  Shield,
  KeyRound,
  X,
  Copy,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { useAdminAbility } from '@/lib/admin-ability';
import { PageHeader } from '@/components/page-header';
import type { RoleDetail } from '@zenx-go/api-client';
import { CommonTable, type ColumnDef, type TableAction } from '@/components/ui/common-table';
import { CreateRoleModal } from './create-role-modal';

type RoleFilterType = 'ALL' | 'SYSTEM' | 'CUSTOM';

export default function RolesPage() {
  const ability = useAdminAbility();
  const canView = ability.can('read', 'Role');
  const canCreate = ability.can('create', 'Role');

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<RoleFilterType>('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const rolesQuery = useQuery({
    queryKey: ['admin', 'access', 'roles'],
    queryFn: () => api.admin.access.roles(),
    enabled: canView,
    retry: false,
  });

  const roles = rolesQuery.data ?? [];

  // Stats calculation
  const totalRoles = roles.length;
  const systemRolesCount = roles.filter((r) => r.isSystem).length;
  const customRolesCount = roles.filter((r) => !r.isSystem).length;
  const totalAssignedUsers = roles.reduce((acc, r) => acc + (r.userCount ?? 0), 0);

  // Filtered list
  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      // Type filter
      if (filterType === 'SYSTEM' && !role.isSystem) return false;
      if (filterType === 'CUSTOM' && role.isSystem) return false;

      // Search query
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const matchName = role.name.toLowerCase().includes(query);
        const matchCode = role.code.toLowerCase().includes(query);
        const matchDesc = role.description?.toLowerCase().includes(query);
        if (!matchName && !matchCode && !matchDesc) return false;
      }

      return true;
    });
  }, [roles, filterType, search]);

  const columns = useMemo<ColumnDef<RoleDetail>[]>(
    () => [
      {
        id: 'role',
        header: 'Vai trò & Mã định danh',
        minWidth: 280,
        cell: (role) => (
          <div className="flex items-center gap-3">
            <div
              className={`flex size-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs border ${role.isSystem
                  ? 'bg-emerald-50/80 border-emerald-200/60 text-[#00873E]'
                  : 'bg-purple-50/80 border-purple-200/60 text-purple-600'
                }`}
            >
              {role.isSystem ? <Lock className="size-4" /> : <ShieldCheck className="size-4" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/access/roles/${role.id}`}
                  className="font-bold text-slate-900 hover:text-[#00873E] transition-colors whitespace-nowrap"
                >
                  {role.name}
                </Link>
                {role.isSystem ? (
                  <span className="inline-flex shrink-0 items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200/60 whitespace-nowrap">
                    Hệ thống
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200/60 whitespace-nowrap">
                    Tùy chỉnh
                  </span>
                )}
              </div>
              <span className="font-mono text-[11px] text-slate-400 block mt-0.5 whitespace-nowrap">
                {role.code}
              </span>
            </div>
          </div>
        ),
      },
      {
        id: 'description',
        header: 'Mô tả',
        minWidth: 240,
        cell: (role) => (
          <span className="text-slate-500 text-xs line-clamp-2">
            {role.description || <span className="text-slate-300">—</span>}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Trạng thái',
        minWidth: 160,
        cell: (role) => (
          <div className="flex items-center">
            {role.isActive ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 whitespace-nowrap">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Đang hoạt động
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200/60 whitespace-nowrap">
                <span className="size-1.5 rounded-full bg-slate-400" />
                Vô hiệu hóa
              </span>
            )}
          </div>
        ),
      },
      {
        id: 'userCount',
        header: 'Người dùng',
        minWidth: 110,
        align: 'center',
        cell: (role) => (
          <span className="inline-flex shrink-0 items-center gap-1.5 font-semibold text-slate-700 bg-slate-100/90 px-2.5 py-1 rounded-lg text-xs whitespace-nowrap border border-slate-200/50">
            <Users className="size-3.5 text-slate-400" />
            {role.userCount ?? 0}
          </span>
        ),
      },
      {
        id: 'permissions',
        header: 'Quyền hạn',
        minWidth: 130,
        align: 'center',
        cell: (role) => {
          const isSuperAdmin = role.code === 'SUPER_ADMIN';
          return isSuperAdmin ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/70 whitespace-nowrap">
              <KeyRound className="size-3.5 text-amber-600" />
              Toàn quyền
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-1.5 font-semibold text-slate-700 bg-slate-100/90 px-2.5 py-1 rounded-lg text-xs whitespace-nowrap border border-slate-200/50">
              <ShieldCheck className="size-3.5 text-slate-400" />
              {role.permissions?.length ?? 0} quyền
            </span>
          );
        },
      },
      {
        id: 'updatedAt',
        header: 'Cập nhật',
        minWidth: 140,
        cell: (role) => (
          <span className="whitespace-nowrap text-slate-400 text-xs">
            {formatDate(role.updatedAt)}
          </span>
        ),
      },
    ],
    [],
  );

  const actions = (role: RoleDetail): TableAction<RoleDetail>[] => [
    {
      key: 'configure',
      label: 'Cấu hình quyền hạn',
      icon: Settings,
      href: `/admin/access/roles/${role.id}`,
    },
    {
      key: 'copy-code',
      label: 'Sao chép mã vai trò',
      icon: Copy,
      onClick: () => {
        navigator.clipboard.writeText(role.code);
        toast.success(`Đã sao chép mã ${role.code}`);
      },
    },
    {
      key: 'copy-id',
      label: 'Sao chép Role ID',
      icon: Copy,
      onClick: () => {
        navigator.clipboard.writeText(role.id);
        toast.success('Đã sao chép ID vai trò');
      },
    },
  ];

  if (!canView) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center p-8 text-center">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Lock className="size-6" />
          </div>
          <h2 className="mt-4 text-base font-black text-slate-900">Không có quyền truy cập</h2>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            Bạn không có quyền xem hoặc quản lý vai trò trong hệ thống.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Vai trò & Phân quyền"
        icon={ShieldCheck}
        eyebrow="Quản trị truy cập"
        description="Quản lý các vai trò vận hành trên hệ thống. Quyền hạn chi tiết được cấu hình theo từng vai trò."
        actions={
          canCreate ? (
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 bg-[#00873E] hover:bg-[#007033] text-white font-semibold rounded-xl shadow-xs"
            >
              <Plus className="size-4" />
              <span>Tạo vai trò mới</span>
            </Button>
          ) : null
        }
      />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tổng vai trò</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Shield className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {rolesQuery.isLoading ? <Skeleton className="h-8 w-12" /> : totalRoles}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Được định nghĩa trong hệ thống</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Role hệ thống</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-[#00873E]">
              <Lock className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {rolesQuery.isLoading ? <Skeleton className="h-8 w-12" /> : systemRolesCount}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Bảo vệ mặc định (bất biến)</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Role tùy chỉnh</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <Layers className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {rolesQuery.isLoading ? <Skeleton className="h-8 w-12" /> : customRolesCount}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Tự thiết lập theo nghiệp vụ</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Gán người dùng</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Users className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {rolesQuery.isLoading ? <Skeleton className="h-8 w-12" /> : totalAssignedUsers}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Lượt phân quyền đang hiệu lực</span>
        </div>
      </div>

      {/* Search & Filter Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Box */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm tên, mã vai trò..."
            className="pl-9 pr-8 h-9.5 rounded-xl text-xs bg-white border-slate-200"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${filterType === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Tất cả ({roles.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('SYSTEM')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${filterType === 'SYSTEM'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Hệ thống ({systemRolesCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('CUSTOM')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${filterType === 'CUSTOM'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Tùy chỉnh ({customRolesCount})
          </button>
        </div>
      </div>

      {/* Common Table with Sticky Actions and Horizontal Scroll */}
      <CommonTable<RoleDetail>
        showIndexColumn
        data={filteredRoles}
        columns={columns}
        actions={actions}
        actionHeaderTitle="Thao tác"
        isLoading={rolesQuery.isLoading}
        isFetching={rolesQuery.isFetching}
        emptyTitle="Không tìm thấy vai trò nào"
        emptyDescription={
          search
            ? `Không có kết quả khớp với "${search}"`
            : 'Chưa có vai trò nào trong danh mục này'
        }
        emptyIcon={Shield}
        emptyAction={
          search ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearch('')}
              className="mt-3 text-xs gap-1.5 border-slate-200 font-semibold text-slate-700"
            >
              <X className="size-3" /> Xóa tìm kiếm
            </Button>
          ) : undefined
        }
        footerExtra={
          <div className="px-4 py-3 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/40 rounded-b-2xl">
            <span>
              Bấm vào &quot;Cấu hình quyền hạn&quot; để thiết lập chi tiết quyền hạn hoặc chỉnh sửa vai trò.
            </span>
            <span className="font-semibold text-slate-500">
              Hiển thị {filteredRoles.length} / {roles.length} vai trò
            </span>
          </div>
        }
      />

      {/* Modal Tạo vai trò mới */}
      <CreateRoleModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}
