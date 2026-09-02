'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronDown,
  Home,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  User,
  UserRound,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { cn, mediaUrl } from '@/lib/utils';
import { useAccount } from '@/hooks/use-account';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { GoogleIcon, FacebookIcon } from '@/components/icons';
import { toast } from 'sonner';
import { ApiError } from '@zenx-go/api-client';

const schema = z.object({
  fullName: z.string().trim().min(2, 'Vui lòng nhập họ tên ít nhất 2 ký tự.'),
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
      <div className="max-w-[1200px] mx-auto space-y-6 pb-10">
        <Skeleton className="h-32 rounded-3xl" />
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Skeleton className="h-[560px] rounded-2xl" />
          <Skeleton className="h-[440px] rounded-2xl" />
        </div>
      </div>
    );

  if (account.isError || !account.data)
    return (
      <div className="max-w-[1200px] mx-auto py-10">
        <Alert>
          Không thể tải tài khoản. Vui lòng{' '}
          <a className="font-semibold underline" href="/auth/login">
            đăng nhập lại
          </a>
          .
        </Alert>
      </div>
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
    // Do not overwrite edits while an account refetch (for example after a
    // cross-tab focus) delivers a fresh object identity.
    if (form.formState.isDirty) return;
    form.reset({
      fullName: account.profile.fullName ?? '',
      dateOfBirth: account.profile.dateOfBirth?.slice(0, 10) ?? '',
      gender: account.profile.gender ?? 'UNSPECIFIED',
      city: account.profile.city ?? '',
      address: account.profile.address ?? '',
    });
  }, [account, form, form.formState.isDirty]);

  const update = useMutation({
    mutationFn: api.account.update,
    onSuccess: () => {
      toast.success('Đã lưu thay đổi thông tin cá nhân.');
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
      toast.success('Đã hủy liên kết tài khoản.');
      void queryClient.invalidateQueries({ queryKey: ['account', 'me'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const isFormDirty = form.formState.isDirty;

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-12">
      {/* 1. Header Banner & Profile Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-r from-white via-slate-50/50 to-[#F0FAF2] p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Avatar with Camera Trigger */}
            <div className="relative group shrink-0">
              <div className="relative flex size-20 sm:size-24 items-center justify-center overflow-hidden rounded-full ring-4 ring-[#E8F7EC] bg-slate-100 text-slate-400 shadow-sm">
                {mediaUrl(account.profile.avatarUrl) ? (
                  <img
                    src={mediaUrl(account.profile.avatarUrl)}
                    alt="Ảnh đại diện"
                    className="size-full object-cover"
                  />
                ) : (
                  <UserRound className="size-10 sm:size-12 text-[#00873E]" />
                )}
                {upload.isPending && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <RefreshCw className="size-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <button
                type="button"
                className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full border-2 border-white bg-[#00873E] text-white shadow-md transition-transform hover:scale-105 hover:bg-[#007234]"
                onClick={() => fileRef.current?.click()}
                disabled={upload.isPending}
                aria-label="Đổi ảnh đại diện"
                title="Thay đổi ảnh đại diện"
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

            {/* Profile Summary Details */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {account.profile.fullName || account.username || 'Hồ sơ cá nhân'}
                </h1>
                <span className="inline-flex items-center rounded-full bg-[#E8F7EC] px-2.5 py-0.5 text-xs font-bold text-[#00873E]">
                  @{account.username}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                <span>ID: <code className="font-mono text-slate-700">{account.id.slice(0, 12)}...</code></span>
                <span>•</span>
                <span>Thành viên chính thức</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Ảnh đại diện hỗ trợ JPG, PNG, WebP (tối đa 2MB).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <Button
              type="button"
              variant="zenx-outline"
              size="sm"
              className="gap-1.5 font-semibold text-xs rounded-xl h-10 px-4"
              onClick={() => form.setFocus('fullName')}
            >
              <Pencil className="size-3.5" />
              Chỉnh sửa nhanh
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Main 2-Column Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Left Column: Form thông tin cá nhân & Liên hệ */}
        <div className="space-y-6">
          {/* Section: Email & Phone Contact Info */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-7 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="size-5 text-[#00873E]" />
                Thông tin liên hệ & xác thực
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Email và số điện thoại dùng để nhận mã OTP, bảo mật và khôi phục tài khoản.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-1">
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
          </div>

          {/* Section: Chi tiết thông tin cá nhân */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-7 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <User className="size-5 text-[#00873E]" />
                  Thông tin cá nhân
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Cập nhật các thông tin cơ bản giúp hoàn thiện hồ sơ của bạn.
                </p>
              </div>

              {isFormDirty && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-full animate-pulse">
                  <AlertCircle className="size-3" />
                  Chưa lưu thay đổi
                </span>
              )}
            </div>

            <form
              className="space-y-4"
              onSubmit={form.handleSubmit((values) => update.mutate(values))}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Họ và tên"
                  htmlFor="profile-fullName"
                  required
                  error={form.formState.errors.fullName?.message}
                >
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="profile-fullName"
                      placeholder="Nhập họ và tên đầy đủ"
                      className="pl-10"
                      {...form.register('fullName')}
                    />
                  </div>
                </FormField>

                <FormField label="Ngày sinh" htmlFor="profile-dob">
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="profile-dob"
                      type="date"
                      className="pl-10 cursor-pointer"
                      {...form.register('dateOfBirth')}
                    />
                  </div>
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
                    <MapPin className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="profile-city"
                      placeholder="VD: TP. Hồ Chí Minh"
                      className="pl-10"
                      {...form.register('city')}
                    />
                  </div>
                </FormField>
              </div>

              <FormField label="Địa chỉ cụ thể (tùy chọn)" htmlFor="profile-address">
                <div className="relative">
                  <Home className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="profile-address"
                    placeholder="VD: 123 Đường Nguyễn Huệ, Quận 1"
                    className="pl-10"
                    {...form.register('address')}
                  />
                </div>
              </FormField>

              <div className="pt-3 flex items-center gap-3">
                <Button
                  type="submit"
                  className="h-11 flex-1 text-sm font-semibold shadow-sm gap-2"
                  disabled={update.isPending || !isFormDirty}
                >
                  <Save className="size-4" />
                  {update.isPending ? 'Đang lưu…' : isFormDirty ? 'Lưu thay đổi' : 'Đã cập nhật mới nhất'}
                </Button>

                {isFormDirty && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 px-4 text-xs font-semibold gap-1.5"
                    onClick={() => form.reset()}
                    disabled={update.isPending}
                  >
                    <RotateCcw className="size-3.5" />
                    Hoàn tác
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Liên kết tài khoản & Bảo mật */}
        <div className="space-y-6">
          {/* Card: Liên kết mạng xã hội */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-7 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="size-5 text-[#00873E]" />
              Liên kết tài khoản
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Liên kết các mạng xã hội giúp đăng nhập nhanh 1 chạm và an toàn.
            </p>

            <div className="mt-5 space-y-3">
              {/* Google Provider */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200/90 p-4 transition hover:border-slate-300">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 shrink-0">
                    <GoogleIcon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">Google</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {account.social.google
                        ? account.email
                          ? `Đã liên kết với ${account.email}`
                          : 'Đã liên kết tài khoản'
                        : 'Chưa liên kết'}
                    </p>
                  </div>
                </div>
                {account.social.google ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:inline-flex rounded-full bg-[#E8F7EC] px-2.5 py-0.5 text-[11px] font-bold text-[#00873E]">
                      Đã kết nối
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 px-3 text-slate-600 hover:text-red-600 hover:border-red-200"
                      onClick={() => {
                        if (window.confirm('Bạn có chắc muốn hủy liên kết Google không?'))
                          unlink.mutate('google');
                      }}
                      disabled={unlink.isPending}
                    >
                      Hủy
                    </Button>
                  </div>
                ) : (
                  <Button
                    asChild
                    type="button"
                    size="sm"
                    variant="zenx-outline"
                    className="text-xs h-8 px-4 font-semibold"
                  >
                    <a href={api.social.oauthUrl('google')}>Liên kết</a>
                  </Button>
                )}
              </div>

              {/* Facebook Provider */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200/90 p-4 transition hover:border-slate-300">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 shrink-0">
                    <FacebookIcon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">Facebook</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {account.social.facebook ? 'Đã liên kết tài khoản' : 'Chưa liên kết'}
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
                        if (window.confirm('Bạn có chắc muốn hủy liên kết Facebook không?'))
                          unlink.mutate('facebook');
                      }}
                      disabled={unlink.isPending}
                    >
                      Hủy
                    </Button>
                  ) : (
                    <Button
                      asChild
                      type="button"
                      size="sm"
                      variant="zenx-outline"
                      className="text-xs h-8 px-4 font-semibold"
                    >
                      <a href={api.social.oauthUrl('facebook')}>Liên kết</a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card: Bảo mật & Đổi mật khẩu shortcut */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="size-5 text-[#00873E]" />
                  Mật khẩu & Đăng nhập
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {account.hasPassword
                    ? 'Bạn đã thiết lập mật khẩu cho tài khoản này.'
                    : 'Chưa đặt mật khẩu đăng nhập trực tiếp.'}
                </p>
              </div>
              <Button
                asChild
                size="sm"
                variant="zenx-outline"
                className="gap-1.5 font-semibold text-xs rounded-xl h-9 px-3.5 shrink-0"
              >
                <Link href="/account/change-password">
                  <KeyRound className="size-3.5" />
                  {account.hasPassword ? 'Đổi mật khẩu' : 'Tạo mật khẩu'}
                </Link>
              </Button>
            </div>

            {/* Security Checklist summary */}
            <div className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-4 space-y-2.5 text-xs">
              <p className="font-bold text-slate-800 text-xs">Mức độ an toàn tài khoản:</p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-2">
                    <Mail className="size-3.5 text-slate-400" />
                    Xác thực Email
                  </span>
                  {account.emailVerifiedAt ? (
                    <span className="font-semibold text-[#00873E] flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> Đã xác thực
                    </span>
                  ) : (
                    <span className="font-medium text-amber-600">Chưa xác thực</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-2">
                    <Phone className="size-3.5 text-slate-400" />
                    Xác thực Số điện thoại
                  </span>
                  {account.phoneVerifiedAt ? (
                    <span className="font-semibold text-[#00873E] flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> Đã xác thực
                    </span>
                  ) : (
                    <span className="font-medium text-amber-600">Chưa xác thực</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-2">
                    <Lock className="size-3.5 text-slate-400" />
                    Mật khẩu tài khoản
                  </span>
                  {account.hasPassword ? (
                    <span className="font-semibold text-[#00873E] flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> Đã thiết lập
                    </span>
                  ) : (
                    <span className="font-medium text-slate-400">Chưa có mật khẩu</span>
                  )}
                </div>
              </div>
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
  const [countdown, setCountdown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  const channel = type === 'email' ? 'EMAIL' : 'SMS';
  const purpose = type === 'email' ? 'CHANGE_EMAIL' : 'CHANGE_PHONE';
  const label = type === 'email' ? 'Email' : 'Số điện thoại';
  const Icon = type === 'email' ? Mail : Phone;
  const verificationOnly = type === 'email' && !verifiedAt && Boolean(value);
  const hasValue = Boolean(value?.trim());
  const actionLabel = verificationOnly ? 'Xác thực' : hasValue ? 'Đổi' : 'Thêm';

  useEffect(() => {
    if (!editing) setDestination(value ?? '');
  }, [editing, value]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const sendOtp = useMutation({
    mutationFn: () => api.otp.send({ channel, purpose, destination }),
    onSuccess: (result) => {
      setError('');
      setSent(true);
      setCountdown(60);
      toast.success(
        `Đã gửi mã xác thực. Mã có hiệu lực trong ${Math.round((result?.expiresIn ?? 300) / 60)} phút.`,
      );
      setTimeout(() => otpInputRef.current?.focus(), 100);
    },
    onError: (requestError) => setError(getErrorMessage(requestError)),
  });

  const save = useMutation({
    mutationFn: async () => {
      const verification = await api.otp.verify({ channel, purpose, destination, code });
      return type === 'email'
        ? api.account.changeEmail({
            newEmail: destination,
            verificationToken: verification.verificationToken,
          })
        : api.account.changePhone({
            newPhone: destination,
            verificationToken: verification.verificationToken,
          });
    },
    onSuccess: () => {
      toast.success(`Đã cập nhật ${label.toLowerCase()} thành công.`);
      setEditing(false);
      setSent(false);
      setCode('');
      setError('');
      onSuccess();
    },
    onError: (requestError) => {
      if (
        type === 'phone' &&
        requestError instanceof ApiError &&
        requestError.code === 'PHONE_ALREADY_EXISTS'
      ) {
        setSent(false);
        setCode('');
        setError('Số điện thoại này đã được sử dụng. Hãy nhập số khác rồi gửi mã mới.');
        return;
      }
      if (
        type === 'email' &&
        requestError instanceof ApiError &&
        requestError.code === 'EMAIL_ALREADY_EXISTS'
      ) {
        setSent(false);
        setCode('');
        setError('Email này đã được sử dụng. Hãy nhập email khác rồi gửi mã mới.');
        return;
      }
      setError(getErrorMessage(requestError));
    },
  });

  const begin = () => {
    setEditing(true);
    setSent(false);
    setCode('');
    setError('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const cancel = () => {
    setEditing(false);
    setSent(false);
    setCode('');
    setError('');
    setDestination(value ?? '');
  };

  const changeDestination = () => {
    setSent(false);
    setCode('');
    setError('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSendOtp = () => {
    const trimmed = destination.trim();
    if (!trimmed) {
      setError(
        type === 'email'
          ? 'Vui lòng nhập email mới.'
          : 'Vui lòng nhập số điện thoại mới.',
      );
      return;
    }
    if (value && trimmed === value.trim() && !verificationOnly) {
      setError(
        type === 'email'
          ? 'Email mới phải khác email hiện tại.'
          : 'Số điện thoại mới phải khác số điện thoại hiện tại.',
      );
      return;
    }
    sendOtp.mutate();
  };

  return (
    <div
      className={cn(
        'rounded-2xl border bg-white p-4 sm:p-5 transition-all duration-200 shadow-sm flex flex-col justify-between',
        editing
          ? 'border-[#00873E]/40 ring-2 ring-[#00873E]/10 bg-slate-50/40'
          : 'border-slate-200/90 hover:border-slate-300',
      )}
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Icon className="size-4 text-slate-500" />
            {label}
            <span className="text-red-500 font-semibold" aria-hidden="true">
              *
            </span>
          </span>
          {verifiedAt ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              Đã xác thực
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200/60">
              <AlertCircle className="size-3.5 text-amber-600" />
              Chưa xác thực
            </span>
          )}
        </div>

        {/* Input/Display Area */}
        {!editing ? (
          <div className="mt-3.5 flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Input
                id={`profile-${type}`}
                type={type === 'email' ? 'email' : 'tel'}
                value={value ?? ''}
                readOnly
                className="bg-slate-50/80 font-medium text-slate-800 cursor-default border-slate-200"
                placeholder={type === 'email' ? 'Chưa cập nhật email' : 'Chưa cập nhật số điện thoại'}
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant={verificationOnly ? 'default' : 'outline'}
              className="shrink-0 text-xs font-semibold h-11 px-3.5 shadow-none"
              onClick={begin}
            >
              {actionLabel}
            </Button>
          </div>
        ) : !sent ? (
          /* Step 1: Entering new email / phone */
          <div className="mt-3.5 space-y-3">
            <div>
              <Input
                ref={inputRef}
                id={`profile-${type}-edit`}
                type={type === 'email' ? 'email' : 'tel'}
                value={destination}
                placeholder={type === 'email' ? 'Nhập địa chỉ email mới' : 'Nhập số điện thoại mới'}
                className="bg-white font-medium border-slate-300 focus:border-[#00873E]"
                disabled={sendOtp.isPending}
                onChange={(event) => {
                  setDestination(event.target.value);
                  if (error) setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendOtp();
                  }
                }}
              />
              <p className="mt-1.5 text-[11px] text-slate-500">
                Mã xác thực sẽ được gửi qua {type === 'email' ? 'email' : 'SMS'} để xác nhận.
              </p>
            </div>

            {error ? (
              <p className="text-xs text-red-600 font-medium flex items-center gap-1" role="alert">
                <AlertCircle className="size-3.5 shrink-0" />
                {error}
              </p>
            ) : null}

            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                className="flex-1 text-xs font-semibold h-9"
                onClick={handleSendOtp}
                disabled={sendOtp.isPending}
              >
                {sendOtp.isPending ? 'Đang gửi mã…' : 'Gửi mã xác thực'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-xs text-slate-600 hover:text-slate-900 h-9 px-3"
                onClick={cancel}
                disabled={sendOtp.isPending}
              >
                Hủy
              </Button>
            </div>
          </div>
        ) : (
          /* Step 2: OTP Verification */
          <div className="mt-3.5 space-y-3">
            <div className="rounded-xl bg-slate-50/90 border border-slate-200 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 truncate">
                  Mã gửi đến: <strong className="font-semibold text-slate-900">{destination}</strong>
                </span>
                <button
                  type="button"
                  onClick={changeDestination}
                  className="text-xs font-semibold text-[#00873E] hover:underline shrink-0 ml-2"
                >
                  Đổi {type === 'phone' ? 'số' : 'email'}
                </button>
              </div>

              <div>
                <Input
                  ref={otpInputRef}
                  aria-label={`Mã xác thực ${label.toLowerCase()}`}
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore="true"
                  placeholder="Nhập mã 6 số"
                  value={code}
                  className="h-11 text-center font-mono text-lg font-bold tracking-[0.4em] bg-white border-slate-300 focus:border-[#00873E] focus:ring-[#00873E]/10 placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-400 placeholder:text-sm"
                  onChange={(event) => {
                    const val = event.target.value.replace(/\D/g, '').slice(0, 6);
                    setCode(val);
                    if (error) setError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && code.length === 6) {
                      e.preventDefault();
                      save.mutate();
                    }
                  }}
                  disabled={save.isPending}
                />
              </div>

              {error ? (
                <p className="text-xs text-red-600 font-medium flex items-center gap-1.5" role="alert">
                  <AlertCircle className="size-3.5 shrink-0" />
                  {error}
                </p>
              ) : null}

              <div className="flex items-center justify-between text-xs pt-0.5">
                {countdown > 0 ? (
                  <span className="text-slate-400">
                    Gửi lại mã sau <strong className="font-semibold text-slate-600">{countdown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => sendOtp.mutate()}
                    disabled={sendOtp.isPending}
                    className="font-semibold text-[#00873E] hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    <RefreshCw className={cn('size-3', sendOtp.isPending && 'animate-spin')} />
                    Gửi lại mã
                  </button>
                )}
                <button
                  type="button"
                  onClick={cancel}
                  className="text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              className="w-full text-xs font-semibold h-10 shadow-sm"
              onClick={() => save.mutate()}
              disabled={save.isPending || code.length !== 6}
            >
              {save.isPending ? 'Đang xác thực…' : 'Xác nhận'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
