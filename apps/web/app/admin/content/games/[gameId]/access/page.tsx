'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const GAME_ROLES = ['GAME_ADMIN', 'GAME_CONTENT_MANAGER', 'GAME_PLAYER_MODERATOR'];

export default function GameAccessPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const queryClient = useQueryClient();
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState('');
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [revokeConfirmationOpen, setRevokeConfirmationOpen] = useState(false);
  const [redirectUri, setRedirectUri] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const admins = useQuery({ queryKey: ['admin', 'game-admins', gameId], queryFn: () => api.admin.gamesManagement.admins(gameId) });
  const roles = useQuery({ queryKey: ['admin', 'roles', 'game'], queryFn: () => api.admin.access.roles(true) });
  const sso = useQuery({ queryKey: ['admin', 'sso-client', gameId], queryFn: () => api.admin.gamesManagement.ssoClient(gameId) });
  const users = useQuery({ queryKey: ['admin', 'users', 'game-assignment', search], queryFn: () => api.admin.users({ search, pageSize: 10 }), enabled: assignmentOpen && search.trim().length >= 2 });
  useEffect(() => { if (sso.data) { setRedirectUri(sso.data.redirectUri); setIsActive(sso.data.isActive); } }, [sso.data]);
  const closeAssignment = () => { setAssignmentOpen(false); setSearch(''); setUserId(''); setRoleIds([]); setReason(''); };
  const assignment = useMutation({ mutationFn: () => api.admin.gamesManagement.replaceAdmins(gameId, userId, { roleIds, reason: reason.trim() }), onSuccess: () => { closeAssignment(); void queryClient.invalidateQueries({ queryKey: ['admin', 'game-admins', gameId] }); } });
  const saveSso = useMutation({ mutationFn: () => api.admin.gamesManagement.updateSsoClient(gameId, { redirectUri: redirectUri.trim(), isActive }), onSuccess: (client) => { if (client.clientSecret) setSecret(client.clientSecret); void queryClient.invalidateQueries({ queryKey: ['admin', 'sso-client', gameId] }); } });
  const toggleSso = useMutation({ mutationFn: () => api.admin.gamesManagement.updateSsoClient(gameId, { redirectUri: sso.data!.redirectUri, isActive: !sso.data!.isActive }), onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'sso-client', gameId] }) });
  const rotate = useMutation({ mutationFn: () => api.admin.gamesManagement.rotateSsoSecret(gameId), onSuccess: (client) => setSecret(client.clientSecret ?? null) });
  const gameRoles = (roles.data ?? []).filter((role) => GAME_ROLES.includes(role.code));
  return <div className="mx-auto max-w-5xl space-y-6">
    <div className="flex items-center justify-between"><div><h1 className="text-2xl font-black">Admin & SSO game</h1><p className="mt-1 text-sm text-slate-500">Chỉ admin tổng có thể cấp quyền và quản lý SSO client.</p></div><Button asChild variant="outline"><Link href={`/admin/content/games/${gameId}`}>Quay lại game</Link></Button></div>
    <Card><CardHeader><CardTitle>Ban quản trị game</CardTitle></CardHeader><CardContent><Button onClick={() => setAssignmentOpen(true)}>Cấp hoặc thu hồi quyền</Button><div className="mt-5 divide-y rounded-lg border">{admins.data?.map((entry) => <div key={entry.id} className="flex items-center justify-between p-3 text-sm"><span><b>{entry.user.username}</b> · {entry.role.name}</span><span className="text-slate-500">{new Date(entry.assignedAt).toLocaleString('vi-VN')}</span></div>)}{admins.data?.length === 0 ? <p className="p-4 text-sm text-slate-500">Chưa có phân quyền theo game.</p> : null}</div></CardContent></Card>
    <Card><CardHeader><CardTitle>Game SSO client</CardTitle></CardHeader><CardContent><p className="mb-4 text-sm text-slate-500">Callback URL phải khớp tuyệt đối với request authorize và exchange.</p><Input value={redirectUri} onChange={(event) => setRedirectUri(event.target.value)} placeholder="https://game.example.com/sso/callback" /><div className="mt-4 flex flex-wrap gap-3"><Button disabled={!redirectUri.trim() || saveSso.isPending} onClick={() => saveSso.mutate()}>{sso.data ? 'Lưu callback URL' : 'Tạo SSO client'}</Button>{sso.data ? <><Button variant="outline" disabled={toggleSso.isPending} onClick={() => toggleSso.mutate()}>{sso.data.isActive ? 'Tắt SSO' : 'Bật SSO'}</Button><Button variant="outline" disabled={rotate.isPending} onClick={() => rotate.mutate()}>Rotate secret</Button></> : null}</div>{sso.data ? <p className="mt-4 text-xs text-slate-500">Client ID: <code>{sso.data.clientId}</code> · {sso.data.isActive ? 'Đang bật' : 'Đang tắt'}</p> : null}</CardContent></Card>
    {assignmentOpen ? <AssignmentDialog search={search} setSearch={setSearch} userId={userId} setUserId={setUserId} roleIds={roleIds} setRoleIds={setRoleIds} roles={gameRoles} users={users.data?.items ?? []} reason={reason} setReason={setReason} pending={assignment.isPending} error={assignment.isError} onClose={closeAssignment} onSave={() => roleIds.length === 0 ? setRevokeConfirmationOpen(true) : assignment.mutate()} /> : null}
    {revokeConfirmationOpen ? <RevokeConfirmation pending={assignment.isPending} onCancel={() => setRevokeConfirmationOpen(false)} onConfirm={() => { setRevokeConfirmationOpen(false); assignment.mutate(); }} /> : null}
    {secret ? <SecretDialog secret={secret} onClose={() => setSecret(null)} /> : null}
  </div>;
}

