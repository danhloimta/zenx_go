'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Mail,
  Phone,
  RefreshCw,
  Shield,
  ShieldCheck,
  User,
  Zap,
} from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';

const schema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, 'Tên đăng nhập cần ít nhất 3 ký tự.')
      .max(32, 'Tên đăng nhập không được quá 32 ký tự.')
      .regex(/^[a-zA-Z0-9_.-]+$/, 'Tên đăng nhập chỉ gồm chữ cái, số, dấu gạch dưới, gạch ngang hoặc chấm.'),
    email: z.string().trim().email('Email chưa đúng định dạng.'),
    phone: z
      .string()
      .trim()
      .min(8, 'Vui lòng nhập số điện thoại hợp lệ.')
      .max(15, 'Số điện thoại không hợp lệ.'),
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
  const [countdown, setCountdown] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);

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
    mode: 'onTouched',
  });

  const phone = form.watch('phone');
  const password = form.watch('password');
  const confirmPassword = form.watch('confirmPassword');

  const hasMinLength = (password ?? '').length >= 8;
  const isConfirmDirty = (confirmPassword ?? '').length > 0;
  const isPasswordMatch = isConfirmDirty && password === confirmPassword;

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const sendOtp = useMutation({
    mutationFn: () => {
      const trimmedPhone = (phone ?? '').trim();
      if (!trimmedPhone || trimmedPhone.length < 8) {
        throw new Error('Vui lòng nhập số điện thoại trước khi nhận mã OTP.');
      }
      return api.otp.send({
        channel: 'SMS',
        purpose: 'VERIFY_PHONE',
        destination: trimmedPhone,
      });
    },
    onSuccess: (result) => {
      setOtpSent(true);
      setCountdown(60);
      toast.success(
        `Đã gửi OTP. Mã có hiệu lực trong ${Math.round(result.expiresIn / 60)} phút.`,
      );
      setTimeout(() => otpInputRef.current?.focus(), 150);
    },
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
      toast.success('Tạo tài khoản thành công! Đang chuyển hướng...');
      router.push('/account/complete-profile');
      router.refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const isPhoneValid = Boolean(phone && phone.trim().length >= 8);

  return (
    <div className="w-full max-w-[1160px] overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-soft my-6">
      <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
        {/* Left Column: Branding, Illustration & Feature Points */}
        <section className="relative flex flex-col justify-between bg-gradient-to-br from-[#FAFCFA] via-white to-[#EAF8EE] p-8 sm:p-12 lg:p-14 border-b lg:border-b-0 lg:border-r border-slate-100">
          <div>
            <BrandLogo />

            <div className="mt-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F7EC] border border-[#00873E]/20 px-3 py-0.5 text-xs font-bold text-[#00873E]">
                <Zap className="size-3.5" /> Đăng ký thành viên mới
              </span>
              <h1 className="mt-4 text-[26px] sm:text-[32px] font-black leading-tight text-slate-900">
                Gia nhập nền tảng
                <br />
                <span className="text-[#00873E]">ZENX GO</span>
              </h1>
              <p className="mt-3 text-sm text-slate-500 max-w-[360px] leading-relaxed">
                Nền tảng quản lý tài khoản game, nạp Coin tự động và giao dịch an toàn, tiện lợi hàng đầu.
              </p>
            </div>

            <div className="my-8 flex justify-center">
              <img
                src="/images/wallet.png"
                alt="Ví ZENX GO"
                className="w-[230px] sm:w-[260px] object-contain drop-shadow-sm transition-transform hover:scale-105 duration-300"
              />
            </div>

            <div className="space-y-4">
              <FeatureItem
                icon={<ShieldCheck className="size-5 text-[#00873E]" />}
                title="Bảo mật tối ưu 2 lớp"
                desc="Bảo vệ tài khoản với xác thực SMS OTP và mã hóa dữ liệu cao cấp."
              />
              <FeatureItem
                icon={<Zap className="size-5 text-[#00873E]" />}
                title="Giao dịch siêu tốc"
                desc="Nạp Coin qua VietQR và xử lý tự động chỉ trong vài giây."
              />
              <FeatureItem
                icon={<User className="size-5 text-[#00873E]" />}
                title="Quản lý ví tiện lợi"
                desc="Theo dõi số dư, chi tiêu và lịch sử giao dịch mọi lúc mọi nơi."
              />
            </div>
          </div>

          <p className="mt-8 text-xs text-slate-400">
            © 2024 ZENX GO. Nền tảng giao dịch tài khoản game an toàn.
          </p>
        </section>

        {/* Right Column: Register Form Card */}
        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-white">
          <div className="w-full max-w-[480px]">
            {/* Form Header */}
            <div>
              <h2 className="text-2xl sm:text-[26px] font-black text-slate-900">
                Đăng ký tài khoản
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Điền các thông tin dưới đây để bắt đầu trải nghiệm ZENX GO
              </p>
            </div>

            {/* Quick Social Sign-Up */}
            <div className="mt-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <SocialAuthButton
                  provider="google"
                  href={api.auth.oauthUrl('google')}
                  label="Google"
                />
                <SocialAuthButton
                  provider="facebook"
                  href={api.auth.oauthUrl('facebook')}
                  label="Facebook"
                />
              </div>

              <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                Hoặc đăng ký bằng tài khoản
                <span className="h-px flex-1 bg-slate-200" />
              </div>
            </div>

            {/* Registration Form */}
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit((values) => register.mutate(values))}
            >
              {/* Username Field */}
              <FormField
                label="Tên đăng nhập"
                htmlFor="reg-username"
                required
                error={form.formState.errors.username?.message}
              >
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="reg-username"
                    autoComplete="username"
                    placeholder="Nhập tên đăng nhập (tối thiểu 3 ký tự)"
                    className="pl-10 h-11"
                    {...form.register('username')}
                  />
                </div>
              </FormField>

              {/* Email Field */}
              <FormField
                label="Email"
                htmlFor="reg-email"
                required
                error={form.formState.errors.email?.message}
              >
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    className="pl-10 h-11"
                    {...form.register('email')}
                  />
                </div>
              </FormField>

              {/* Phone Field */}
              <FormField
                label="Số điện thoại"
                htmlFor="reg-phone"
                required
                error={form.formState.errors.phone?.message}
              >
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="reg-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="Ví dụ: 0912345678"
                    className="pl-10 h-11"
                    value={phone}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^\d+]/g, '');
                      form.setValue('phone', cleaned, { shouldValidate: true });
                    }}
                  />
                </div>
              </FormField>

              {/* Password Field */}
              <FormField
                label="Mật khẩu"
                htmlFor="reg-password"
                required
                error={form.formState.errors.password?.message}
              >
                <div>
                  <PasswordInput
                    id="reg-password"
                    autoComplete="new-password"
                    placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)"
                    className="h-11"
                    {...form.register('password')}
                  />
                  {password && password.length > 0 && !hasMinLength && (
                    <p className="mt-1 text-[11px] text-amber-600 flex items-center gap-1">
                      <AlertCircle className="size-3 shrink-0" />
                      Mật khẩu cần có ít nhất 8 ký tự ({password.length}/8)
                    </p>
                  )}
                </div>
              </FormField>

              {/* Confirm Password Field with Live Match indicator */}
              <FormField
                label="Xác nhận mật khẩu"
                htmlFor="reg-confirmPassword"
                required
                error={form.formState.errors.confirmPassword?.message}
              >
                <div>
                  <PasswordInput
                    id="reg-confirmPassword"
                    autoComplete="new-password"
                    placeholder="Nhập lại mật khẩu vừa đặt"
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

              {/* Phone OTP Verification Block */}
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="reg-otpCode" className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Shield className="size-3.5 text-slate-500" />
                    Xác thực số điện thoại
                    <span className="text-red-500 font-semibold">*</span>
                  </label>
                  {otpSent && (
                    <span className="text-[11px] font-semibold text-[#00873E] flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> Đã gửi mã
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      ref={otpInputRef}
                      id="reg-otpCode"
                      aria-label="Nhập số OTP"
                      inputMode="numeric"
                      maxLength={6}
                      autoComplete="one-time-code"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      data-lpignore="true"
                      data-1p-ignore="true"
                      placeholder="Nhập mã OTP 6 số"
                      className="bg-white text-center font-mono font-bold tracking-[0.25em] h-11 text-base placeholder:tracking-normal placeholder:font-normal placeholder:text-sm placeholder:text-slate-400"
                      value={form.watch('otpCode')}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
                        form.setValue('otpCode', cleaned, { shouldValidate: true });
                      }}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="zenx-outline"
                    aria-label="Gửi OTP"
                    className="shrink-0 px-4 text-xs font-semibold h-11 min-w-[110px]"
                    onClick={() => sendOtp.mutate()}
                    disabled={!isPhoneValid || sendOtp.isPending || countdown > 0}
                  >
                    {sendOtp.isPending ? (
                      <span className="flex items-center gap-1">
                        <RefreshCw className="size-3.5 animate-spin" /> Gửi…
                      </span>
                    ) : countdown > 0 ? (
                      `Gửi lại (${countdown}s)`
                    ) : otpSent ? (
                      'Gửi lại mã'
                    ) : (
                      'Gửi mã OTP'
                    )}
                  </Button>
                </div>

                {form.formState.errors.otpCode?.message ? (
                  <p className="text-xs text-red-600 font-medium">
                    {form.formState.errors.otpCode.message}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Mã xác thực gồm 6 chữ số sẽ được gửi qua SMS tới số điện thoại của bạn.
                  </p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600">
                  <Checkbox
                    className="mt-0.5 shrink-0"
                    checked={form.watch('acceptTerms')}
                    onCheckedChange={(checked) =>
                      form.setValue('acceptTerms', Boolean(checked), { shouldValidate: true })
                    }
                  />
                  <span className="leading-relaxed">
                    Tôi đồng ý với{' '}
                    <Link href="/terms" target="_blank" className="font-semibold text-[#00873E] hover:underline">
                      Điều khoản sử dụng
                    </Link>{' '}
                    và{' '}
                    <Link href="/privacy" target="_blank" className="font-semibold text-[#00873E] hover:underline">
                      Chính sách bảo mật
                    </Link>{' '}
                    của ZENX GO.
                  </span>
                </label>
                {form.formState.errors.acceptTerms?.message && (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    {form.formState.errors.acceptTerms.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                className="h-11 w-full text-sm font-semibold shadow-sm mt-3"
                type="submit"
                disabled={register.isPending}
              >
                {register.isPending ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="size-4 animate-spin" /> Đang tạo tài khoản…
                  </span>
                ) : (
                  'Đăng ký tài khoản'
                )}
              </Button>
            </form>

            {/* Already have an account link */}
            <p className="mt-6 text-center text-xs sm:text-sm text-slate-600">
              Đã có tài khoản?{' '}
              <Link href="/auth/login" className="font-bold text-[#00873E] hover:underline">
                Đăng nhập ngay
              </Link>
            </p>
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
    <div className="flex items-start gap-3.5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F7EC]">
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
