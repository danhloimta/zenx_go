import Link from "next/link";
import { ArrowRight, Coins, LockKeyhole, UserRound } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { PageFooter } from "@/components/page-footer";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-[#fbfcfb] to-[#effaf1]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-7 sm:px-8">
        <header className="flex items-center justify-between">
          <BrandLogo />
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/login">Đăng nhập</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/auth/register">Tạo tài khoản</Link>
            </Button>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-14 py-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border border-primary/20 bg-white px-3.5 py-1 text-sm font-semibold text-[#00873E]">
              Tài khoản & ví ZENX Coin
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
              Một nơi đơn giản để quản lý hành trình ZENX của bạn.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Đăng nhập an toàn, quản lý hồ sơ, nạp ZENX Coin và theo dõi mọi biến động trong ví của bạn.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-sm">
                <Link href="/auth/register">
                  Bắt đầu ngay <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/auth/login">Đăng nhập</Link>
              </Button>
            </div>
          </div>
          <div className="relative flex justify-center">
            <div className="absolute inset-8 rounded-full bg-[#dff5e4] blur-3xl" />
            <img
              src="/images/image.png"
              alt="ZENX GO bảo vệ tài khoản game"
              className="relative w-full max-w-[500px]"
            />
          </div>
        </section>

        <div className="grid gap-4 pb-10 sm:grid-cols-3">
          <Feature
            icon={<LockKeyhole />}
            title="Đăng nhập an toàn"
            text="Bảo vệ tài khoản với các lớp xác thực."
          />
          <Feature
            icon={<UserRound />}
            title="Hồ sơ cá nhân"
            text="Quản lý thông tin và phương thức đăng nhập."
          />
          <Feature
            icon={<Coins />}
            title="Ví ZENX Coin"
            text="Theo dõi số dư và giao dịch minh bạch."
          />
        </div>

        <PageFooter />
      </div>
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
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <span className="flex size-11 items-center justify-center rounded-xl bg-[#E8F7EC] text-[#00873E]">
        {icon}
      </span>
      <p className="mt-4 font-bold text-slate-900">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}
