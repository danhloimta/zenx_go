'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/errors';
import { toast } from 'sonner';

export default function RoleDetailPage() {
  const params = useParams<{ roleId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const roleId = decodeURIComponent(params.roleId);
  const role = useQuery({ queryKey: ['admin', 'access', 'role', roleId], queryFn: () => api.admin.access.role(roleId), retry: false });
  const permissions = useQuery({ queryKey: ['admin', 'access', 'permissions'], queryFn: api.admin.access.permissions, retry: false });
  const save = useMutation({
    mutationFn: (permissionIds: string[]) => api.admin.access.replacePermissions(roleId, { expectedUpdatedAt: role.data!.updatedAt, permissionIds }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['admin', 'access'] }); toast.success('Đã cập nhật permission; phiên đăng nhập liên quan đã được thu hồi.'); },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  if (role.isLoading || permissions.isLoading) return <main className="p-8 text-sm text-slate-500">Đang tải…</main>;
  if (!role.data) return <main className="p-8 text-sm text-slate-500">Không tìm thấy role.</main>;
  const selected = new Set(role.data.permissions.map((permission) => permission.id));
  const toggle = (permissionId: string) => {
    if (selected.has(permissionId)) selected.delete(permissionId); else selected.add(permissionId);
    save.mutate([...selected]);
  };
  return <main className="mx-auto max-w-5xl space-y-6 p-6"><div><Button variant="outline" onClick={() => router.push('/admin/access/roles')}>← Danh sách role</Button><h1 className="mt-4 text-2xl font-black">{role.data.name}</h1><p className="text-sm text-slate-500">{role.data.code} · {role.data.userCount} user</p></div>{role.data.isSystem ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Role hệ thống không thể sửa permission. SUPER_ADMIN luôn toàn quyền.</p> : <section className="rounded-2xl border bg-white p-5"><h2 className="font-bold">Permission matrix</h2><p className="mb-4 text-sm text-slate-500">Chọn permission để cấp cho role. Mỗi lần chọn sẽ lưu và vô hiệu hóa session liên quan.</p><div className="grid gap-2 sm:grid-cols-2">{permissions.data?.map((permission) => <label key={permission.id} className="flex gap-3 rounded-lg border p-3 text-sm"><input type="checkbox" checked={selected.has(permission.id)} disabled={save.isPending} onChange={() => toggle(permission.id)} /><span><b>{permission.name}</b><br /><small className="text-slate-500">{permission.code}</small></span></label>)}</div></section>}</main>;
}
