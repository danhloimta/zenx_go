'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
  KeyRound,
  Headphones,
  Gamepad2,
  Wallet,
  AlertCircle,
  Trash2,
  Save,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  Layers,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { useAdminAbility } from '@/lib/admin-ability';
import { getErrorMessage } from '@/lib/errors';
import { toast } from 'sonner';

type PermissionFilter = 'ALL' | 'GRANTED' | 'NOT_GRANTED';

const MODULE_CONFIG: Record<
  string,
  { label: string; description: string; icon: typeof Settings; color: string; badgeBg: string }
> = {
  admin: {
    label: 'Quản trị hệ thống',
    description: 'Truy cập cổng quản trị và xem báo cáo tổng quan',
    icon: Settings,
    color: 'text-indigo-600',
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  users: {
    label: 'Quản lý người dùng',
    description: 'Xem tài khoản, cập nhật hồ sơ, trạng thái và phân bổ vai trò',
    icon: Users,
    color: 'text-blue-600',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  roles: {
    label: 'Vai trò & Phân quyền',
    description: 'Quản lý danh sách vai trò và phân bổ quyền truy cập hệ thống',
    icon: KeyRound,
    color: 'text-emerald-600',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  support: {
    label: 'Hỗ trợ khách hàng (CSKH)',
    description: 'Xem và xử lý ticket yêu cầu trợ giúp, ghi chú nội bộ và FAQ',
    icon: Headphones,
    color: 'text-amber-600',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  content: {
    label: 'Nội dung & Game',
    description: 'Quản lý trò chơi, bài viết, sự kiện, thể loại và xuất bản',
    icon: Gamepad2,
    color: 'text-purple-600',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  finance: {
    label: 'Tài chính & Ví',
    description: 'Quản lý gói nạp, thanh toán, hoàn tiền và điều chỉnh số dư',
    icon: Wallet,
    color: 'text-emerald-600',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
};

export default function RoleDetailPage() {
  const params = useParams<{ roleId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const ability = useAdminAbility();
  const roleId = decodeURIComponent(params.roleId);

  const canView = ability.can('read', 'Role');

  const roleQuery = useQuery({
    queryKey: ['admin', 'access', 'role', roleId],
    queryFn: () => api.admin.access.role(roleId),
    enabled: canView,
    retry: false,
  });

  const catalogQuery = useQuery({
    queryKey: ['admin', 'access', 'permissions'],
    queryFn: api.admin.access.permissions,
    enabled: canView,
    retry: false,
  });

  const role = roleQuery.data;
  const isSystemRole = role?.isSystem ?? false;
  const isSuperAdminRole = role?.code === 'SUPER_ADMIN';

  // Permissions & editable state
  const canUpdate = ability.can('update', 'Role') && !isSystemRole;
  const canAssign = ability.can('assign-permission', 'Role') && !isSystemRole;
  const canDelete = ability.can('delete', 'Role') && !isSystemRole;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [permissionIds, setPermissionIds] = useState<string[]>([]);
  const [reason, setReason] = useState('');

  // Search & Filter state for permissions
  const [permSearch, setPermSearch] = useState('');
  const [permFilter, setPermFilter] = useState<PermissionFilter>('ALL');
  const [activeModuleFilter, setActiveModuleFilter] = useState<string>('ALL');

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  // Sync state when role changes
  useEffect(() => {
    if (!role) return;
    setName(role.name);
    setDescription(role.description ?? '');
    setIsActive(role.isActive);
    setPermissionIds(role.permissions.map((p) => p.id));
    setReason('');
  }, [role?.updatedAt]);

  // Check dirty state
  const isDirty = useMemo(() => {
    if (!role) return false;
    const initialPerms = new Set(role.permissions.map((p) => p.id));
    const currentPerms = new Set(permissionIds);
    const permsChanged =
      initialPerms.size !== currentPerms.size ||
      [...currentPerms].some((id) => !initialPerms.has(id));

    return (
      name !== role.name ||
      description !== (role.description ?? '') ||
      isActive !== role.isActive ||
      permsChanged
    );
  }, [role, name, description, isActive, permissionIds]);

  const handleReset = () => {
    if (!role) return;
    setName(role.name);
    setDescription(role.description ?? '');
    setIsActive(role.isActive);
    setPermissionIds(role.permissions.map((p) => p.id));
    setReason('');
  };

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'access', 'role', roleId] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'access', 'roles'] });
  };

  const updateMutation = useMutation({
    mutationFn: () =>
      api.admin.access.updateRole(roleId, {
        expectedUpdatedAt: role!.updatedAt,
        name: name.trim(),
        description: description.trim() || null,
        isActive,
        permissionIds,
        reason: reason.trim(),
      }),
    onSuccess: () => {
      setReason('');
      refresh();
      toast.success('Đã cập nhật cấu hình vai trò thành công!');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Không thể cập nhật vai trò.'));
      if ((error as { code?: string }).code === 'STALE_ROLE_UPDATE') {
        refresh();
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      api.admin.access.deleteRole(roleId, {
        expectedUpdatedAt: role!.updatedAt,
        reason: deleteReason.trim(),
      }),
    onSuccess: () => {
      setIsDeleteModalOpen(false);
      toast.success('Đã xóa vai trò thành công!');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'access', 'roles'] });
      router.push('/admin/access/roles');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Không thể xóa vai trò.'));
    },
  });

  // Modules & Permissions grouping
  const catalog = catalogQuery.data ?? [];

  const groupedPermissions = useMemo(() => {
    const map: Record<string, typeof catalog> = {};
    for (const p of catalog) {
      (map[p.module] ??= []).push(p);
    }
    return map;
  }, [catalog]);

  const moduleKeys = useMemo(() => Object.keys(groupedPermissions), [groupedPermissions]);

  // Determine if a permission is granted
  const isPermissionGranted = (permissionId: string) => {
    if (isSuperAdminRole) return true;
    return permissionIds.includes(permissionId);
  };

  // Toggle permission
  const togglePermission = (id: string) => {
    if (!canAssign) return;
    setPermissionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select all permissions in a module
  const selectModule = (ids: string[]) => {
    if (!canAssign) return;
    setPermissionIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  // Clear permissions in a module (excluding mandatory admin.access)
  const clearModule = (ids: string[]) => {
    if (!canAssign) return;
    setPermissionIds((prev) =>
      prev.filter((id) => {
        if (!ids.includes(id)) return true;
        const p = catalog.find((item) => item.id === id);
        return p?.code === 'admin.access';
      })
    );
  };

  // Filtered permission catalog for rendering
  const filteredModules = useMemo(() => {
    const result: Array<{
      module: string;
      config: (typeof MODULE_CONFIG)[string];
      permissions: typeof catalog;
      totalCount: number;
      grantedCount: number;
    }> = [];

    const query = permSearch.trim().toLowerCase();

    for (const [modKey, perms] of Object.entries(groupedPermissions)) {
      if (activeModuleFilter !== 'ALL' && activeModuleFilter !== modKey) {
        continue;
      }

      const totalCount = perms.length;
      const grantedCount = isSuperAdminRole
        ? totalCount
        : perms.filter((p) => permissionIds.includes(p.id)).length;

      const filteredPerms = perms.filter((p) => {
        const isGranted = isSuperAdminRole || permissionIds.includes(p.id);

        if (permFilter === 'GRANTED' && !isGranted) return false;
        if (permFilter === 'NOT_GRANTED' && isGranted) return false;

        if (query) {
          const matchName = p.name.toLowerCase().includes(query);
          const matchCode = p.code.toLowerCase().includes(query);
          const matchDesc = p.description?.toLowerCase().includes(query);
          if (!matchName && !matchCode && !matchDesc) return false;
        }

        return true;
      });

      if (filteredPerms.length > 0) {
        const config = MODULE_CONFIG[modKey] ?? {
          label: modKey.toUpperCase(),
          description: `Phân hệ ${modKey}`,
          icon: Layers,
          color: 'text-slate-700',
          badgeBg: 'bg-slate-50 text-slate-700 border-slate-200',
        };

        result.push({
          module: modKey,
          config,
          permissions: filteredPerms,
          totalCount,
          grantedCount,
        });
      }
    }

    return result;
  }, [
    groupedPermissions,
    activeModuleFilter,
    permSearch,
    permFilter,
    permissionIds,
    isSuperAdminRole,
    catalog,
  ]);

  // Overall granted permission count
  const totalCatalogCount = catalog.length;
  const totalGrantedCount = isSuperAdminRole ? totalCatalogCount : permissionIds.length;

  if (!canView) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center p-8 text-center">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Lock className="size-6" />
          </div>
          <h2 className="mt-4 text-base font-black text-slate-900">Không có quyền truy cập</h2>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            Bạn không có quyền xem thông tin chi tiết vai trò này.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => router.push('/admin/access/roles')}
          >
            Quay lại danh sách
          </Button>
        </div>
      </main>
    );
  }

  if (roleQuery.isLoading || catalogQuery.isLoading) {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!role) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center p-8 text-center">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertCircle className="size-6" />
          </div>
          <h2 className="mt-4 text-base font-black text-slate-900">Không tìm thấy vai trò</h2>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            Vai trò này không tồn tại hoặc đã bị xóa khỏi hệ thống.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => router.push('/admin/access/roles')}
          >
            Quay lại danh sách
          </Button>
        </div>
      </main>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Link
              href="/admin/access/roles"
              className="hover:text-slate-600 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="size-3.5" />
              <span>Quản lý vai trò</span>
            </Link>
            <span>/</span>
            <span className="text-[#00873E] font-medium">{role.name}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {role.name}
            </h1>
            <Badge variant="default" className="font-mono font-bold tracking-wide">
              {role.code}
            </Badge>
            {isSystemRole ? (
              <Badge
                variant="warning"
                className="gap-1 bg-amber-50 text-amber-700 border border-amber-200"
              >
                <Lock className="size-3" />
                Vai trò hệ thống (Chỉ đọc)
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200"
              >
                <ShieldCheck className="size-3" />
                Vai trò tùy chỉnh
              </Badge>
            )}
            {role.isActive ? (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="size-3" />
                Đang kích hoạt
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="size-3" />
                Tạm ngưng
              </Badge>
            )}
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/access/roles')}
            className="rounded-xl"
          >
            <ArrowLeft className="mr-1.5 size-4" />
            Danh sách vai trò
          </Button>

          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
              className="rounded-xl gap-1.5"
            >
              <Trash2 className="size-4" />
              Xóa vai trò
            </Button>
          )}
        </div>
      </div>

      {/* Role Protection / Type Notice Banner */}
      {isSystemRole ? (
        <div className="rounded-2xl border border-amber-200/80 bg-linear-to-r from-amber-50/90 to-amber-50/40 p-5 text-amber-900 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <ShieldAlert className="size-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-amber-900">
                {isSuperAdminRole
                  ? 'Vai trò Quản trị viên Tối cao (SUPER_ADMIN)'
                  : 'Vai trò Mặc định của Hệ thống (Chế độ xem - Chỉ đọc)'}
              </h3>
              <p className="text-xs text-amber-800/90 leading-relaxed">
                {isSuperAdminRole
                  ? 'SUPER_ADMIN sở hữu toàn quyền cao nhất (Super Admin Wildcard) trên mọi phân hệ và tính năng. Nhằm bảo đảm an ninh tuyệt đối, vai trò này không thể chỉnh sửa, gỡ quyền hoặc xóa bỏ.'
                  : `Vai trò "${role.name}" là vai trò mặc định được thiết lập sẵn trong mã nguồn. Bạn có thể xem chi tiết các quyền hạn được cấp dưới đây. Để đảm bảo an toàn vận hành, các quyền hạn này được cố định và không thể thay đổi.`}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 text-emerald-900 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Sparkles className="size-4 text-[#00873E] shrink-0" />
            <span>
              Đây là <b>vai trò tùy chỉnh</b>. Bạn có thể điều chỉnh tên, mô tả, bật/tắt hoạt động
              và cấp/hủy quyền linh hoạt.
            </span>
          </div>
          {isDirty && (
            <span className="shrink-0 font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              ● Có thay đổi chưa lưu
            </span>
          )}
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Mã hệ thống</span>
            <Lock className="size-4 text-slate-400" />
          </div>
          <div className="mt-2 text-sm font-mono font-black text-slate-900 truncate">
            {role.code}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">Định danh kỹ thuật</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Người dùng được gán</span>
            <Users className="size-4 text-blue-500" />
          </div>
          <div className="mt-2 text-lg font-black text-slate-900">
            {role.userCount}{' '}
            <span className="text-xs font-semibold text-slate-400">tài khoản</span>
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">Đang có hiệu lực</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Quyền hạn cấp phát</span>
            <ShieldCheck className="size-4 text-[#00873E]" />
          </div>
          <div className="mt-2 text-lg font-black text-slate-900">
            {isSuperAdminRole ? (
              <span className="text-[#00873E]">Toàn quyền</span>
            ) : (
              <>
                {totalGrantedCount}{' '}
                <span className="text-xs font-semibold text-slate-400">
                  / {totalCatalogCount} quyền
                </span>
              </>
            )}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">
            {isSuperAdminRole
              ? 'Tất cả phân hệ'
              : `${Math.round((totalGrantedCount / (totalCatalogCount || 1)) * 100)}% danh mục`}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Cập nhật lần cuối</span>
            <Clock className="size-4 text-slate-400" />
          </div>
          <div className="mt-2 text-xs font-bold text-slate-800">
            {formatDate(role.updatedAt)}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">Thời gian gần nhất</div>
        </div>
      </div>

      {/* Section 1: General Info Card */}
      <section className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Info className="size-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900">
                Thông tin chung vai trò
              </h2>
              <p className="text-xs text-slate-400">Định danh và trạng thái kích hoạt của vai trò</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Role Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Tên hiển thị <span className="text-rose-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canUpdate}
              placeholder="VD: Quản trị viên nội dung"
              className="rounded-xl"
            />
            {isSystemRole && (
              <p className="text-[11px] text-slate-400">
                Tên vai trò hệ thống được cố định, không thể chỉnh sửa.
              </p>
            )}
          </div>

          {/* Role Code */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Mã định danh hệ thống (Code)</label>
            <div className="relative">
              <Input
                value={role.code}
                disabled
                className="font-mono bg-slate-50 text-slate-600 rounded-xl pr-9 cursor-not-allowed"
              />
              <Lock className="absolute right-3 top-2.5 size-4 text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-400">
              Mã code dùng trong kiểm tra quyền hạn và logic phân quyền API.
            </p>
          </div>

          {/* Description */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Mô tả mục đích sử dụng</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canUpdate}
              placeholder="Mô tả quyền hạn và trách nhiệm của người dùng khi được gán vai trò này..."
              rows={2}
              className="rounded-xl resize-none"
            />
          </div>

          {/* Is Active Status */}
          <div className="sm:col-span-2 pt-1">
            <label className="inline-flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                disabled={!canUpdate}
                onChange={(e) => setIsActive(e.target.checked)}
                className="size-4.5 rounded border-slate-300 text-[#00873E] accent-[#00873E] focus:ring-[#00873E]/20"
              />
              <span className="text-xs font-bold text-slate-800">
                Kích hoạt vai trò này trong hệ thống
              </span>
              <span className="text-xs text-slate-400">
                (Nếu tắt, người dùng có vai trò này sẽ không nhận được các quyền hạn tương ứng)
              </span>
            </label>
          </div>
        </div>
      </section>

      {/* Section 2: Permission Matrix Card */}
      <section className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
        {/* Section Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-[#00873E]">
              <KeyRound className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  Danh sách quyền hạn (Permissions Matrix)
                </h2>
                <Badge variant="default" className="text-xs font-bold">
                  {isSuperAdminRole
                    ? 'Toàn bộ quyền'
                    : `${totalGrantedCount} / ${totalCatalogCount} đã cấp`}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isSystemRole
                  ? 'Xem danh sách chi tiết các quyền đã được kích hoạt cho vai trò hệ thống này.'
                  : 'Đánh dấu chọn các quyền muốn phân bổ cho vai trò.'}
              </p>
            </div>
          </div>

          {/* Quick toggle buttons for custom roles */}
          {canAssign && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPermissionIds(catalog.map((p) => p.id))}
                className="text-xs rounded-xl h-8"
              >
                Cấp tất cả ({totalCatalogCount})
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const adminAcc = catalog.find((p) => p.code === 'admin.access');
                  setPermissionIds(adminAcc ? [adminAcc.id] : []);
                }}
                className="text-xs rounded-xl h-8 text-slate-500 hover:text-rose-600"
              >
                Bỏ chọn tất cả
              </Button>
            </div>
          )}
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
          {/* Search Permission Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <Input
              value={permSearch}
              onChange={(e) => setPermSearch(e.target.value)}
              placeholder="Tìm kiếm quyền hạn (VD: Người dùng, Ticket, Nạp ví...)"
              className="pl-9 h-9 text-xs bg-white rounded-xl"
            />
            {permSearch && (
              <button
                type="button"
                onClick={() => setPermSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Filter Grant Status Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setPermFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                permFilter === 'ALL'
                  ? 'bg-[#00873E] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Tất cả ({totalCatalogCount})
            </button>
            <button
              type="button"
              onClick={() => setPermFilter('GRANTED')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                permFilter === 'GRANTED'
                  ? 'bg-[#00873E] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Đã cấp ({totalGrantedCount})
            </button>
            <button
              type="button"
              onClick={() => setPermFilter('NOT_GRANTED')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                permFilter === 'NOT_GRANTED'
                  ? 'bg-[#00873E] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Chưa cấp ({totalCatalogCount - totalGrantedCount})
            </button>
          </div>
        </div>

        {/* Module quick filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold shrink-0 mr-1">Phân hệ:</span>
          <button
            type="button"
            onClick={() => setActiveModuleFilter('ALL')}
            className={`shrink-0 px-2.5 py-1 rounded-lg font-bold border transition-colors ${
              activeModuleFilter === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Tất cả phân hệ
          </button>
          {moduleKeys.map((modKey) => {
            const config = MODULE_CONFIG[modKey] ?? { label: modKey };
            const count = groupedPermissions[modKey]?.length ?? 0;
            return (
              <button
                key={modKey}
                type="button"
                onClick={() => setActiveModuleFilter(modKey)}
                className={`shrink-0 px-2.5 py-1 rounded-lg font-bold border transition-colors ${
                  activeModuleFilter === modKey
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {config.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Permission Modules List */}
        {filteredModules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <Search className="mx-auto size-8 text-slate-300" />
            <p className="mt-2 text-xs font-bold text-slate-700">
              Không tìm thấy quyền hạn phù hợp với bộ lọc.
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Thử tìm kiếm với từ khóa khác hoặc chuyển sang tab &quot;Tất cả&quot;.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredModules.map(({ module: modKey, config, permissions, totalCount, grantedCount }) => {
              const Icon = config.icon;
              const allInModuleGranted = isSuperAdminRole || grantedCount === totalCount;
              const someInModuleGranted = grantedCount > 0 && grantedCount < totalCount;

              return (
                <div
                  key={modKey}
                  className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs"
                >
                  {/* Module Header */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-slate-50/75 p-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-8 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-xs ${config.color}`}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-slate-900">{config.label}</h3>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                              allInModuleGranted
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : someInModuleGranted
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {isSuperAdminRole
                              ? 'Toàn bộ quyền'
                              : `${grantedCount} / ${totalCount} quyền`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{config.description}</p>
                      </div>
                    </div>

                    {/* Module Fast Select/Deselect for custom roles */}
                    {canAssign && (
                      <div className="flex items-center gap-2 pl-11 sm:pl-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => selectModule(permissions.map((p) => p.id))}
                          className="h-7 text-xs rounded-lg px-2.5"
                        >
                          Chọn nhóm ({permissions.length})
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => clearModule(permissions.map((p) => p.id))}
                          className="h-7 text-xs rounded-lg px-2 text-slate-500 hover:text-rose-600"
                        >
                          Bỏ nhóm
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Permissions Cards Grid */}
                  <div className="p-4 grid gap-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {permissions.map((permission) => {
                      const isGranted = isPermissionGranted(permission.id);
                      const isMandatory = permission.code === 'admin.access';
                      const isDisabled = !canAssign || isMandatory || isSystemRole;

                      return (
                        <div
                          key={permission.id}
                          onClick={() => {
                            if (!isDisabled) {
                              togglePermission(permission.id);
                            }
                          }}
                          className={`group relative flex flex-col justify-between rounded-xl border p-3.5 transition-all ${
                            isGranted
                              ? 'border-emerald-200 bg-emerald-50/25 hover:border-emerald-300'
                              : 'border-slate-200/80 bg-white hover:border-slate-300'
                          } ${!isDisabled ? 'cursor-pointer hover:shadow-xs' : 'cursor-default'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 group-hover:text-[#00873E] transition-colors">
                                  {permission.name}
                                </span>
                                {isMandatory && (
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                                    Bắt buộc Admin
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Checkbox / Granted Badge */}
                            <div className="shrink-0 pt-0.5">
                              {isSystemRole ? (
                                isGranted ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded-full">
                                    <Check className="size-3" />
                                    {isSuperAdminRole ? 'Toàn quyền' : 'Đã cấp'}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                    Không cấp
                                  </span>
                                )
                              ) : (
                                <input
                                  type="checkbox"
                                  checked={isGranted}
                                  disabled={isDisabled}
                                  onChange={() => {
                                    /* handled by card container */
                                  }}
                                  className="size-4.5 rounded border-slate-300 text-[#00873E] accent-[#00873E] focus:ring-[#00873E]/20 cursor-pointer disabled:cursor-not-allowed"
                                />
                              )}
                            </div>
                          </div>

                          {permission.description && (
                            <p className="mt-2 text-[11px] text-slate-500 line-clamp-2">
                              {permission.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 3: Audit Reason & Save Bar (Custom Roles Only) */}
      {(canUpdate || canAssign) && (
        <section className="sticky bottom-4 z-20 rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 max-w-xl space-y-1">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>Lý do thay đổi cấu hình</span>
                <span className="text-rose-500">*</span>
                <span className="text-[11px] font-normal text-slate-400">
                  (Bắt buộc lưu Authorization Audit Log)
                </span>
              </label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập lý do thay đổi vai trò (tối thiểu 3 ký tự)..."
                className="h-9 text-xs rounded-xl bg-slate-50/70 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2.5 pt-1 sm:pt-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={!isDirty || updateMutation.isPending}
                className="rounded-xl h-9 text-xs gap-1"
              >
                <RotateCcw className="size-3.5" />
                Hoàn tác
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => updateMutation.mutate()}
                disabled={
                  !isDirty ||
                  reason.trim().length < 3 ||
                  name.trim().length < 2 ||
                  updateMutation.isPending
                }
                className="rounded-xl h-9 text-xs gap-1.5 bg-[#00873E] hover:bg-[#00873E]/90 text-white font-bold"
              >
                <Save className="size-3.5" />
                {updateMutation.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Delete Role Modal Dialog */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDeleteModalOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="flex size-9 items-center justify-center rounded-xl bg-rose-50">
                  <Trash2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Xóa vai trò</h3>
                  <p className="text-xs text-slate-500">Thao tác này không thể hoàn tác</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="size-4" />
              </button>
            </div>

            {role.userCount > 0 ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <p className="font-bold">Không thể xóa vai trò này!</p>
                  <p className="mt-1">
                    Hiện đang có <b>{role.userCount} người dùng</b> được gán vai trò này. Bạn phải
                    chuyển hoặc gỡ vai trò của những người dùng này trước khi xóa.
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="rounded-xl text-xs"
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Bạn có chắc chắn muốn xóa vĩnh viễn vai trò <b>{role.name}</b> (
                  <span className="font-mono">{role.code}</span>) không?
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Lý do xóa vai trò <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="Nhập lý do xóa để ghi vào nhật ký audit..."
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteModalOpen(false)}
                    disabled={deleteMutation.isPending}
                    className="rounded-xl text-xs"
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteReason.trim().length < 3 || deleteMutation.isPending}
                    className="rounded-xl text-xs font-bold"
                  >
                    {deleteMutation.isPending ? 'Đang xóa…' : 'Xác nhận xóa'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
