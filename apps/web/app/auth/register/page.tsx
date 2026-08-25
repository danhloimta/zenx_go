'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Phone, Shield, User, Zap } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { PasswordInput } from '@/components/password-input';
import { SocialAuthButton } from '@/components/social-auth-button';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';

const schema = z
  .object({
    username: z.string().trim().min(3, 'Tên đăng nhập cần ít nhất 3 ký tự.'),
    email: z.string().trim().email('Email chưa đúng định dạng.'),
    phone: z.string().trim().min(8, 'Vui lòng nhập số điện thoại.'),
    password: z.string().min(8, 'Mật khẩu cần ít nhất 8 ký tự.'),
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu.'),
    otpCode: z.string().trim().length(6, 'Mã OTP gồm 6 chữ số.'),
    acceptTerms: z.boolean().refine(Boolean, 'Bạn cần đồng ý Điều khoản sử dụng & Chính sách bảo mật.'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu nhập lại chưa khớp.',
  });

type Values = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      otpCode: '',
      acceptTerms: false,
    },
  });

  const phone = form.watch('phone');

  const sendOtp = useMutation({
    mutationFn: () =>
      api.otp.send({
        channel: 'SMS',
        purpose: 'VERIFY_PHONE',
        destination: phone,
      }),
    onSuccess: (result) =>
      toast.success(`Đã gửi OTP. Mã có hiệu lực trong ${Math.round(result.expiresIn / 60)} phút.`),
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const register = useMutation({
    mutationFn: async ({ otpCode, confirmPassword: _confirmPassword, ...values }: Values) => {
      const verification = await api.otp.verify({
        channel: 'SMS',
        purpose: 'VERIFY_PHONE',
        destination: values.phone,
        code: otpCode,
      });
      return api.auth.register({
        ...values,
        acceptPrivacy: values.acceptTerms,
        verificationToken: verification.verificationToken,
      });
    },
    onSuccess: () => {
      toast.success('Tạo tài khoản thành công.');
      router.push('/account/complete-profile');
      router.refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div className="w-full max-w-[1140px] overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-soft">
      <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
        {/* Left Column: Branding, Illustration & Feature Points */}
        <section className="flex flex-col justify-between p-8 sm:p-12 lg:p-14">
          <div>
            <h1 className="text-[26px] sm:text-[30px] font-bold leading-tight text-slate-900">
              Chào mừng đến với
              <br />
              <span className="text-[#00873E]">ZENX GO</span>
            </h1>
            <p className="mt-3 text-sm text-slate-500 max-w-[340px]">
              Nền tảng quản lý tài khoản game an toàn, nhanh chóng và tiện lợi.
            </p>

            <div className="my-8 flex justify-center">
              <img
                src="/images/wallet.png"
                alt="Ví ZENX GO"
                className="w-[260px] object-contain drop-shadow-sm"
              />
            </div>

            <div className="space-y-4">
              <FeatureItem
                icon={<Shield className="size-5 text-[#00873E]" />}
                title="Bảo mật tối ưu"
                desc="Bảo vệ tài khoản với công nghệ bảo mật tiên tiến."
              />
              <FeatureItem
                icon={<Zap className="size-5 text-[#00873E]" />}
                title="Giao dịch nhanh chóng"
                desc="Nạp rút và giao dịch chỉ trong vài giây."
              />
              <FeatureItem
                icon={<User className="size-5 text-[#00873E]" />}
                title="Quản lý dễ dàng"
                desc="Theo dõi tài khoản và lịch sử giao dịch mọi lúc."
              />
            </div>
          </div>
        </section>

        {/* Right Column: Register Form Card */}
        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-[480px] rounded-2xl border border-slate-100 bg-white p-7 sm:p-9 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Đăng ký tài khoản</h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
              Vui lòng điền đầy đủ thông tin để tạo tài khoản ZENX GO
            </p>

            <form
              className="mt-6 space-y-4"
              onSubmit={form.handleSubmit((values) => register.mutate(values))}
            >
              <FormField
                label="Tên đăng nhập"
                htmlFor="reg-username"
                error={form.formState.errors.username?.message}
              >
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="reg-username"
                    placeholder="Nhập tên đăng nhập"
                    className="pl-10"
                    {...form.register('username')}
                  />
                </div>
              </FormField>

              <FormField
                label="Email"
                htmlFor="reg-email"
                error={form.formState.errors.email?.message}
              >
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="Nhập email của bạn"
                    className="pl-10"
                    {...form.register('email')}
                  />
                </div>
              </FormField>

              <FormField
                label="Số điện thoại"
                htmlFor="reg-phone"
                error={form.formState.errors.phone?.message}
              >
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="reg-phone"
                    type="tel"
                    placeholder="Nhập số điện thoại"
                    className="pl-10"
                    {...form.register('phone')}
                  />
                </div>
              </FormField>

              <FormField
                label="Mật khẩu"
                htmlFor="reg-password"
                error={form.formState.errors.password?.message}
              >
                <PasswordInput
                  id="reg-password"
                  placeholder="Nhập mật khẩu"
                  {...form.register('password')}
                />
              </FormField>

              <FormField
                label="Xác nhận mật khẩu"
                htmlFor="reg-confirmPassword"
                error={form.formState.errors.confirmPassword?.message}
              >
                <PasswordInput
                  id="reg-confirmPassword"
                  placeholder="Nhập lại mật khẩu"
                  {...form.register('confirmPassword')}
                />
              </FormField>

              {/* OTP Verification */}
              <div>
                <label htmlFor="reg-otpCode" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Xác thực số điện thoại
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Shield className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="reg-otpCode"
                      aria-label="Nhập số OTP"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Nhập số OTP"
                      className="pl-10"
                      {...form.register('otpCode')}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="zenx-outline"
                    className="shrink-0 px-4 text-xs font-semibold"
                    onClick={() => sendOtp.mutate()}
                    disabled={!phone || sendOtp.isPending}
                  >
                    {sendOtp.isPending ? 'Đang gửi…' : 'Gửi OTP'}
                  </Button>
                </div>
                {form.formState.errors.otpCode?.message ? (
                  <p className="mt-1 text-xs text-red-600">
                    {form.formState.errors.otpCode.message}
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-slate-400">
                    Chúng tôi sẽ gửi mã OTP đến số điện thoại của bạn
                  </p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600">
                  <Checkbox
                    className="mt-0.5"
                    checked={form.watch('acceptTerms')}
                    onCheckedChange={(checked) =>
                      form.setValue('acceptTerms', Boolean(checked), { shouldValidate: true })
                    }
                  />
                  <span>
                    Tôi đồng ý với{' '}
                    <Link href="/terms" className="font-semibold text-[#00873E] hover:underline">
                      Điều khoản sử dụng
                    </Link>{' '}
                    và{' '}
                    <Link href="/privacy" className="font-semibold text-[#00873E] hover:underline">
                      Chính sách bảo mật
                    </Link>{' '}
                    của ZENX GO
                  </span>
                </label>
                {form.formState.errors.acceptTerms?.message && (
                  <p className="mt-1 text-xs text-red-600">
                    {form.formState.errors.acceptTerms.message}
                  </p>
                )}
              </div>

              <Button
                className="h-11 w-full text-sm font-semibold shadow-sm mt-2"
                type="submit"
                disabled={register.isPending}
              >
                {register.isPending ? 'Đang tạo tài khoản…' : 'Đăng ký tài khoản'}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              Hoặc đăng ký với
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SocialAuthButton
                provider="google"
                href={api.auth.oauthUrl('google')}
                label="Đăng ký với Google"
              />
              <SocialAuthButton
                provider="facebook"
                href={api.auth.oauthUrl('facebook')}
                label="Đăng ký với Facebook"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-center gap-3.5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F7EC]">
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
