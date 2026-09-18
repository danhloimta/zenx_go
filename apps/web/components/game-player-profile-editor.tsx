'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Gender, GamePlayerProfile } from '@zenx-go/api-client';
import {
  AlertCircle,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  User,
  UserRound,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';

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
  const profile = useQuery({
    queryKey: ['game-admin', 'player-profile', gameId, userId],
    queryFn: () => api.gameAdmin.playerProfile(gameId, userId),
    retry: false,
  });
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
    mutationFn: () =>
      api.gameAdmin.updatePlayerProfile(gameId, userId, {
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
      toast.success('Đã cập nhật hồ sơ người chơi thành công');
      queryClient.setQueryData(['game-admin', 'player-profile', gameId, userId], next);
      void queryClient.invalidateQueries({ queryKey: ['game-admin', 'player', gameId, userId] });
      void queryClient.invalidateQueries({ queryKey: ['game-admin', 'players', gameId] });
      void queryClient.invalidateQueries({ queryKey: ['game-admin', 'dashboard', gameId] });
      void queryClient.invalidateQueries({ queryKey: ['game-admin', 'audit', gameId] });
    },
    onError: async (cause) => {
      const msg = getErrorMessage(
        cause,
        'Không thể cập nhật hồ sơ. Nội dung đang nhập vẫn được giữ lại.',
      );
      setError(msg);
      toast.error(msg);
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

  if (profile.isError && !form)
    return (
      <section className="rounded-2xl border border-rose-200/80 bg-rose-50/80 p-6 text-sm text-rose-700 shadow-2xs">
        <div className="flex items-center gap-2 font-bold text-rose-900">
          <AlertCircle className="size-4 shrink-0" />
          <span>Không thể tải hồ sơ đầy đủ của người chơi</span>
        </div>
        <p className="mt-1 text-xs text-rose-600">
          Có thể bạn chưa được phân quyền quản lý hồ sơ hoặc máy chủ đang gián đoạn.
        </p>
        <Button className="mt-3.5 h-8 text-xs font-semibold" size="sm" variant="outline" onClick={retryLoad}>
          Thử lại
        </Button>
      </section>
    );

  if (profile.isLoading || !form)
    return (
      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
        <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
          <Loader2 className="size-4 animate-spin text-[#00873E]" />
          <span>Đang tải thông tin hồ sơ tài khoản ZENX…</span>
        </div>
      </section>
    );

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-[#00873E]">
              <UserRound className="size-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Hồ sơ tài khoản ZENX</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Hồ sơ người dùng dùng chung cho tất cả các tựa game thuộc cổng ZENX. Lưu ý: Thay đổi username, email hoặc số điện thoại sẽ yêu cầu người chơi đăng nhập lại.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Nhóm 1: Định danh & Đăng nhập */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-slate-400" />
            <span>Thông tin đăng nhập & xác thực</span>
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tên đăng nhập (Username)" required>
              <Input
                value={form.username}
                onChange={(event) => {
                  setForm({ ...form, username: event.target.value });
                  setError(null);
                  setConflict(null);
                }}
                className="font-mono text-xs"
              />
            </Field>

            <div className="space-y-1.5">
              <Field label="Địa chỉ Email" required>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(event) => {
                      setForm({ ...form, email: event.target.value });
                      setError(null);
                      setConflict(null);
                    }}
                    className="pl-9 text-xs"
                  />
                </div>
              </Field>
              <Check
                label="Đã xác minh Email"
                checked={form.emailVerified}
                onChange={(emailVerified) => {
                  setForm({ ...form, emailVerified });
                  setConflict(null);
                }}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Field label="Số điện thoại">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                  <Input
                    value={form.phone}
                    onChange={(event) => {
                      setForm({ ...form, phone: event.target.value });
                      setError(null);
                      setConflict(null);
                    }}
                    placeholder="Chưa cập nhật số điện thoại"
                    className="pl-9 text-xs font-mono"
                  />
                </div>
              </Field>
              <Check
                label="Đã xác minh Số điện thoại"
                checked={form.phoneVerified}
                onChange={(phoneVerified) => {
                  setForm({ ...form, phoneVerified });
                  setConflict(null);
                }}
              />
            </div>
          </div>
        </div>

        {/* Nhóm 2: Thông tin cá nhân */}
        <div className="space-y-4 border-t border-slate-100 pt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <User className="size-3.5 text-slate-400" />
            <span>Thông tin cá nhân</span>
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Họ và tên">
              <Input
                value={form.fullName}
                onChange={(event) => {
                  setForm({ ...form, fullName: event.target.value });
                  setError(null);
                  setConflict(null);
                }}
                placeholder="Ví dụ: Nguyễn Văn A"
                className="text-xs"
              />
            </Field>

            <Field label="Ngày sinh">
              <Input
                type="date"
                value={form.dateOfBirth}
                onChange={(event) => {
                  setForm({ ...form, dateOfBirth: event.target.value });
                  setError(null);
                  setConflict(null);
                }}
                className="text-xs"
              />
            </Field>

            <Field label="Giới tính">
              <Select
                value={form.gender}
                onChange={(event) => {
                  setForm({ ...form, gender: event.target.value as Gender });
                  setError(null);
                  setConflict(null);
                }}
                className="text-xs"
              >
                <option value="UNSPECIFIED">Chưa xác định</option>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </Select>
            </Field>

            <Field label="Tỉnh / Thành phố">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                <Input
                  value={form.city}
                  onChange={(event) => {
                    setForm({ ...form, city: event.target.value });
                    setError(null);
                    setConflict(null);
                  }}
                  placeholder="Ví dụ: Hà Nội, TP.HCM..."
                  className="pl-9 text-xs"
                />
              </div>
            </Field>

            <Field label="Địa chỉ liên hệ" className="sm:col-span-2">
              <Input
                value={form.address}
                onChange={(event) => {
                  setForm({ ...form, address: event.target.value });
                  setError(null);
                  setConflict(null);
                }}
                placeholder="Số nhà, tên đường, phường/xã..."
                className="text-xs"
              />
            </Field>
          </div>
        </div>
      </div>

      {/* Conflict Banner */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-700 space-y-2">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertCircle className="size-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          {conflict && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={useServerProfile} className="h-7 text-xs">
                Khôi phục bản từ máy chủ
              </Button>
              <Button size="sm" variant="outline" onClick={keepDraftAndUseLatestVersion} className="h-7 text-xs">
                Giữ bản nháp và ghi đè
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
        <Button
          type="button"
          disabled={update.isPending}
          onClick={() => update.mutate()}
          className="h-9 px-4 text-xs font-bold gap-1.5 bg-[#00873E] hover:bg-[#007033] text-white shadow-xs"
        >
          {update.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Save className="size-3.5" />
          )}
          <span>{update.isPending ? 'Đang lưu…' : 'Lưu hồ sơ ZENX'}</span>
        </Button>
      </div>
    </section>
  );
}

function Field({
  label,
  children,
  required,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
        <span>{label}</span>
        {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 select-none cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-3.5 rounded border-slate-300 text-[#00873E] focus:ring-[#00873E]"
      />
      <span>{label}</span>
    </label>
  );
}
