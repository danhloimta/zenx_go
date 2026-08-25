'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  ChevronDown,
  Mail,
  Phone,
  Pencil,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { mediaUrl } from '@/lib/utils';
import { useAccount } from '@/hooks/use-account';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { GoogleIcon, FacebookIcon } from '@/components/icons';
import { toast } from 'sonner';

const schema = z.object({
  fullName: z.string().trim().min(2, 'Vui lòng nhập họ tên.'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'UNSPECIFIED']),
  city: z.string().optional(),
  address: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export default function ProfilePage() {
  const account = useAccount();

  if (account.isLoading)
    return (
      <div className="grid gap-6 lg:grid-cols-2 max-w-[1200px] mx-auto">
        <Skeleton className="h-[620px] rounded-2xl" />
        <Skeleton className="h-[620px] rounded-2xl" />
      </div>
    );

  if (account.isError || !account.data)
    return (
      <Alert>
        Không thể tải tài khoản. Vui lòng{' '}
        <a className="font-semibold underline" href="/auth/login">
          đăng nhập lại
        </a>
        .
      </Alert>
    );

  return <ProfileContent account={account.data} />;
}

function ProfileContent({
  account,
}: {
  account: NonNullable<ReturnType<typeof useAccount>['data']>;
}) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: account.profile.fullName ?? '',
      dateOfBirth: account.profile.dateOfBirth?.slice(0, 10) ?? '',
      gender: account.profile.gender ?? 'UNSPECIFIED',
      city: account.profile.city ?? '',
      address: account.profile.address ?? '',
    },
  });

  useEffect(() => {
    form.reset({
      fullName: account.profile.fullName ?? '',
      dateOfBirth: account.profile.dateOfBirth?.slice(0, 10) ?? '',
      gender: account.profile.gender ?? 'UNSPECIFIED',
      city: account.profile.city ?? '',
      address: account.profile.address ?? '',
    });
  }, [account, form]);

  const update = useMutation({
    mutationFn: api.account.update,
    onSuccess: () => {
      toast.success('Đã lưu thay đổi.');
      void queryClient.invalidateQueries({ queryKey: ['account', 'me'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const upload = useMutation({
    mutationFn: (file: File) => api.account.uploadAvatar(file),
    onSuccess: () => {
      toast.success('Đã cập nhật ảnh đại diện.');
      void queryClient.invalidateQueries({ queryKey: ['account', 'me'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const unlink = useMutation({
    mutationFn: api.social.unlink,
    onSuccess: () => {
      toast.success('Đã hủy liên kết.');
      void queryClient.invalidateQueries({ queryKey: ['account', 'me'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-10">
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Left Column: Thông tin cá nhân */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Thông tin cá nhân</h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Quản lý thông tin tài khoản và cập nhật thông tin cá nhân của bạn.
              </p>
            </div>
            <Button
              type="button"
              variant="zenx-outline"
              size="sm"
              className="gap-1.5 font-semibold text-xs rounded-lg"
              onClick={() => form.setFocus('fullName')}
            >
              <Pencil className="size-3.5" />
              Chỉnh sửa
            </Button>
          </div>

          {/* Avatar */}
          <div className="my-7 flex justify-center sm:justify-start">
            <div className="relative">
              <div className="flex size-24 items-center justify-center overflow-hidden rounded-full ring-4 ring-[#E8F7EC] bg-slate-100 text-slate-400">
                {mediaUrl(account.profile.avatarUrl) ? (
                  <img
                    src={mediaUrl(account.profile.avatarUrl)}
                    alt="Ảnh đại diện"
                    className="size-full object-cover"
                  />
                ) : (
                  <UserRound className="size-12 text-[#00873E]" />
                )}
              </div>
              <button
                type="button"
                className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full border-2 border-white bg-[#00873E] text-white shadow-sm transition hover:bg-[#007234]"
                onClick={() => fileRef.current?.click()}
                aria-label="Đổi ảnh đại diện"
              >
                <Camera className="size-4" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) upload.mutate(file);
                  event.target.value = '';
                }}
              />
            </div>
          </div>

          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => update.mutate(values))}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <ContactChange
                type="email"
                value={account.email}
                verifiedAt={account.emailVerifiedAt}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['account', 'me'] })}
              />
              <ContactChange
                type="phone"
                value={account.phone}
                verifiedAt={account.phoneVerifiedAt}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['account', 'me'] })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Họ và tên"
                htmlFor="profile-fullName"
                error={form.formState.errors.fullName?.message}
              >
                <Input
                  id="profile-fullName"
                  placeholder="Nhập họ và tên"
                  {...form.register('fullName')}
                />
              </FormField>
              <FormField label="Ngày sinh" htmlFor="profile-dob">
                <Input
                  id="profile-dob"
                  type="date"
                  className="cursor-pointer"
                  {...form.register('dateOfBirth')}
                />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Giới tính" htmlFor="profile-gender">
                <div className="relative">
                  <select
                    id="profile-gender"
                    className="flex h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none transition focus:border-[#00873E] focus:ring-2 focus:ring-[#00873E]/10"
                    {...form.register('gender')}
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                    <option value="UNSPECIFIED">Chưa xác định</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                </div>
              </FormField>
              <FormField label="Tỉnh / Thành phố" htmlFor="profile-city">
                <div className="relative">
                  <Input
                    id="profile-city"
                    placeholder="Thành phố Hồ Chí Minh"
                    {...form.register('city')}
                  />
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                </div>
              </FormField>
            </div>

            <FormField label="Địa chỉ (tùy chọn)" htmlFor="profile-address">
              <Input
                id="profile-address"
                placeholder="123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh"
                {...form.register('address')}
              />
            </FormField>

            <div className="pt-2">
              <Button
                type="submit"
                className="h-11 w-full text-sm font-semibold shadow-sm gap-2"
                disabled={update.isPending}
              >
                <Save className="size-4" />
                {update.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
              </Button>
            </div>
          </form>
        </div>

        {/* Right Column: Liên kết tài khoản */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm h-fit">
          <h2 className="text-lg font-bold text-slate-900">Liên kết tài khoản</h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Liên kết tài khoản mạng xã hội để đăng nhập nhanh và bảo mật hơn.
          </p>

          <div className="mt-6 space-y-3.5">
            {/* Google Provider */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <GoogleIcon className="size-6 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">Google</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {account.social.google
                    ? account.email ? `Đã liên kết với ${account.email}` : 'Đã liên kết'
                      : 'Chưa liên kết'}
                  </p>
                </div>
              </div>
              {account.social.google ? (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded-full bg-[#E8F7EC] px-2.5 py-0.5 text-[11px] font-bold text-[#00873E]">
                    Đã liên kết
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-xs h-8 px-3 text-slate-600 hover:text-red-600 hover:border-red-200"
                    onClick={() => {
                      if (window.confirm('Bạn có chắc muốn hủy liên kết Google không?')) unlink.mutate('google');
                    }}
                    disabled={unlink.isPending}
                  >
                    Hủy liên kết
                  </Button>
                </div>
              ) : (
                <Button asChild type="button" size="sm" variant="zenx-outline" className="text-xs h-8 px-4 font-semibold">
                  <a href={api.social.oauthUrl('google')}>Liên kết</a>
                </Button>
              )}
            </div>

            {/* Facebook Provider */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <FacebookIcon className="size-6 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">Facebook</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {account.social.facebook ? 'Đã liên kết' : 'Chưa liên kết'}
                  </p>
                </div>
              </div>
              <div>
                {account.social.facebook ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-xs h-8 px-3 text-slate-600 hover:text-red-600 hover:border-red-200"
                    onClick={() => {
                      if (window.confirm('Bạn có chắc muốn hủy liên kết Facebook không?')) unlink.mutate('facebook');
                    }}
                    disabled={unlink.isPending}
                  >
                    Hủy liên kết
                  </Button>
                ) : (
                  <Button asChild type="button" size="sm" variant="zenx-outline" className="text-xs h-8 px-4 font-semibold">
                    <a href={api.social.oauthUrl('facebook')}>Liên kết</a>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Account Protection Card */}
          <div className="mt-6 flex items-start gap-3 rounded-xl bg-[#E8F7EC] p-4 text-xs">
            <ShieldCheck className="size-5 shrink-0 text-[#00873E] mt-0.5" />
            <div>
              <p className="font-bold text-[#00873E]">Tài khoản của bạn được bảo vệ</p>
              <p className="mt-0.5 text-slate-600 text-[11px] leading-relaxed">
                Liên kết thêm phương thức đăng nhập để khôi phục tài khoản dễ dàng hơn khi cần thiết.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactChange({
  type,
  value,
  verifiedAt,
  onSuccess,
}: {
  type: 'email' | 'phone';
  value?: string | null;
  verifiedAt?: string | null;
  onSuccess: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [destination, setDestination] = useState(value ?? '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const channel = type === 'email' ? 'EMAIL' : 'SMS';
  const purpose = type === 'email' ? 'CHANGE_EMAIL' : 'CHANGE_PHONE';
  const label = type === 'email' ? 'Email' : 'Số điện thoại';
  const Icon = type === 'email' ? Mail : Phone;
  const verificationOnly = type === 'email' && !verifiedAt && Boolean(value);

  useEffect(() => {
    if (!editing) setDestination(value ?? '');
  }, [editing, value]);

  const sendOtp = useMutation({
    mutationFn: () => api.otp.send({ channel, purpose, destination }),
    onSuccess: () => {
      setError('');
      setSent(true);
    },
    onError: (requestError) => setError(getErrorMessage(requestError)),
  });

  const save = useMutation({
    mutationFn: async () => {
      const verification = await api.otp.verify({ channel, purpose, destination, code });
      return type === 'email'
        ? api.account.changeEmail({ newEmail: destination, verificationToken: verification.verificationToken })
        : api.account.changePhone({ newPhone: destination, verificationToken: verification.verificationToken });
    },
    onSuccess: () => {
      setEditing(false);
      setSent(false);
      setCode('');
      setError('');
      onSuccess();
    },
    onError: (requestError) => setError(getErrorMessage(requestError)),
  });

  const begin = () => {
    setEditing(true);
    setSent(false);
    setCode('');
    setError('');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={`profile-${type}`} className="text-xs font-semibold text-slate-700">
          {label}
        </label>
        {verifiedAt ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00873E]">
            <CheckCircle2 className="size-3" /> Đã xác thực
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-amber-600">Chưa xác thực</span>
        )}
      </div>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <Input
            id={`profile-${type}`}
            type={type === 'email' ? 'email' : 'tel'}
            value={destination}
            disabled={!editing || sent || verificationOnly || sendOtp.isPending || save.isPending}
            onChange={(event) => setDestination(event.target.value)}
            className="pl-10"
          />
        </div>
        {!editing ? (
          <Button type="button" size="sm" variant="outline" className="shrink-0 text-xs" onClick={begin}>
            {verificationOnly ? 'Xác thực' : 'Đổi'}
          </Button>
        ) : null}
      </div>
      {editing ? (
        <div className="space-y-2">
          {!sent ? (
            <Button
              type="button"
              size="sm"
              variant="zenx-outline"
              className="text-xs"
              onClick={() => {
                if (!destination.trim()) {
                  setError(type === 'email' ? 'Vui lòng nhập email mới.' : 'Vui lòng nhập số điện thoại mới.');
                  return;
                }
                sendOtp.mutate();
              }}
              disabled={sendOtp.isPending}
            >
              {sendOtp.isPending ? 'Đang gửi…' : 'Gửi mã xác thực'}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Input
                aria-label={`Mã xác thực ${label.toLowerCase()}`}
                inputMode="numeric"
                maxLength={6}
                placeholder="Nhập mã 6 số"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={save.isPending}
              />
              <Button
                type="button"
                size="sm"
                className="shrink-0 text-xs"
                onClick={() => save.mutate()}
                disabled={save.isPending || code.length !== 6}
              >
                {save.isPending ? 'Đang lưu…' : 'Xác nhận'}
              </Button>
            </div>
          )}
          <button
            type="button"
            className="text-xs font-semibold text-slate-500 underline hover:text-slate-800"
            onClick={() => {
              setEditing(false);
              setError('');
              setSent(false);
            }}
          >
            Hủy
          </button>
        </div>
      ) : null}
      {error ? <p className="text-xs text-red-600" role="alert">{error}</p> : null}
    </div>
  );
}
