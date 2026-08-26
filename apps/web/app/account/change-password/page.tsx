'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Info,
  KeyRound,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { z } from 'zod';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { useAccount } from '@/hooks/use-account';
import { Alert } from '@/components/ui/alert';
import { PasswordInput } from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const schema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8, 'Mật khẩu mới cần ít nhất 8 ký tự.')
      .regex(/[a-z]/, 'Cần có ít nhất một chữ thường (a-z).')
      .regex(/[A-Z]/, 'Cần có ít nhất một chữ hoa (A-Z).')
      .regex(/\d/, 'Cần có ít nhất một chữ số (0-9).')
      .regex(/[^A-Za-z\d]/, 'Cần có ít nhất một ký tự đặc biệt (!@#$...).'),
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu mới.'),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu nhập lại chưa khớp.',
  });

type Values = z.infer<typeof schema>;

export default function ChangePasswordPage() {
  const account = useAccount();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    mode: 'onChange',
  });

  const hasPassword = Boolean(account.data?.hasPassword);

  const newPassword = form.watch('newPassword') || '';
  const confirmPassword = form.watch('confirmPassword') || '';

  // Password rules validation checklist
  const rules = useMemo(() => {
    return [
      { label: 'Tối thiểu 8 ký tự', passed: newPassword.length >= 8 },
      { label: 'Chữ thường (a-z)', passed: /[a-z]/.test(newPassword) },
      { label: 'Chữ hoa (A-Z)', passed: /[A-Z]/.test(newPassword) },
      { label: 'Chữ số (0-9)', passed: /\d/.test(newPassword) },
      { label: 'Ký tự đặc biệt (!@#$...)', passed: /[^A-Za-z\d]/.test(newPassword) },
    ];
  }, [newPassword]);

  const passedRulesCount = rules.filter((r) => r.passed).length;
  const isConfirmDirty = confirmPassword.length > 0;
  const isPasswordMatch = isConfirmDirty && newPassword === confirmPassword;

  // Strength score
  const strengthLevel = useMemo(() => {
    if (!newPassword) return { label: 'Chưa nhập', color: 'bg-slate-200', text: 'text-slate-400', width: 'w-0' };
    if (passedRulesCount <= 2) return { label: 'Yếu', color: 'bg-red-500', text: 'text-red-500', width: 'w-1/3' };
    if (passedRulesCount <= 4) return { label: 'Trung bình', color: 'bg-amber-500', text: 'text-amber-500', width: 'w-2/3' };
    return { label: 'Rất mạnh', color: 'bg-emerald-500', text: 'text-emerald-600', width: 'w-full' };
  }, [newPassword, passedRulesCount]);

  const change = useMutation({
    mutationFn: ({ confirmPassword: _confirmPassword, ...value }: Values) =>
      api.account.changePassword(value),
    onSuccess: () => {
      toast.success(
        hasPassword
          ? 'Đã đổi mật khẩu thành công! Các phiên đăng nhập trên thiết bị khác đã được đăng xuất để bảo mật.'
          : 'Đã tạo mật khẩu đăng nhập thành công!',
      );
      form.reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
      void account.refetch();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (account.isLoading) {
    return <Skeleton className="mx-auto h-[480px] max-w-4xl rounded-3xl" />;
  }

  if (account.isError || !account.data) {
    return <Alert>Không thể tải thông tin tài khoản.</Alert>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F7EC] text-[#00873E]">
            <KeyRound className="size-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              {hasPassword ? 'Đổi mật khẩu tài khoản' : 'Tạo mật khẩu đăng nhập'}
            </h1>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
              {hasPassword
                ? 'Đổi mật khẩu định kỳ giúp bảo vệ tài khoản và số dư ví ZENX của bạn.'
                : 'Tạo mật khẩu giúp bạn có thêm phương thức đăng nhập dự phòng trực tiếp.'}
            </p>
          </div>
        </div>

        <Button asChild variant="outline" size="sm" className="rounded-xl text-xs font-semibold self-start sm:self-auto">
          <Link href="/account/security" className="gap-1.5">
            <ArrowLeft className="size-3.5" /> Quay lại Bảo mật
          </Link>
        </Button>
      </div>

      {/* Main Grid: Form + Security Guide */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left Column: Form Card */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          {!hasPassword && (
            <div className="flex items-start gap-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/70 p-4 text-xs text-emerald-900">
              <Sparkles className="size-5 text-[#00873E] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Tài khoản chưa thiết lập mật khẩu</p>
                <p className="mt-0.5 text-emerald-800 leading-relaxed">
                  Bạn hiện đang đăng nhập qua mạng xã hội. Hãy đặt mật khẩu mới để có thể đăng nhập bằng Tên đăng nhập hoặc Email.
                </p>
              </div>
            </div>
          )}

          <form
            className="space-y-5"
            onSubmit={form.handleSubmit((value) => {
              if (hasPassword && !value.currentPassword) {
                form.setError('currentPassword', { message: 'Vui lòng nhập mật khẩu hiện tại.' });
                return;
              }
              change.mutate(value);
            })}
          >
            {/* 1. Current Password (if exists) */}
            {hasPassword && (
              <FormField
                label="Mật khẩu hiện tại"
                htmlFor="current-password"
                required
                error={form.formState.errors.currentPassword?.message}
              >
                <div>
                  <PasswordInput
                    id="current-password"
                    placeholder="Nhập mật khẩu hiện tại của bạn"
                    autoComplete="current-password"
                    className="h-11"
                    {...form.register('currentPassword', { required: 'Vui lòng nhập mật khẩu hiện tại.' })}
                  />
                  <div className="mt-1.5 flex justify-end">
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs font-semibold text-[#00873E] hover:underline"
                    >
                      Quên mật khẩu hiện tại?
                    </Link>
                  </div>
                </div>
              </FormField>
            )}

            {/* 2. New Password */}
            <FormField
              label="Mật khẩu mới"
              htmlFor="new-password"
              required
              error={form.formState.errors.newPassword?.message}
            >
              <div className="space-y-2">
                <PasswordInput
                  id="new-password"
                  placeholder="Nhập mật khẩu mới"
                  autoComplete="new-password"
                  className="h-11"
                  {...form.register('newPassword')}
                />

                {/* Password Strength Progress Bar */}
                {newPassword.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Độ an toàn mật khẩu:</span>
                      <span className={cn('font-bold', strengthLevel.text)}>{strengthLevel.label}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className={cn('h-full transition-all duration-300 rounded-full', strengthLevel.color, strengthLevel.width)} />
                    </div>
                  </div>
                )}
              </div>
            </FormField>

            {/* Live Password Rules Checklist */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-2.5">
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Lock className="size-3.5 text-slate-500" /> Tiêu chuẩn mật khẩu an toàn:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {rules.map((rule, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex items-center gap-2 transition-colors',
                      rule.passed ? 'text-emerald-700 font-semibold' : 'text-slate-500',
                    )}
                  >
                    <div
                      className={cn(
                        'flex size-4 shrink-0 items-center justify-center rounded-full transition-colors',
                        rule.passed ? 'bg-[#E8F7EC] text-[#00873E]' : 'bg-slate-200 text-slate-400',
                      )}
                    >
                      {rule.passed ? <Check className="size-2.5 stroke-[3]" /> : <span className="size-1 rounded-full bg-slate-400" />}
                    </div>
                    <span>{rule.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Confirm Password */}
            <FormField
              label="Xác nhận mật khẩu mới"
              htmlFor="confirm-password"
              required
              error={form.formState.errors.confirmPassword?.message}
            >
              <div>
                <PasswordInput
                  id="confirm-password"
                  placeholder="Nhập lại mật khẩu mới"
                  autoComplete="new-password"
                  className="h-11"
                  {...form.register('confirmPassword')}
                />
                {isConfirmDirty && !form.formState.errors.confirmPassword?.message && (
                  isPasswordMatch ? (
                    <p className="mt-1 text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <Check className="size-3.5 text-emerald-600" /> Mật khẩu trùng khớp
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                      <AlertCircle className="size-3.5 text-red-500" /> Mật khẩu nhập lại chưa khớp
                    </p>
                  )
                )}
              </div>
            </FormField>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-4 border-t border-slate-100">
              <Button asChild variant="outline" size="sm" className="rounded-xl h-10 px-5 text-xs font-semibold">
                <Link href="/account/security">Hủy bỏ</Link>
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl h-10 px-6 text-xs font-bold shadow-sm"
                disabled={change.isPending || passedRulesCount < 5 || !isPasswordMatch}
              >
                {change.isPending ? (
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="size-3.5 animate-spin" /> Đang cập nhật…
                  </span>
                ) : hasPassword ? (
                  'Lưu mật khẩu mới'
                ) : (
                  'Tạo mật khẩu'
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Right Column: Security Tips & Recommendations */}
        <div className="space-y-5">
          {/* Card: Lời khuyên bảo mật */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="size-5 text-[#00873E]" /> Lời khuyên bảo mật
            </h2>

            <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed">
              <div className="flex items-start gap-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-700 font-bold text-[11px] border border-slate-100">
                  1
                </div>
                <div>
                  <p className="font-bold text-slate-900">Không dùng mật khẩu phổ biến</p>
                  <p className="text-slate-500 mt-0.5">Tránh sử dụng ngày sinh, số điện thoại hoặc các chuỗi dễ đoán như 123456.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-700 font-bold text-[11px] border border-slate-100">
                  2
                </div>
                <div>
                  <p className="font-bold text-slate-900">Đăng xuất phiên tự động</p>
                  <p className="text-slate-500 mt-0.5">Khi đổi mật khẩu thành công, các thiết bị khác đang đăng nhập sẽ tự động bị đăng xuất.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-700 font-bold text-[11px] border border-slate-100">
                  3
                </div>
                <div>
                  <p className="font-bold text-slate-900">Bảo mật đa lớp OTP</p>
                  <p className="text-slate-500 mt-0.5">Xác thực số điện thoại và email để được bảo vệ khi nạp rút hoặc giao dịch Coin.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Help Card */}
          <div className="rounded-3xl border border-slate-100 bg-[#F8FCF9] p-6 text-xs space-y-2">
            <p className="font-bold text-slate-900 flex items-center gap-1.5">
              <Info className="size-4 text-[#00873E]" /> Cần hỗ trợ khôi phục?
            </p>
            <p className="text-slate-500 leading-relaxed">
              Nếu bạn không nhớ mật khẩu cũ hoặc gặp trục trặc khi đăng nhập, hãy liên hệ ngay với CSKH.
            </p>
            <Link
              href="/support"
              className="inline-flex items-center gap-1 font-bold text-[#00873E] hover:underline pt-1"
            >
              Trung tâm hỗ trợ ZENX GO →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