function RevokeConfirmation({ pending, onCancel, onConfirm }: { pending: boolean; onCancel: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-label="Xác nhận thu hồi quyền"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-lg font-black">Thu hồi toàn bộ quyền?</h2><p className="mt-2 text-sm text-slate-600">Người dùng sẽ mất mọi game role tại game này. Bạn cần xác nhận trước khi lưu thay đổi.</p><div className="mt-6 flex justify-end gap-3"><Button variant="outline" disabled={pending} onClick={onCancel}>Hủy</Button><Button disabled={pending} onClick={onConfirm}>Xác nhận thu hồi</Button></div></div></div>;
}

function AssignmentDialog(props: { search: string; setSearch: (value: string) => void; userId: string; setUserId: (value: string) => void; roleIds: string[]; setRoleIds: (value: string[]) => void; roles: Array<{ id: string; name: string }>; users: Array<{ id: string; username: string; email: string }>; reason: string; setReason: (value: string) => void; pending: boolean; error: boolean; onClose: () => void; onSave: () => void }) {
  const canSave = Boolean(props.userId && props.reason.trim().length >= 3 && !props.pending);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-lg font-black">Cấp hoặc thu hồi quyền game</h2><p className="mt-1 text-sm text-slate-500">Bỏ chọn tất cả role để thu hồi mọi quyền; thao tác này cần lý do.</p><div className="mt-5 space-y-3"><Input value={props.search} onChange={(event) => props.setSearch(event.target.value)} placeholder="Tìm username hoặc email (từ 2 ký tự)" /><select className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={props.userId} onChange={(event) => props.setUserId(event.target.value)}><option value="">Chọn người dùng</option>{props.users.map((user) => <option value={user.id} key={user.id}>{user.username} — {user.email}</option>)}</select><div className="flex flex-wrap gap-3">{props.roles.map((role) => <label key={role.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={props.roleIds.includes(role.id)} onChange={() => props.setRoleIds(props.roleIds.includes(role.id) ? props.roleIds.filter((id) => id !== role.id) : [...props.roleIds, role.id])} />{role.name}</label>)}</div><Input value={props.reason} onChange={(event) => props.setReason(event.target.value)} placeholder="Lý do (ít nhất 3 ký tự)" /></div>{props.error ? <p className="mt-3 text-sm text-red-600">Không thể lưu phân quyền.</p> : null}<div className="mt-6 flex justify-end gap-3"><Button variant="outline" onClick={props.onClose}>Hủy</Button><Button disabled={!canSave} onClick={props.onSave}>{props.roleIds.length === 0 ? 'Xác nhận thu hồi tất cả' : 'Lưu quyền'}</Button></div></div></div>;
}

function SecretDialog({ secret, onClose }: { secret: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-lg font-black">Client secret mới</h2><p className="mt-2 text-sm text-amber-700">Sao chép và lưu secret ngay. Secret này sẽ không hiển thị lại sau khi đóng.</p><code className="mt-4 block break-all rounded-lg bg-slate-950 p-3 text-sm text-slate-100">{secret}</code><div className="mt-5 flex justify-end gap-3"><Button variant="outline" onClick={async () => { await navigator.clipboard.writeText(secret); setCopied(true); }}>{copied ? 'Đã sao chép' : 'Sao chép'}</Button><Button onClick={onClose}>Tôi đã lưu secret</Button></div></div></div>;
}
