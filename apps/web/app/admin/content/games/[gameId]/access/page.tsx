'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function GameAccessPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const client = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [redirectUri, setRedirectUri] = useState('');
  const admins = useQuery({ queryKey: ['admin', 'game-admins', gameId], queryFn: () => api.admin.gamesManagement.admins(gameId) });
  const roles = useQuery({ queryKey: ['admin', 'roles', 'game'], queryFn: () => api.admin.access.roles(true) });
  const users = useQuery({ queryKey: ['admin', 'users', 'game-assignment', search], queryFn: () => api.admin.users({ search, pageSize: 10 }), enabled: search.length >= 2 });
  const sso = useQuery({ queryKey: ['admin', 'sso-client', gameId], queryFn: () => api.admin.gamesManagement.ssoClient(gameId) });
  const assign = useMutation({ mutationFn: () => { const reason = window.prompt('Lý do cấp/thu hồi quyền:'); if (!reason || reason.trim().length < 3) return Promise.reject(new Error('Cần nhập lý do.')); return api.admin.gamesManagement.replaceAdmins(gameId, selectedUserId, { roleIds, reason }); }, onSuccess: () => { setSelectedUserId(''); setRoleIds([]); void client.invalidateQueries({ queryKey: ['admin', 'game-admins', gameId] }); } });
  const saveSso = useMutation({ mutationFn: () => api.admin.gamesManagement.updateSsoClient(gameId, { redirectUri, isActive: true }), onSuccess: () => void client.invalidateQueries({ queryKey: ['admin', 'sso-client', gameId] }) });
  const rotate = useMutation({ mutationFn: () => api.admin.gamesManagement.rotateSsoSecret(gameId), onSuccess: (value) => window.alert(`Client secret mới (chỉ hiện lần này):\n${value.clientSecret}`) });
  const gameRoles = (roles.data ?? []).filter((role) => ['GAME_ADMIN', 'GAME_CONTENT_MANAGER', 'GAME_PLAYER_MODERATOR'].includes(role.code));
  return <div className="mx-auto max-w-5xl space-y-6"><div className="flex items-center justify-between"><div><h1 className="text-2xl font-black">Admin & SSO game</h1><p className="mt-1 text-sm text-slate-500">Chỉ admin tổng có thể cấp quyền và quản lý SSO client.</p></div><Button asChild variant="outline"><Link href={`/admin/content/games/${gameId}`}>Quay lại game</Link></Button></div><Card><CardHeader><CardTitle>Ban quản trị game</CardTitle></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-2"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm username hoặc email" /><select className="rounded-lg border border-slate-200 px-3 text-sm" value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}><option value="">Chọn người dùng</option>{users.data?.items.map((user) => <option value={user.id} key={user.id}>{user.username} — {user.email}</option>)}</select></div><div className="mt-4 flex flex-wrap gap-3">{gameRoles.map((role) => <label key={role.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={roleIds.includes(role.id)} onChange={() => setRoleIds((previous) => previous.includes(role.id) ? previous.filter((id) => id !== role.id) : [...previous, role.id])} />{role.name}</label>)}</div><Button className="mt-4" disabled={!selectedUserId || assign.isPending} onClick={() => assign.mutate()}>Lưu quyền</Button><div className="mt-7 divide-y rounded-lg border">{admins.data?.map((entry) => <div key={entry.id} className="flex items-center justify-between p-3 text-sm"><span><b>{entry.user.username}</b> · {entry.role.name}</span><span className="text-slate-500">{new Date(entry.assignedAt).toLocaleString('vi-VN')}</span></div>)}</div></CardContent></Card><Card><CardHeader><CardTitle>Game SSO client</CardTitle></CardHeader><CardContent><p className="mb-4 text-sm text-slate-500">Callback URL phải khớp tuyệt đối với request authorize và exchange.</p><Input defaultValue={sso.data?.redirectUri ?? ''} onChange={(event) => setRedirectUri(event.target.value)} placeholder="https://game.example.com/sso/callback" /><div className="mt-4 flex gap-3"><Button disabled={!redirectUri || saveSso.isPending} onClick={() => saveSso.mutate()}>{sso.data ? 'Cập nhật & bật SSO' : 'Tạo & bật SSO'}</Button>{sso.data ? <Button variant="outline" disabled={rotate.isPending} onClick={() => rotate.mutate()}>Rotate secret</Button> : null}</div>{sso.data ? <p className="mt-4 text-xs text-slate-500">Client ID: <code>{sso.data.clientId}</code></p> : null}</CardContent></Card></div>;
}
