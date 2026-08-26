'use client';

import Link from 'next/link';
import { ArrowRight, Coins, LockKeyhole, Sparkles, UserRound } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { PageFooter } from '@/components/page-footer';
import { Button } from '@/components/ui/button';
import { useAccount } from '@/hooks/use-account';
import { useWallet } from '@/hooks/use-wallet';
import { formatAmount, mediaUrl } from '@/lib/utils';

export default function HomePage() {
  const account = useAccount();
  const wallet = useWallet();
  const user = account.data;

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-[#fbfcfb] to-[#effaf1] flex flex-col justify-between">
      <div className="mx-auto flex w-full max-w-6xl flex-col px-5 py-6 sm:px-8 flex-1">
        {/* Header */}
        <header className="flex h-[72px] items-center justify-between">
          <BrandLogo />
          
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Coin Badge */}
                <Link
                  href="/payment"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1 text-xs font-bold text-[#00873E] hover:bg-emerald-100/80 transition-colors"
                >
                  <Coins className="size-3.5" />
                  <span>{formatAmount(wallet.data?.balance ?? 0)} Coin</span>
                </Link>

                {/* Account Dashboard CTA */}
                <Button asChild size="sm" className="gap-2 rounded-xl text-xs font-semibold shadow-sm h-9 px-4">
                  <Link href="/account" className="flex items-center gap-2">
                    <div className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20">
                      {mediaUrl(user.profile?.avatarUrl) ? (
                        <img
                          src={mediaUrl(user.profile?.avatarUrl)}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <UserRound className="size-3" />
                      )}
                    </div>
                    <span>{user.profile?.fullName || user.username || 'Tài khoản'}</span>
                    <ArrowRight className="size-3.5 ml-0.5" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="text-xs font-semibold text-slate-700 hover:text-[#00873E] rounded-xl h-9">
                  <Link href="/auth/login">Đăng nhập</Link>
                </Button>
                <Button asChild size="sm" className="text-xs font-semibold rounded-xl h-9 shadow-sm px-4">
                  <Link href="/auth/register">Tạo tài khoản</Link>
                </Button>
              </>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <section className="grid flex-1 items-center gap-12 py-12 lg:py-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#00873E]/20 bg-white px-3.5 py-1 text-xs sm:text-sm font-bold text-[#00873E] shadow-2xs">
              <Sparkles className="size-4" /> Nền tảng tài khoản & ví ZENX Coin
            </span>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight">
              Một nơi đơn giản để quản lý hành trình ZENX của bạn.
            </h1>

            <p className="mt-5 max-w-xl text-sm sm:text-base leading-relaxed text-slate-600">
              Đăng nhập an toàn, quản lý thông tin tài khoản, nạp ZENX Coin siêu tốc qua VietQR và theo dõi lịch sử giao dịch minh bạch 24/7.
            </p>

            {/* Dynamic CTA Buttons based on Auth State */}
            <div className="mt-8 flex flex-wrap gap-3.5">
              {user ? (
                <>
                  <Button asChild size="lg" className="rounded-2xl font-bold shadow-md shadow-[#00873E]/15 h-12 px-6">
                    <Link href="/account">
                      Vào trang tổng quan <ArrowRight className="ml-2 size-4.5" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-2xl font-bold h-12 px-6">
                    <Link href="/payment">
                      <Coins className="mr-2 size-4.5 text-[#00873E]" /> Nạp Coin ngay
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild size="lg" className="rounded-2xl font-bold shadow-md shadow-[#00873E]/15 h-12 px-6">
                    <Link href="/auth/register">
                      Bắt đầu ngay <ArrowRight className="ml-2 size-4.5" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-2xl font-bold h-12 px-6">
                    <Link href="/auth/login">Đăng nhập tài khoản</Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Hero Illustration */}
          <div className="relative flex justify-center items-center">
            <div className="absolute inset-8 rounded-full bg-[#dff5e4] blur-3xl opacity-80" />
            <img
              src="/images/image.png"
              alt="ZENX GO bảo vệ tài khoản game"
              className="relative w-full max-w-[480px] object-contain drop-shadow-md hover:scale-102 transition-transform duration-300"
            />
          </div>
        </section>

        {/* Feature Cards Grid */}
        <div className="grid gap-4 pb-8 sm:grid-cols-3">
          <Feature
            icon={<LockKeyhole className="size-5" />}
            title="Bảo mật 2 lớp an toàn"
            text="Bảo vệ tài khoản tối ưu với SMS OTP và công nghệ mã hóa hiện đại."
          />
          <Feature
            icon={<UserRound className="size-5" />}
            title="Quản lý hồ sơ cá nhân"
            text="Dễ dàng cập nhật thông tin, liên kết Google / Facebook và đổi mật khẩu."
          />
          <Feature
            icon={<Coins className="size-5" />}
            title="Ví ZENX Coin 24/7"
            text="Nạp Coin qua VietQR tự động chỉ vài giây, sao kê giao dịch minh bạch."
          />
        </div>
      </div>

      <PageFooter />
    </main>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:border-[#00873E]/30 transition-all">
      <span className="flex size-11 items-center justify-center rounded-xl bg-[#E8F7EC] text-[#00873E]">
        {icon}
      </span>
      <p className="mt-4 font-bold text-slate-900 text-sm">{title}</p>
      <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-500">{text}</p>
    </div>
  );
}
