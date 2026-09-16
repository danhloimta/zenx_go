'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Gender, GamePlayerProfile } from '@zenx-go/api-client';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

type ProfileForm = {
  username: string;
  email: string;
  phone: string;
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  city: string;
  address: string;
  emailVerified: boolean;
  phoneVerified: boolean;
};

function toForm(value: GamePlayerProfile): ProfileForm {
  return {
    username: value.username,
    email: value.email,
    phone: value.phone ?? '',
    fullName: value.profile?.fullName ?? '',
    dateOfBirth: value.profile?.dateOfBirth?.slice(0, 10) ?? '',
    gender: value.profile?.gender ?? 'UNSPECIFIED',
    city: value.profile?.city ?? '',
    address: value.profile?.address ?? '',
    emailVerified: value.emailVerified,
    phoneVerified: value.phoneVerified,
  };
}

export function GamePlayerProfileEditor({ gameId, userId }: { gameId: string; userId: string }) {
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: ['game-admin', 'player-profile', gameId, userId], queryFn: () => api.gameAdmin.playerProfile(gameId, userId), retry: false });
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<GamePlayerProfile | null>(null);

  useEffect(() => {
    if (profile.data && version === null) {
      setForm(toForm(profile.data));
      setVersion(profile.data.updatedAt);
    }
  }, [profile.data, version]);

  const update = useMutation({
    mutationFn: () => api.gameAdmin.updatePlayerProfile(gameId, userId, {
      ...form!,
      phone: form!.phone.trim() || null,
      dateOfBirth: form!.dateOfBirth || null,
      city: form!.city.trim() || null,
      address: form!.address.trim() || null,
      expectedUpdatedAt: version ?? profile.data!.updatedAt,
    }),
    onSuccess: (next) => {
      setForm(toForm(next));
      setVersion(next.updatedAt);
      setError(null);
      setConflict(null);
      queryClient.setQueryData(['game-admin', 'player-profile', gameId, userId], next);
      void queryClient.invalidateQueries({ queryKey: ['game-admin', 'player', gameId, userId] });
      void queryClient.invalidateQueries({ queryKey: ['game-admin', 'players', gameId] });
      void queryClient.invalidateQueries({ queryKey: ['game-admin', 'dashboard', gameId] });
      void queryClient.invalidateQueries({ queryKey: ['game-admin', 'audit', gameId] });
    },
    onError: async (cause) => {
      setError(getErrorMessage(cause, 'Không thể cập nhật hồ sơ. Nội dung đang nhập vẫn được giữ lại.'));
      const result = await profile.refetch();
      if (result.isSuccess && result.data) setConflict(result.data);
    },
  });

  const useServerProfile = () => {
    if (!conflict) return;
    setForm(toForm(conflict));
    setVersion(conflict.updatedAt);
    setConflict(null);
    setError(null);
  };
  const keepDraftAndUseLatestVersion = () => {
    if (!conflict) return;
    setVersion(conflict.updatedAt);
    setConflict(null);
    setError(null);
  };
  const retryLoad = () => void profile.refetch();

  if (profile.isError && !form) return <section className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"><p>Không thể tải hồ sơ đầy đủ của player.</p><Button className="mt-3" size="sm" variant="outline" onClick={retryLoad}>Thử lại</Button></section>;
  if (profile.isLoading || !form) return <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Đang tải hồ sơ ZENX…</section>;

  return <section className="rounded-xl border border-slate-200 bg-white p-5">
    <div><h2 className="text-lg font-black">Hồ sơ ZENX</h2><p className="mt-1 text-sm text-slate-500">Các thay đổi áp dụng cho tài khoản ZENX ở mọi game. Đổi username, email hoặc số điện thoại sẽ thu hồi phiên đăng nhập hiện hữu.</p></div>
    <div className="mt-5 space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Tên đăng nhập"><Input value={form.username} onChange={(event) => { setForm({ ...form, username: event.target.value }); setError(null); setConflict(null); }} /></Field>
        <Field label="Email"><Input type="email" value={form.email} onChange={(event) => { setForm({ ...form, email: event.target.value }); setError(null); setConflict(null); }} /><Check label="Email đã xác minh" checked={form.emailVerified} onChange={(emailVerified) => { setForm({ ...form, emailVerified }); setConflict(null); }} /></Field>
        <Field label="Số điện thoại" className="md:col-span-2"><Input value={form.phone} onChange={(event) => { setForm({ ...form, phone: event.target.value }); setError(null); setConflict(null); }} placeholder="Chưa cập nhật số điện thoại" /><Check label="Số điện thoại đã xác minh" checked={form.phoneVerified} onChange={(phoneVerified) => { setForm({ ...form, phoneVerified }); setConflict(null); }} /></Field>
      </div>
      <div className="grid gap-4 border-t border-slate-100 pt-5 md:grid-cols-2">
        <Field label="Họ và tên"><Input value={form.fullName} onChange={(event) => { setForm({ ...form, fullName: event.target.value }); setError(null); setConflict(null); }} /></Field>
        <Field label="Ngày sinh"><Input type="date" value={form.dateOfBirth} onChange={(event) => { setForm({ ...form, dateOfBirth: event.target.value }); setError(null); setConflict(null); }} /></Field>
        <Field label="Giới tính"><Select value={form.gender} onChange={(event) => { setForm({ ...form, gender: event.target.value as Gender }); setError(null); setConflict(null); }}><option value="UNSPECIFIED">Chưa xác định</option><option value="MALE">Nam</option><option value="FEMALE">Nữ</option><option value="OTHER">Khác</option></Select></Field>
        <Field label="Tỉnh / thành phố"><Input value={form.city} onChange={(event) => { setForm({ ...form, city: event.target.value }); setError(null); setConflict(null); }} /></Field>
        <Field label="Địa chỉ" className="md:col-span-2"><Input value={form.address} onChange={(event) => { setForm({ ...form, address: event.target.value }); setError(null); setConflict(null); }} /></Field>
      </div>
    </div>
    {error ? <div className="mt-4 space-y-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"><p>{error}</p>{conflict ? <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={useServerProfile}>Khôi phục bản máy chủ</Button><Button size="sm" variant="outline" onClick={keepDraftAndUseLatestVersion}>Giữ bản nháp và ghi đè</Button></div> : null}</div> : null}
    <div className="mt-5 flex justify-end"><Button disabled={update.isPending} onClick={() => update.mutate()}>{update.isPending ? 'Đang lưu…' : 'Lưu hồ sơ ZENX'}</Button></div>
  </section>;
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`block space-y-1.5 ${className}`}><span className="text-xs font-bold text-slate-700">{label}</span>{children}</label>;
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-600"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />{label}</label>;
}
