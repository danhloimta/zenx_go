'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminAbility } from '@/lib/admin-ability';
import { getErrorMessage } from '@/lib/errors';
import { toast } from 'sonner';

export default function RoleDetailPage() {
  const params = useParams<{ roleId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const ability = useAdminAbility();
  const roleId = decodeURIComponent(params.roleId);
  const role = useQuery({ queryKey: ['admin', 'access', 'role', roleId], queryFn: () => api.admin.access.role(roleId), enabled: ability.can('read', 'Role'), retry: false });
  const catalog = useQuery({ queryKey: ['admin', 'access', 'permissions'], queryFn: api.admin.access.permissions, enabled: ability.can('read', 'Role'), retry: false });
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [permissionIds, setPermissionIds] = useState<string[]>([]);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!role.data) return;
    setName(role.data.name);
    setDescription(role.data.description ?? '');
    setIsActive(role.data.isActive);
    setPermissionIds(role.data.permissions.map((permission) => permission.id));
  }, [role.data?.updatedAt]);

  const grouped = useMemo(() => Object.entries((catalog.data ?? []).reduce<Record<string, NonNullable<typeof catalog.data>>>((groups, permission) => {
    (groups[permission.module] ??= []).push(permission);
    return groups;
  }, {})), [catalog.data]);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['admin', 'access'] });
  const update = useMutation({
    mutationFn: () => api.admin.access.updateRole(roleId, { expectedUpdatedAt: role.data!.updatedAt, name: name.trim(), description: description.trim() || null, isActive, permissionIds, reason: reason.trim() }),
    onSuccess: () => { setReason(''); refresh(); toast.success('Đã cập nhật role.'); },
    onError: (error) => { toast.error(getErrorMessage(error)); if ((error as { code?: string }).code === 'STALE_ROLE_UPDATE') refresh(); },
  });
  const remove = useMutation({
    mutationFn: () => api.admin.access.deleteRole(roleId, { expectedUpdatedAt: role.data!.updatedAt, reason: reason.trim() }),
    onSuccess: () => { toast.success('Đã xóa role.'); router.push('/admin/access/roles'); },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  if (!ability.can('read', 'Role')) return <main className="p-8 text-sm text-slate-500">Bạn không có quyền xem role.</main>;
  if (role.isLoading || catalog.isLoading) return <main className="p-8 text-sm text-slate-500">Đang tải…</main>;
  if (!role.data) return <main className="p-8 text-sm text-slate-500">Không tìm thấy role.</main>;
  const canUpdate = ability.can('update', 'Role') && !role.data.isSystem;
  const canAssign = ability.can('assign-permission', 'Role') && !role.data.isSystem;
  const canDelete = ability.can('delete', 'Role') && !role.data.isSystem;
  const toggle = (id: string) => setPermissionIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const selectModule = (ids: string[]) => setPermissionIds((current) => [...new Set([...current, ...ids])]);
  const clearModule = (ids: string[]) => setPermissionIds((current) => current.filter((id) => !ids.includes(id)));
  return <main className="mx-auto max-w-5xl space-y-6 p-6"><div className="flex items-start justify-between gap-4"><div><Button variant="outline" onClick={() => router.push('/admin/access/roles')}>← Danh sách role</Button><h1 className="mt-4 text-2xl font-black">{role.data.name}</h1><p className="text-sm text-slate-500">{role.data.code} · {role.data.userCount} user bị ảnh hưởng</p></div>{canDelete ? <Button variant="destructive" onClick={() => remove.mutate()} disabled={remove.isPending || role.data.userCount > 0 || !reason.trim()}>Xóa role</Button> : null}</div>{role.data.isSystem ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Role hệ thống chỉ đọc. SUPER_ADMIN luôn toàn quyền.</p> : <><section className="rounded-2xl border bg-white p-5"><h2 className="font-bold">Thông tin role</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><Input value={name} onChange={(event) => setName(event.target.value)} disabled={!canUpdate} placeholder="Tên role" /><Input value={description} onChange={(event) => setDescription(event.target.value)} disabled={!canUpdate} placeholder="Mô tả" /></div><label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} disabled={!canUpdate} onChange={(event) => setIsActive(event.target.checked)} /> Đang hoạt động</label></section><section className="rounded-2xl border bg-white p-5"><h2 className="font-bold">Permission matrix</h2><p className="mt-1 text-sm text-slate-500">Chọn quyền trong draft rồi lưu một lần.</p>{grouped.map(([module, permissions]) => <div key={module} className="mt-5"><div className="mb-2 flex items-center justify-between"><h3 className="font-semibold capitalize">{module}</h3>{canAssign ? <span className="space-x-2"><Button size="sm" variant="outline" onClick={() => selectModule(permissions.map((permission) => permission.id))}>Chọn nhóm</Button><Button size="sm" variant="ghost" onClick={() => clearModule(permissions.filter((permission) => permission.code !== 'admin.access').map((permission) => permission.id))}>Bỏ nhóm</Button></span> : null}</div><div className="grid gap-2 sm:grid-cols-2">{permissions.map((permission) => { const locked = permission.code === 'admin.access'; return <label key={permission.id} className="flex gap-3 rounded-lg border p-3 text-sm"><input type="checkbox" checked={permissionIds.includes(permission.id)} disabled={!canAssign || locked} onChange={() => toggle(permission.id)} /><span><b>{permission.name}</b><br /><small className="text-slate-500">{permission.code}{locked ? ' · bắt buộc' : ''}</small></span></label>; })}</div></div>)}</section>{(canUpdate || canAssign || canDelete) ? <section className="flex flex-wrap gap-3 rounded-2xl border bg-white p-5"><Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Lý do thay đổi hoặc xóa role" className="max-w-md" /><Button onClick={() => update.mutate()} disabled={!(canUpdate || canAssign) || !reason.trim() || update.isPending}>{update.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}</Button></section> : null}</>}</main>;
}
