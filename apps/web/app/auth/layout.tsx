'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe2 } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { PageFooter } from '@/components/page-footer';

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/auth/login';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
      {!isLoginPage ? (
        <header className="flex h-[80px] items-center justify-between border-b border-slate-100 bg-white px-6 sm:px-12">
          <BrandLogo />
          <div className="flex items-center gap-6 text-sm">
            <button className="hidden items-center gap-1.5 font-medium text-slate-700 hover:text-slate-900 sm:flex">
              <Globe2 className="size-4 text-slate-500" />
              <span>VI</span>
              <span className="text-xs text-slate-400">⌄</span>
            </button>
            <span className="hidden h-5 w-px bg-slate-200 sm:block" />
            <div className="flex items-center gap-2">
              <span className="hidden text-slate-600 sm:inline">Đã có tài khoản?</span>
              <Link href="/auth/login" className="font-semibold text-[#00873E] hover:underline">
                Đăng nhập
              </Link>
            </div>
          </div>
        </header>
      ) : null}

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        {children}
      </main>

      {!isLoginPage ? <PageFooter /> : null}
    </div>
  );
}
