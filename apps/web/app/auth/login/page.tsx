'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Suspense } from 'react';
import { User } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { BrandLogo } from '@/components/brand-logo';
import { PasswordInput } from '@/components/password-input';
import { SocialAuthButton } from '@/components/social-auth-button';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { isSafeReturnTo, portalUrl } from '@/lib/domain';

const schema = z.object({
  username: z.string().trim().min(1, 'Vui lòng nhập tên đăng nhập hoặc email.'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.'),
});
type Values = z.infer<typeof schema>;

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-[440px] p-8 text-center text-sm text-slate-500">Đang tải biểu mẫu đăng nhập…</div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryReturnTo = getReturnToCandidate(searchParams.get('returnTo') ?? searchParams.get('next'));
  const [returnTo, setReturnTo] = useState<string | undefined>(queryReturnTo);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  });
  const login = useMutation({
    mutationFn: (values: Values) => api.auth.login({ ...values, returnTo: returnTo ?? queryReturnTo }),
    onSuccess: (result) => {
      toast.success('Đăng nhập thành công.');
      const destination = getSafeDestination(result?.redirectTo);
      if (destination.startsWith('http://') || destination.startsWith('https://')) window.location.assign(destination);
      else { router.push(destination); router.refresh(); }
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, 'Tên đăng nhập hoặc mật khẩu không đúng.')),
  });

  useEffect(() => {
    if (queryReturnTo) setReturnTo(queryReturnTo);
    const socialError = new URLSearchParams(window.location.search).get('social_error');
    if (!socialError) return;
    const messages: Record<string, string> = {
      not_linked: 'Tài khoản Google chưa được liên kết với ZENX GO. Hãy đăng nhập bằng mật khẩu rồi liên kết Google trong phần Tài khoản.',
      not_configured: 'Nhà cung cấp đăng nhập chưa được cấu hình.',
      provider_cancelled: 'Đăng nhập Google đã bị hủy.',
      invalid_state: 'Phiên đăng nhập Google đã hết hạn. Vui lòng thử lại.',
      oauth_failed: 'Không thể hoàn tất đăng nhập Google. Vui lòng thử lại.',
    };
    toast.error(messages[socialError] ?? messages.oauth_failed);
  }, [queryReturnTo]);

  return (
    <div className="w-full max-w-[1120px] overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-soft">
      <div className="grid lg:grid-cols-[1.1fr_1fr]">
        {/* Left Side: Branding & Illustration */}
        <section className="relative flex flex-col justify-between p-8 sm:p-12 lg:p-14">
          <div>
            <BrandLogo />
            <div className="mt-12 max-w-[420px]">
              <h1 className="text-[28px] sm:text-[32px] font-bold leading-tight text-slate-900">
                Chào mừng bạn đến với
                <br />
                <span className="text-[#00873E]">ZENX GO</span>
              </h1>
              <p className="mt-4 text-sm sm:text-base text-slate-500 leading-relaxed">
                Nền tảng quản lý tài khoản game, nạp Coin và giao dịch an toàn, nhanh chóng.
              </p>
            </div>
          </div>

          <div className="my-6 flex items-center justify-center">
            <img
              src="/images/image.png"
              alt="ZENX GO Security & Gaming"
              className="w-[85%] max-w-[420px] object-contain drop-shadow-md"
            />
          </div>

          <p className="text-xs text-slate-400">
            © 2024 ZENX GO. All rights reserved.
          </p>
        </section>

        {/* Right Side: Login Form Card */}
        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-[440px] rounded-2xl border border-slate-100 bg-white p-7 sm:p-9 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Đăng nhập tài khoản</h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
              Vui lòng đăng nhập để tiếp tục sử dụng ZENX GO
            </p>

            <form
              className="mt-8 space-y-5"
              onSubmit={form.handleSubmit((values) => login.mutate(values))}
            >
              <FormField
                label="Tên đăng nhập hoặc email"
                htmlFor="username"
                error={form.formState.errors.username?.message}
              >
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="username"
                    autoComplete="username"
                    placeholder="Nhập tên đăng nhập hoặc email"
                    className="pl-10"
                    {...form.register('username')}
                  />
                </div>
              </FormField>

              <FormField
                label="Mật khẩu"
                htmlFor="password"
                error={form.formState.errors.password?.message}
              >
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu"
                  {...form.register('password')}
                />
              </FormField>

              <div className="flex justify-end -mt-1">
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-medium text-[#00873E] hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <Button
                className="h-11 w-full text-sm font-semibold shadow-sm"
                type="submit"
                disabled={login.isPending}
              >
                {login.isPending ? 'Đang đăng nhập…' : 'Đăng nhập'}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              Hoặc đăng nhập với
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SocialAuthButton provider="google" href={api.auth.oauthUrl('google', 'login', returnTo ?? queryReturnTo)} />
              <SocialAuthButton provider="facebook" href={api.auth.oauthUrl('facebook', 'login', returnTo ?? queryReturnTo)} />
            </div>

            <p className="mt-7 text-center text-xs sm:text-sm text-slate-600">
              Chưa có tài khoản?{' '}
              <Link href="/auth/register" className="font-semibold text-[#00873E] hover:underline">
                Tạo tài khoản
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function getSafeDestination(value: string | null | undefined) {
  if (value && (value.startsWith('/') && !value.startsWith('//'))) return value;
  if (value && isSafeReturnTo(value)) return value;
  return '/account';
}

function getReturnToCandidate(value: string | null) {
  if (!value) return undefined;
  if (value.startsWith('/') && !value.startsWith('//')) {
    const url = new URL(value, portalUrl('/'));
    url.hash = '';
    return url.toString();
  }
  return isSafeReturnTo(value) ? value : undefined;
}
