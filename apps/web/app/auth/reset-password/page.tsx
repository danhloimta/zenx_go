'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import {
  AlertCircle,
  Check,
  Mail,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { PasswordInput } from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';

const schema = z
  .object({
    email: z.string().trim().email('Email chưa đúng định dạng.'),
    code: z.string().trim().length(6, 'Mã xác thực gồm 6 chữ số.'),
    newPassword: z.string().min(8, 'Mật khẩu cần ít nhất 8 ký tự.'),
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu.'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu nhập lại chưa khớp.',
  });

type Values = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-[480px] h-96 rounded-3xl bg-white animate-pulse" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') ?? '';

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: emailParam, code: '', newPassword: '', confirmPassword: '' },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (emailParam && !form.getValues('email')) {
      form.setValue('email', emailParam, { shouldValidate: true });
    }
  }, [emailParam, form]);

  const newPassword = form.watch('newPassword');
  const confirmPassword = form.watch('confirmPassword');
  const hasMinLength = (newPassword ?? '').length >= 8;
  const isConfirmDirty = (confirmPassword ?? '').length > 0;
  const isPasswordMatch = isConfirmDirty && newPassword === confirmPassword;

  const mutation = useMutation({
    mutationFn: async ({ confirmPassword: _confirmPassword, code, email, newPassword }: Values) => {
      const verification = await api.otp.verify({
        channel: 'EMAIL',
        purpose: 'RESET_PASSWORD',
        destination: email,
        code,
      });
      return api.auth.resetPassword({
        email,
        verificationToken: verification.verificationToken,
        newPassword,
      });
    },
    onSuccess: () => {
      toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.');
      router.push('/auth/login');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div className="w-full max-w-[480px] rounded-3xl border border-slate-100 bg-white p-7 sm:p-10 shadow-soft my-6">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F7EC] text-[#00873E]">
          <ShieldCheck className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Đặt lại mật khẩu
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed">
            Nhập mã 6 chữ số đã gửi qua email và tạo mật khẩu mới cho tài khoản.
          </p>
        </div>
      </div>

      <form
        className="mt-7 space-y-4"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        {/* Email Field */}
        <FormField
          label="Email tài khoản"
          htmlFor="email"
          required
          error={form.formState.errors.email?.message}
        >
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              className="pl-10 h-11"
              {...form.register('email')}
            />
          </div>
        </FormField>

        {/* OTP Code Field */}
        <FormField
          label="Mã xác thực 6 số (OTP)"
          htmlFor="code"
          required
          error={form.formState.errors.code?.message}
        >
          <Input
            id="code"
            inputMode="numeric"
            maxLength={6}
            autoComplete="one-time-code"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-lpignore="true"
            data-1p-ignore="true"
            placeholder="Nhập mã 6 số từ email"
            className="text-center font-mono font-bold tracking-[0.3em] h-11 text-base placeholder:tracking-normal placeholder:font-normal placeholder:text-sm placeholder:text-slate-400"
            value={form.watch('code')}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
              form.setValue('code', cleaned, { shouldValidate: true });
            }}
          />
        </FormField>

        {/* New Password Field */}
        <FormField
          label="Mật khẩu mới"
          htmlFor="newPassword"
          required
          error={form.formState.errors.newPassword?.message}
        >
          <div>
            <PasswordInput
              id="newPassword"
              autoComplete="new-password"
              placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
              className="h-11"
              {...form.register('newPassword')}
            />
            {newPassword && newPassword.length > 0 && !hasMinLength && (
              <p className="mt-1 text-[11px] text-amber-600 flex items-center gap-1">
                <AlertCircle className="size-3 shrink-0" />
                Mật khẩu cần ít nhất 8 ký tự ({newPassword.length}/8)
              </p>
            )}
          </div>
        </FormField>

        {/* Confirm Password Field */}
        <FormField
          label="Xác nhận mật khẩu mới"
          htmlFor="confirmPassword"
          required
          error={form.formState.errors.confirmPassword?.message}
        >
          <div>
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              placeholder="Nhập lại mật khẩu mới"
              className="h-11"
              {...form.register('confirmPassword')}
            />
            {isConfirmDirty && !form.formState.errors.confirmPassword?.message && (
              isPasswordMatch ? (
                <p className="mt-1 text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <Check className="size-3.5 shrink-0 text-emerald-600" />
                  Mật khẩu trùng khớp
                </p>
              ) : (
                <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                  <AlertCircle className="size-3.5 shrink-0 text-red-500" />
                  Mật khẩu nhập lại chưa khớp
                </p>
              )
            )}
          </div>
        </FormField>

        <Button
          className="h-11 w-full text-sm font-semibold shadow-sm rounded-xl mt-3"
          type="submit"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <span className="flex items-center gap-2">
              <RefreshCw className="size-4 animate-spin" /> Đang cập nhật…
            </span>
          ) : (
            'Cập nhật mật khẩu'
          )}
        </Button>
      </form>

      <div className="mt-7 pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
        <Link
          href="/auth/forgot-password"
          className="font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          Gửi lại mã OTP
        </Link>
        <Link
          href="/auth/login"
          className="font-bold text-[#00873E] hover:underline"
        >
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
}
