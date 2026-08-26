'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, FileText, MessageSquare, Send } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ApiError, type SupportTicket } from '@zenx-go/api-client';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { BrandLogo } from '@/components/brand-logo';
import { PageFooter } from '@/components/page-footer';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';

const schema = z.object({
  categoryId: z.string().uuid('Vui lòng chọn danh mục hỗ trợ.'),
  subject: z.string().trim().min(3, 'Tiêu đề cần có ít nhất 3 ký tự.').max(160, 'Tiêu đề không được quá 160 ký tự.'),
  description: z.string().trim().min(10, 'Mô tả cần có ít nhất 10 ký tự.').max(4000, 'Mô tả không được quá 4.000 ký tự.'),
});
type Values = z.infer<typeof schema>;

export default function ReportIssuePage() {
  const router = useRouter();
  const account = useQuery({ queryKey: ['account', 'me'], queryFn: api.account.me, retry: false });
  const faqQuery = useQuery({ queryKey: ['support', 'faqs'], queryFn: api.support.faqs, retry: false });
  const [createdTicket, setCreatedTicket] = useState<SupportTicket | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { categoryId: '', subject: '', description: '' },
  });
  const categories = faqQuery.data?.categories ?? [];

  useEffect(() => {
    if (account.error instanceof ApiError && account.error.status === 401) {
      const next = '/support/report-issue';
      router.replace(`/auth/login?next=${encodeURIComponent(next)}`);
    }
  }, [account.error, router]);

  useEffect(() => {
    if (!form.getValues('categoryId') && categories[0]) {
      form.setValue('categoryId', categories[0].id, { shouldValidate: true });
    }
  }, [categories, form]);

  const createTicket = useMutation({
    mutationFn: api.support.createTicket,
    onSuccess: (ticket) => {
      setCreatedTicket(ticket);
      form.reset({ categoryId: ticket.category.id, subject: '', description: '' });
    },
  });

  if (account.isLoading || (account.error instanceof ApiError && account.error.status === 401)) {
    return <PageFrame><Skeleton className="h-[560px] rounded-3xl" /></PageFrame>;
  }

  if (account.isError) {
    return <PageFrame><Alert>{getErrorMessage(account.error, 'Không thể xác thực tài khoản.')}</Alert></PageFrame>;
  }

  return (
    <PageFrame>
      <div className="mx-auto max-w-3xl">
        <Link href="/support" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#00873E]"><ArrowLeft className="size-4" /> Quay lại trung tâm hỗ trợ</Link>
        <div className="mt-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-10">
          {createdTicket ? (
            <SuccessState ticket={createdTicket} />
          ) : (
            <>
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F7EC] text-[#00873E]"><MessageSquare className="size-6" /></div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900">Tạo yêu cầu hỗ trợ</h1>
                  <p className="mt-1.5 text-sm leading-6 text-slate-500">Mô tả vấn đề càng chi tiết, đội ngũ ZENX GO càng dễ hỗ trợ bạn.</p>
                </div>
              </div>

              {faqQuery.isError ? <Alert className="mt-6">{getErrorMessage(faqQuery.error, 'Không thể tải danh mục hỗ trợ.')}</Alert> : null}
              {createTicket.isError ? <Alert className="mt-6">{getErrorMessage(createTicket.error, 'Không thể gửi yêu cầu hỗ trợ.')}</Alert> : null}

              <form className="mt-8 space-y-5" onSubmit={form.handleSubmit((values) => createTicket.mutate(values))}>
                <FormField label="Danh mục" htmlFor="support-category" required error={form.formState.errors.categoryId?.message}>
                  <Select id="support-category" disabled={faqQuery.isLoading || !categories.length} {...form.register('categoryId')}>
                    <option value="">Chọn danh mục</option>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </Select>
                </FormField>
                <FormField label="Tiêu đề" htmlFor="support-subject" required error={form.formState.errors.subject?.message}>
                  <div className="relative"><FileText className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input id="support-subject" placeholder="Ví dụ: Đã thanh toán nhưng chưa nhận được Coin" className="pl-10" maxLength={160} {...form.register('subject')} /></div>
                </FormField>
                <FormField label="Mô tả vấn đề" htmlFor="support-description" required error={form.formState.errors.description?.message} hint="Không gửi mật khẩu, mã OTP hoặc thông tin thanh toán nhạy cảm.">
                  <Textarea id="support-description" placeholder="Hãy cho chúng tôi biết điều gì đã xảy ra..." className="min-h-40 resize-y" maxLength={4000} {...form.register('description')} />
                </FormField>
                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                  <Button asChild variant="outline" type="button"><Link href="/support">Hủy</Link></Button>
                  <Button type="submit" disabled={createTicket.isPending || faqQuery.isLoading || !categories.length} className="gap-2"><Send className="size-4" />{createTicket.isPending ? 'Đang gửi…' : 'Gửi yêu cầu'}</Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </PageFrame>
  );
}

function SuccessState({ ticket }: { ticket: SupportTicket }) {
  return (
    <div className="py-8 text-center sm:py-12">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#E8F7EC] text-[#00873E]"><CheckCircle2 className="size-9" /></div>
      <h1 className="mt-5 text-2xl font-black text-slate-900">Đã gửi yêu cầu thành công</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Đội ngũ ZENX GO đã ghi nhận vấn đề của bạn. Hãy lưu lại mã yêu cầu để tiện theo dõi.</p>
      <div className="mx-auto mt-6 max-w-sm rounded-2xl bg-[#F0FAF2] p-5"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Mã yêu cầu</p><p className="mt-2 text-xl font-black tracking-wide text-[#00873E]">{ticket.ticketNo}</p><p className="mt-1 text-xs text-slate-500">Trạng thái: Mới tiếp nhận</p></div>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Button asChild><Link href={`/account/support/${encodeURIComponent(ticket.ticketNo)}`}>Xem yêu cầu</Link></Button><Button asChild variant="zenx-outline"><Link href="/support">Xem FAQ</Link></Button></div>
    </div>
  );
}

function PageFrame({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#F8FAFC] text-slate-900"><header className="border-b border-slate-100 bg-white"><div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between px-5 sm:px-8"><BrandLogo /><Link href="/support" className="text-sm font-semibold text-slate-600 hover:text-[#00873E]">Trung tâm hỗ trợ</Link></div></header><main className="px-5 py-10 sm:px-8 sm:py-14">{children}</main><PageFooter /></div>;
}
