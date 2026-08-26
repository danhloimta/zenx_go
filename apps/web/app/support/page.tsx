'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, CircleHelp, Mail, MessageSquarePlus, Phone, Search, ShieldCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { SupportFaq } from '@zenx-go/api-client';
import { BrandLogo } from '@/components/brand-logo';
import { PageFooter } from '@/components/page-footer';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';

export default function SupportPage() {
  const query = useQuery({ queryKey: ['support', 'faqs'], queryFn: api.support.faqs, retry: false });
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [search, setSearch] = useState('');

  const categories = query.data?.categories ?? [];
  const allFaqs = useMemo(() => categories.flatMap((category) => category.faqs), [categories]);
  const filteredFaqs = useMemo(() => {
    const source = selectedCategory === 'ALL'
      ? allFaqs
      : categories.find((category) => category.id === selectedCategory)?.faqs ?? [];
    const normalizedSearch = search.trim().toLocaleLowerCase('vi');
    if (!normalizedSearch) return source;
    return source.filter((faq) =>
      `${faq.question} ${faq.answer}`.toLocaleLowerCase('vi').includes(normalizedSearch),
    );
  }, [allFaqs, categories, search, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between px-5 sm:px-8">
          <BrandLogo />
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="hidden px-3 py-2 text-sm font-semibold text-slate-600 hover:text-[#00873E] sm:inline-flex">
              Đăng nhập
            </Link>
            <Button asChild size="sm">
              <Link href="/auth/register">Tạo tài khoản</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-5 py-10 sm:px-8 sm:py-14">
        <section className="relative overflow-hidden rounded-3xl border border-[#DDF1E2] bg-gradient-to-br from-white via-white to-[#EAF8EE] px-6 py-10 sm:px-12 sm:py-14">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#E8F7EC] px-3 py-1 text-xs font-bold text-[#00873E]">
              <CircleHelp className="size-3.5" /> Trung tâm hỗ trợ ZENX GO
            </span>
            <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Chúng tôi có thể giúp gì cho bạn?
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
              Tìm câu trả lời nhanh về tài khoản, nạp Coin và ví ZENX. Nếu chưa tìm thấy thông tin phù hợp, hãy gửi yêu cầu cho đội ngũ hỗ trợ.
            </p>
            <div className="relative mt-7 max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
              <Input
                aria-label="Tìm kiếm câu hỏi"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nhập câu hỏi hoặc từ khóa cần tìm..."
                className="h-14 rounded-2xl border-white pl-12 pr-4 text-sm shadow-lg shadow-[#00873E]/5"
              />
            </div>
          </div>
          <ShieldCheck className="absolute -bottom-10 right-8 size-48 text-[#CDEED5]/70 sm:right-16 sm:size-64" strokeWidth={1} />
        </section>

        <section className="mt-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#00873E]">FAQ</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">Chọn vấn đề bạn cần hỗ trợ</h2>
            </div>
            <Button asChild variant="zenx-outline" className="w-full gap-2 sm:w-auto">
              <Link href="/support/report-issue">
                <MessageSquarePlus className="size-4" /> Tạo yêu cầu hỗ trợ
              </Link>
            </Button>
          </div>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Danh mục hỗ trợ">
            <CategoryTab active={selectedCategory === 'ALL'} onClick={() => setSelectedCategory('ALL')}>
              Tất cả
            </CategoryTab>
            {categories.map((category) => (
              <CategoryTab
                key={category.id}
                active={selectedCategory === category.id}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </CategoryTab>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
            {query.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-14 rounded-xl" />)}
              </div>
            ) : query.isError ? (
              <Alert>{getErrorMessage(query.error, 'Không thể tải câu hỏi thường gặp.')}</Alert>
            ) : filteredFaqs.length ? (
              <div className="divide-y divide-slate-100">
                {filteredFaqs.map((faq) => <FaqItem key={faq.id} faq={faq} />)}
              </div>
            ) : (
              <div className="flex min-h-40 flex-col items-center justify-center text-center">
                <CircleHelp className="size-9 text-slate-300" />
                <p className="mt-3 font-bold text-slate-800">Không tìm thấy câu hỏi nào</p>
                <p className="mt-1 text-sm text-slate-500">Thử từ khóa khác hoặc gửi yêu cầu để được hỗ trợ trực tiếp.</p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#E8F7EC] text-[#00873E]"><Phone className="size-5" /></div>
            <h2 className="mt-4 font-bold text-slate-900">Gọi cho chúng tôi</h2>
            <p className="mt-1 text-sm text-slate-500">Đội ngũ hỗ trợ sẵn sàng giải đáp các vấn đề của bạn.</p>
            <a href="tel:19001234" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#00873E] hover:underline">1900 1234 <ArrowRight className="size-4" /></a>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#E8F7EC] text-[#00873E]"><Mail className="size-5" /></div>
            <h2 className="mt-4 font-bold text-slate-900">Gửi email</h2>
            <p className="mt-1 text-sm text-slate-500">Mô tả chi tiết vấn đề nếu bạn cần hỗ trợ ngoài giờ.</p>
            <a href="mailto:support@zenxgo.vn" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#00873E] hover:underline">support@zenxgo.vn <ArrowRight className="size-4" /></a>
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  );
}

function CategoryTab({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${active ? 'bg-[#00873E] text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:border-[#00873E]/40 hover:text-[#00873E]'}`}
    >
      {children}
    </button>
  );
}

function FaqItem({ faq }: { faq: SupportFaq }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-bold text-slate-800 transition hover:text-[#00873E]"
      >
        <span>{faq.question}</span>
        <ChevronDown className={`size-5 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180 text-[#00873E]' : ''}`} />
      </button>
      {open ? <div className="pb-5 pr-8 text-sm leading-7 text-slate-500 whitespace-pre-line">{faq.answer}</div> : null}
    </div>
  );
}
