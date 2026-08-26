import Link from 'next/link';
import type { ReactNode } from 'react';
import { PageFooter } from '@/components/page-footer';

type LegalPageProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function LegalPage({ title, description, children }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto w-full max-w-4xl">
        <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <header className="border-b border-slate-100 px-6 py-8 sm:px-10 sm:py-10">
            <Link href="/" className="text-sm font-semibold text-[#00873E] hover:underline">
              ← Về trang chủ
            </Link>
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-[#00873E]">
              ZENX GO
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              {description}
            </p>
          </header>
          <div className="px-6 pb-10 sm:px-10">{children}</div>
        </article>
        <PageFooter />
      </div>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="scroll-mt-6 border-t border-slate-100 pt-8 first:border-t-0 first:pt-8">
      <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 sm:text-base">{children}</div>
    </section>
  );
}

export function LegalSubsection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-slate-800">{title}</h3>
      {children}
    </div>
  );
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 pl-6">{children}</ul>;
}
