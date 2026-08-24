import Link from "next/link";
import { ArrowRight, Coins, LockKeyhole, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-indigo-100/60">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-8 sm:px-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
              Z
            </span>
            ZENX GO
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/login">Đăng nhập</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/auth/register">Tạo tài khoản</Link>
            </Button>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border border-primary/20 bg-white/70 px-3 py-1 text-sm font-medium text-primary">
              Tài khoản & ví ZENX Coin
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
              Một nơi đơn giản để quản lý hành trình ZENX của bạn.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Đăng nhập an toàn, quản lý hồ sơ, nạp ZENX Coin và theo dõi mọi biến động trong ví của bạn.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/auth/register">
                  Bắt đầu ngay <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/wallet">Xem ví</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FeatureCard icon={<LockKeyhole className="size-5" />} title="Đăng nhập an toàn" description="Cookie HTTP-only và các lớp xác thực sẵn sàng kết nối API." />
            <FeatureCard icon={<UserRound className="size-5" />} title="Hồ sơ cá nhân" description="Quản lý thông tin, mật khẩu và các tài khoản liên kết." />
            <FeatureCard icon={<Coins className="size-5" />} title="Ví ZENX Coin" description="Theo dõi số dư và lịch sử ledger minh bạch, dễ tra cứu." className="sm:col-span-2" />
          </div>
        </section>

        <footer className="border-t border-slate-200/80 py-5 text-sm text-muted-foreground">
          ZENX GO Phase 1 · Account & Wallet Foundation
        </footer>
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-sm leading-6 text-muted-foreground">{description}</CardContent>
    </Card>
  );
}
