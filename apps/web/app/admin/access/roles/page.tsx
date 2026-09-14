'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getErrorMessage } from '@/lib/errors';
import { toast } from 'sonner';
import { useAdminAbility } from '@/lib/admin-ability';

export default function RolesPage() {
  const ability = useAdminAbility();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const roles = useQuery({ queryKey: ['admin', 'access', 'roles'], queryFn: () => api.admin.access.roles(), retry: false });
  const permissions = useQuery({ queryKey: ['admin', 'access', 'permissions'], queryFn: api.admin.access.permissions, retry: false });
  const create = useMutation({
    mutationFn: () => api.admin.access.createRole({ code: code.trim().toUpperCase(), name: name.trim() }),
    onSuccess: () => {
      setCode('');
      setName('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'access', 'roles'] });
      toast.success('Đã tạo role.');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  if (!ability.can('read', 'Role')) return <main className="p-8 text-sm text-slate-500">Bạn không có quyền quản lý role.</main>;
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <div><h1 className="text-2xl font-black text-slate-900">Vai trò & quyền</h1><p className="mt-1 text-sm text-slate-500">Permission được cấp qua role. Super Admin luôn có toàn quyền.</p></div>
      <form className="flex flex-wrap gap-3 rounded-2xl border bg-white p-4" onSubmit={(event) => { event.preventDefault(); create.mutate(); }}>
        <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Mã role, ví dụ CONTENT_EDITOR" className="max-w-xs" required />
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Tên role" className="max-w-xs" required />
        {ability.can('create', 'Role') ? <Button type="submit" disabled={create.isPending}>{create.isPending ? 'Đang tạo…' : 'Tạo role'}</Button> : null}
      </form>
      <section className="rounded-2xl border bg-white"><div className="border-b p-4 font-bold">Danh sách role</div><div className="divide-y">{roles.data?.map((role) => <div key={role.id} className="flex items-center justify-between p-4"><div><p className="font-semibold">{role.name} {role.isSystem ? <span className="ml-2 text-xs text-emerald-700">Hệ thống</span> : null}</p><p className="text-xs text-slate-500">{role.code} · {role.userCount} user · {role.permissions.length}{role.code === 'SUPER_ADMIN' ? ' + toàn quyền' : ''} permission</p></div><Link href={`/admin/access/roles/${role.id}`} className="text-xs font-semibold text-[#00873E]">Cấu hình</Link></div>)}</div></section>
      <section className="rounded-2xl border bg-white p-4"><h2 className="font-bold">Permission catalog ({permissions.data?.length ?? 0})</h2><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{permissions.data?.map((permission) => <div key={permission.id} className="rounded border p-2 text-xs"><p className="font-semibold">{permission.name}</p><p className="text-slate-500">{permission.code}</p></div>)}</div></section>
    </main>
  );
}
