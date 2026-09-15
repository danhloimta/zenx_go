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
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { useAdminAbility } from '@/lib/admin-ability';
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <span>Quản trị truy cập</span>
            <span>/</span>
            <span className="text-[#00873E]">Vai trò & Phân quyền</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Vai trò & Phân quyền (RBAC)
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl">
            Quản lý các vai trò vận hành trên hệ thống. Quyền hạn chi tiết được cấu hình theo từng vai trò.
          </p>
        </div>

        {canCreate ? (
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 bg-[#00873E] hover:bg-[#007033] text-white font-semibold rounded-xl shadow-xs"
          >
            <Plus className="size-4" />
            <span>Tạo vai trò mới</span>
          </Button>
        ) : null}
      </div>

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

      {/* Main Table Section */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Table Filters Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50">
          {/* Search Box */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm tên, mã vai trò..."
              className="pl-9 pr-8 h-9.5 rounded-xl text-xs bg-white"
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
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterType === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({roles.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('SYSTEM')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterType === 'SYSTEM'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hệ thống ({systemRolesCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('CUSTOM')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterType === 'CUSTOM'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tùy chỉnh ({customRolesCount})
            </button>
          </div>
        </div>

        {/* Roles Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Vai trò & Mã định danh</th>
                <th className="py-3.5 px-4 hidden md:table-cell">Mô tả</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-center">Người dùng</th>
                <th className="py-3.5 px-4 text-center">Quyền hạn</th>
                <th className="py-3.5 px-4 hidden lg:table-cell">Cập nhật</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rolesQuery.isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4 sm:px-6">
                      <Skeleton className="h-4 w-40 mb-1.5" />
                      <Skeleton className="h-3 w-24" />
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <Skeleton className="h-3 w-48" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </td>
                    <td className="p-4 text-center">
                      <Skeleton className="h-4 w-12 mx-auto" />
                    </td>
                    <td className="p-4 text-center">
                      <Skeleton className="h-4 w-16 mx-auto" />
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <Skeleton className="h-3 w-28" />
                    </td>
                    <td className="p-4 sm:px-6 text-right">
                      <Skeleton className="h-8 w-24 ml-auto rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Shield className="size-8 text-slate-300 stroke-1" />
                      <p className="font-semibold text-slate-600 text-sm">Không tìm thấy vai trò nào</p>
                      <p className="text-xs text-slate-400">
                        {search ? `Không có kết quả khớp với "${search}"` : 'Chưa có vai trò nào trong danh mục này'}
                      </p>
                      {search ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSearch('')}
                          className="mt-2 text-xs text-[#00873E]"
                        >
                          Xóa tìm kiếm
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRoles.map((role) => {
                  const isSuperAdmin = role.code === 'SUPER_ADMIN';
                  return (
                    <tr
                      key={role.id}
                      className="hover:bg-slate-50/75 transition-colors group"
                    >
                      {/* Name & Code */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex size-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                              role.isSystem
                                ? 'bg-emerald-50 text-[#00873E]'
                                : 'bg-purple-50 text-purple-600'
                            }`}
                          >
                            {role.isSystem ? (
                              <Lock className="size-4" />
                            ) : (
                              <ShieldCheck className="size-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/admin/access/roles/${role.id}`}
                                className="font-bold text-slate-900 hover:text-[#00873E] transition-colors"
                              >
                                {role.name}
                              </Link>
                              {role.isSystem ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                                  Hệ thống
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-600">
                                  Tùy chỉnh
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[11px] text-slate-400 block mt-0.5">
                              {role.code}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-4 px-4 hidden md:table-cell text-slate-500 max-w-xs truncate">
                        {role.description || <span className="text-slate-300">—</span>}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {role.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="size-3 text-emerald-600" />
                            Đang hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
                            <XCircle className="size-3 text-slate-400" />
                            Vô hiệu hóa
                          </span>
                        )}
                      </td>

                      {/* Users Count */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg text-xs">
                          <Users className="size-3.5 text-slate-400" />
                          {role.userCount}
                        </span>
                      </td>

                      {/* Permissions Count */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {isSuperAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                            <KeyRound className="size-3 text-amber-600" />
                            Toàn quyền
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg text-xs">
                            <ShieldCheck className="size-3.5 text-slate-400" />
                            {role.permissions?.length ?? 0} quyền
                          </span>
                        )}
                      </td>

                      {/* Updated Date */}
                      <td className="py-4 px-4 hidden lg:table-cell whitespace-nowrap text-slate-400 text-[11px]">
                        {formatDate(role.updatedAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/access/roles/${role.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs text-slate-700 bg-slate-100 hover:bg-[#E8F7EC] hover:text-[#00873E] transition-all"
                        >
                          <Settings className="size-3.5" />
                          <span>Cấu hình quyền</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Bấm vào &quot;Cấu hình quyền&quot; để thiết lập chi tiết quyền hạn hoặc chỉnh sửa vai trò.
          </span>
          <span className="font-semibold text-slate-500">
            Hiển thị {filteredRoles.length} / {roles.length} vai trò
          </span>
        </div>
      </section>

      {/* Modal Tạo vai trò mới */}
      <CreateRoleModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}
