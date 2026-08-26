'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';

const schema = z.object({
  email: z.string().trim().email('Email chưa đúng định dạng. Vui lòng kiểm tra lại.'),
});
type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const mutation = useMutation({
    mutationFn: api.auth.forgotPassword,
    onSuccess: (_, variables) => {
      setSubmittedEmail(variables.email);
      setCountdown(60);
      toast.success('Mã xác thực đã được gửi tới email của bạn.');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleResend = () => {
    if (!submittedEmail || countdown > 0) return;
    mutation.mutate({ email: submittedEmail });
  };

  return (
    <div className="w-full max-w-[480px] rounded-3xl border border-slate-100 bg-white p-7 sm:p-10 shadow-soft my-6">
      {submittedEmail ? (
        /* State 2: Success Confirmation & Next Steps */
        <div className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#E8F7EC] text-[#00873E]">
            <CheckCircle2 className="size-8" />
          </div>

          <h1 className="mt-5 text-2xl font-black text-slate-900">
            Kiểm tra hộp thư của bạn
          </h1>

          <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
            Chúng tôi đã gửi mã xác thực 6 chữ số để đặt lại mật khẩu tới địa chỉ:
          </p>

          <div className="my-4 rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-sm font-bold text-slate-800 break-all">
            {submittedEmail}
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Vui lòng kiểm tra cả thư mục <strong>Spam / Rác</strong> nếu không thấy thư trong Hộp thư đến.
          </p>

          <div className="mt-6 space-y-3">
            <Button
              asChild
              className="w-full h-11 text-sm font-semibold rounded-xl gap-2 shadow-sm"
            >
              <Link href={`/auth/reset-password?email=${encodeURIComponent(submittedEmail)}`}>
                Nhập mã xác thực <ArrowRight className="size-4" />
              </Link>
            </Button>

            <Button
              type="button"
              variant="zenx-outline"
              className="w-full h-11 text-xs font-semibold rounded-xl"
              onClick={handleResend}
              disabled={countdown > 0 || mutation.isPending}
            >
              {mutation.isPending ? (
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="size-3.5 animate-spin" /> Đang gửi lại…
                </span>
              ) : countdown > 0 ? (
                `Gửi lại mã (${countdown}s)`
              ) : (
                'Chưa nhận được mã? Gửi lại'
              )}
            </Button>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setSubmittedEmail(null)}
              className="font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              Đổi email khác
            </button>
            <Link
              href="/auth/login"
              className="font-bold text-[#00873E] hover:underline"
            >
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      ) : (
        /* State 1: Request Password Reset Form */
        <div>
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F7EC] text-[#00873E]">
              <KeyRound className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                Quên mật khẩu?
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed">
                Nhập email đã đăng ký để nhận mã 6 số đặt lại mật khẩu mới.
              </p>
            </div>
          </div>

          <form
            className="mt-7 space-y-5"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <FormField
              label="Email đã đăng ký"
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
                  placeholder="Ví dụ: player@gmail.com"
                  className="pl-10 h-11"
                  {...form.register('email')}
                />
              </div>
            </FormField>

            <Button
              className="h-11 w-full text-sm font-semibold shadow-sm rounded-xl"
              type="submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="size-4 animate-spin" /> Đang gửi mã…
                </span>
              ) : (
                'Gửi mã xác thực'
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-3">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#00873E] hover:underline"
            >
              <ArrowLeft className="size-4" /> Quay lại Đăng nhập
            </Link>

            <p className="text-xs text-slate-500">
              Chưa có tài khoản?{' '}
              <Link href="/auth/register" className="font-semibold text-slate-800 hover:text-[#00873E] hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
