'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  Clock,
  Copy,
  Headset,
  Mail,
  MessageSquare,
  MessageSquarePlus,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  UserRound,
  X,
  Zap,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { SupportFaq } from '@zenx-go/api-client';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/brand-logo';
import { PageFooter } from '@/components/page-footer';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAccount } from '@/hooks/use-account';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';

const SUGGESTED_TAGS = [
  'Nạp Coin',
  'Xác thực SĐT',
  'Chưa nhận được Coin',
  'VietQR',
  'Đổi mật khẩu',
  'Bảo mật',
];

export default function SupportPage() {
  const query = useQuery({ queryKey: ['support', 'faqs'], queryFn: api.support.faqs, retry: false });
  const account = useAccount();
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'up' | 'down'>>({});

  const categories = query.data?.categories ?? [];
  const allFaqs = useMemo(() => {
    return categories.flatMap((category) =>
      category.faqs.map((faq) => ({ ...faq, categoryName: category.name, categoryId: category.id })),
    );
  }, [categories]);

  const filteredFaqs = useMemo(() => {
    const source =
      selectedCategory === 'ALL'
        ? allFaqs
        : allFaqs.filter((faq) => faq.categoryId === selectedCategory);
    const normalizedSearch = search.trim().toLocaleLowerCase('vi');
    if (!normalizedSearch) return source;
    return source.filter((faq) =>
      `${faq.question} ${faq.answer} ${faq.categoryName}`
        .toLocaleLowerCase('vi')
        .includes(normalizedSearch),
    );
  }, [allFaqs, search, selectedCategory]);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      toast.success(`Đã sao chép ${type}.`);
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      toast.error('Không thể sao chép.');
    }
  };

  const handleFeedback = (faqId: string, type: 'up' | 'down') => {
    setFeedbackGiven((prev) => ({ ...prev, [faqId]: type }));
    if (type === 'up') {
      toast.success('Cảm ơn bạn đã phản hồi! Chúng tôi rất vui vì thông tin hữu ích.');
    } else {
      toast.info('Cảm ơn phản hồi của bạn. Bạn có thể tạo yêu cầu hỗ trợ nếu cần giải đáp thêm.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between">
      {/* 1. Header Navigation */}
      <div>
        <header className="sticky top-0 z-30 border-b border-slate-100/80 bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-5 sm:px-8">
            <BrandLogo />
            <div className="flex items-center gap-3">
              {account.data ? (
                <>
                  <Link
                    href="/account/support"
                    className="hidden px-3 py-2 text-xs font-semibold text-slate-600 hover:text-[#00873E] sm:inline-flex items-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="size-3.5 text-slate-400" />
                    Yêu cầu của tôi
                  </Link>
                  <Button asChild size="sm" variant="zenx-outline" className="text-xs font-semibold rounded-xl h-9">
                    <Link href="/account" className="flex items-center gap-1.5">
                      <UserRound className="size-3.5" />
                      {account.data.profile?.fullName || account.data.username || 'Tài khoản'}
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="hidden px-3 py-2 text-xs font-semibold text-slate-600 hover:text-[#00873E] sm:inline-flex transition-colors"
                  >
                    Đăng nhập
                  </Link>
                  <Button asChild size="sm" className="text-xs font-semibold rounded-xl h-9 shadow-sm">
                    <Link href="/auth/register">Tạo tài khoản</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* 2. Main Content */}
        <main className="mx-auto max-w-[1240px] px-5 py-8 sm:px-8 sm:py-12 space-y-10">
          {/* Hero Search Section */}
          <section className="relative overflow-hidden rounded-3xl border border-[#D5EFE0] bg-gradient-to-br from-white via-[#F7FCF9] to-[#E9F7EE] p-7 sm:p-12 lg:p-14 shadow-sm">
            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F7EC] border border-[#00873E]/20 px-3.5 py-1 text-xs font-bold text-[#00873E]">
                <Sparkles className="size-3.5 text-[#00873E]" /> Trung tâm hỗ trợ khách hàng 24/7
              </span>

              <h1 className="mt-4 text-3xl font-black text-nowrap tracking-tight text-slate-900 sm:text-4xl lg:text-5xl leading-tight">
                Chúng tôi có thể giúp gì cho bạn?
              </h1>

              <p className="mt-3.5 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Tìm kiếm câu trả lời nhanh chóng cho các thắc mắc về tài khoản, nạp Coin, giao dịch ví và các quy định bảo mật.
              </p>

              {/* Search Bar */}
              <div className="relative mt-6 max-w-xl">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                <Input
                  aria-label="Tìm kiếm câu hỏi hỗ trợ"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Nhập câu hỏi, từ khóa cần tìm (VD: Nạp coin, OTP, VietQR...)"
                  className="h-14 rounded-2xl border-slate-200/90 bg-white pl-12 pr-12 text-sm shadow-sm transition-all focus:border-[#00873E] focus:ring-4 focus:ring-[#00873E]/10"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    aria-label="Xóa tìm kiếm"
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </div>

              {/* Search Tags Suggestions */}
              <div className="mt-4 flex items-center gap-2 flex-wrap text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Từ khóa gợi ý:</span>
                {SUGGESTED_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSearch(tag)}
                    className="rounded-lg bg-white/90 border border-slate-200/80 px-2.5 py-1 text-xs text-slate-600 hover:border-[#00873E] hover:text-[#00873E] hover:bg-white transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Decorative Element */}
            <div className="pointer-events-none absolute -bottom-10 -right-10 size-60 sm:size-80 rounded-full bg-[#00873E]/5 blur-2xl" />
            <ShieldCheck className="pointer-events-none absolute -bottom-8 right-6 size-48 text-[#D1F0DC]/60 sm:right-12 sm:size-64" strokeWidth={1} />
          </section>

          {/* Quick Value Props Bar */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#E8F7EC] text-[#00873E]">
                <Zap className="size-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Phản hồi siêu tốc</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Tiếp nhận & giải đáp trung bình dưới 15 phút</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#E8F7EC] text-[#00873E]">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Bảo mật tuyệt đối</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Dữ liệu trao đổi và giao dịch được mã hóa an toàn</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#E8F7EC] text-[#00873E]">
                <Headset className="size-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Đội ngũ tận tâm 24/7</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Sẵn sàng hỗ trợ qua Hotline, Email & Ticket</p>
              </div>
            </div>
          </div>

          {/* 3. FAQ Section */}
          <section className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.18em] text-[#00873E]">
                  <CircleHelp className="size-3.5" /> Câu hỏi thường gặp
                </span>
                <h2 className="mt-1.5 text-2xl sm:text-3xl font-black text-slate-900">
                  Câu hỏi & Giải đáp phổ biến
                </h2>
              </div>
              <Button asChild className="gap-2 font-semibold text-xs h-11 px-5 rounded-xl shadow-sm">
                <Link href="/support/report-issue">
                  <MessageSquarePlus className="size-4" />
                  Gửi yêu cầu hỗ trợ mới
                </Link>
              </Button>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none" role="tablist" aria-label="Danh mục hỗ trợ">
              <CategoryTab
                active={selectedCategory === 'ALL'}
                count={allFaqs.length}
                onClick={() => setSelectedCategory('ALL')}
              >
                Tất cả
              </CategoryTab>
              {categories.map((category) => (
                <CategoryTab
                  key={category.id}
                  active={selectedCategory === category.id}
                  count={category.faqs.length}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </CategoryTab>
              ))}
            </div>

            {/* Search Filter Alert / Counter */}
            {search.trim() ? (
              <div className="flex items-center justify-between rounded-xl bg-slate-100/90 px-4 py-2.5 text-xs text-slate-700">
                <span>
                  Tìm thấy <strong className="text-[#00873E] font-bold">{filteredFaqs.length}</strong> kết quả cho từ khóa &ldquo;<strong className="text-slate-900">{search}</strong>&rdquo;
                </span>
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="font-semibold text-slate-500 hover:text-slate-900 underline"
                >
                  Xóa lọc
                </button>
              </div>
            ) : null}

            {/* FAQ Accordion List */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-7 shadow-sm">
              {query.isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-16 rounded-xl" />
                  ))}
                </div>
              ) : query.isError ? (
                <Alert>{getErrorMessage(query.error, 'Không thể tải câu hỏi thường gặp.')}</Alert>
              ) : filteredFaqs.length > 0 ? (
                <div className="space-y-3">
                  {filteredFaqs.map((faq) => (
                    <FaqItem
                      key={faq.id}
                      faq={faq}
                      feedback={feedbackGiven[faq.id]}
                      onFeedback={(type) => handleFeedback(faq.id, type)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-48 flex-col items-center justify-center text-center p-6">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                    <CircleHelp className="size-8 text-slate-400" />
                  </div>
                  <p className="mt-3.5 font-bold text-slate-800 text-base">Không tìm thấy câu hỏi phù hợp</p>
                  <p className="mt-1 text-xs text-slate-500 max-w-md">
                    Thử tìm kiếm với từ khóa khác hoặc bấm nút bên dưới để gửi yêu cầu hỗ trợ trực tiếp tới nhân viên chăm sóc khách hàng.
                  </p>
                  <Button asChild size="sm" className="mt-4 gap-1.5 text-xs font-semibold rounded-xl">
                    <Link href="/support/report-issue">
                      <MessageSquarePlus className="size-4" />
                      Tạo yêu cầu hỗ trợ ngay
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* 4. Multi-channel Support Channels */}
          <section className="space-y-4 pt-2">
            <div>
              <h2 className="text-xl font-black text-slate-900">Các kênh liên hệ khác</h2>
              <p className="mt-1 text-xs text-slate-500">
                Nếu bạn cần hỗ trợ khẩn cấp hoặc xử lý khiếu nại giao dịch, hãy liên hệ qua các kênh dưới đây:
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {/* Channel 1: Ticket Support */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between hover:border-[#00873E]/30 transition-colors">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-[#E8F7EC] text-[#00873E]">
                      <MessageSquarePlus className="size-5" />
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-[#00873E] border border-emerald-200/60">
                      Khuyên dùng
                    </span>
                  </div>
                  <h3 className="mt-4 font-bold text-slate-900 text-sm">Gửi yêu cầu hỗ trợ (Ticket)</h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Dành cho các lỗi nạp Coin, hoàn tiền, xác thực tài khoản cần gửi kèm hình ảnh & chứng từ.
                  </p>
                </div>
                <Button asChild variant="zenx-outline" size="sm" className="mt-5 w-full text-xs font-semibold rounded-xl h-9">
                  <Link href="/support/report-issue" className="gap-1.5">
                    Tạo ticket ngay <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </div>

              {/* Channel 2: Hotline */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between hover:border-[#00873E]/30 transition-colors">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-[#E8F7EC] text-[#00873E]">
                      <Phone className="size-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">8:00 - 22:00</span>
                  </div>
                  <h3 className="mt-4 font-bold text-slate-900 text-sm">Tổng đài Hotline</h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Tư vấn viên trực tiếp giải đáp mọi thắc mắc và hỗ trợ nhanh chóng qua điện thoại.
                  </p>
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <a
                    href="tel:19001234"
                    className="flex-1 inline-flex items-center justify-center rounded-xl bg-[#00873E] px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#007234] transition-colors"
                  >
                    Gọi 1900 1234
                  </a>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('19001234', 'số điện thoại hotline')}
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    title="Sao chép số điện thoại"
                    aria-label="Sao chép số hotline"
                  >
                    {copiedType === 'số điện thoại hotline' ? <Check className="size-4 text-[#00873E]" /> : <Copy className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Channel 3: Email */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between hover:border-[#00873E]/30 transition-colors">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-[#E8F7EC] text-[#00873E]">
                      <Mail className="size-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">Phản hồi 24/7</span>
                  </div>
                  <h3 className="mt-4 font-bold text-slate-900 text-sm">Hộp thư điện tử</h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Gửi thư mô tả chi tiết vấn đề kèm thông tin giao dịch cần đối soát ngoài giờ hành chính.
                  </p>
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <a
                    href="mailto:support@zenxgo.vn"
                    className="flex-1 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:border-[#00873E] hover:text-[#00873E] transition-colors"
                  >
                    support@zenxgo.vn
                  </a>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('support@zenxgo.vn', 'địa chỉ email')}
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    title="Sao chép địa chỉ email"
                    aria-label="Sao chép email hỗ trợ"
                  >
                    {copiedType === 'địa chỉ email' ? <Check className="size-4 text-[#00873E]" /> : <Copy className="size-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Banner: View existing tickets */}
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-[#E8F7EC]/60 border border-[#D0EED8] p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#00873E] text-white">
                  <Clock className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Bạn đã gửi yêu cầu hỗ trợ trước đó?</p>
                  <p className="text-[11px] text-slate-600">Kiểm tra phản hồi và tiến độ xử lý của kỹ thuật viên tại trang quản lý yêu cầu.</p>
                </div>
              </div>
              <Button asChild size="sm" variant="zenx-outline" className="shrink-0 text-xs font-semibold rounded-xl h-9 px-4">
                <Link href="/account/support" className="flex items-center gap-1.5">
                  Tra cứu tiến độ ticket <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </section>
        </main>
      </div>

      {/* 5. Footer */}
      <PageFooter />
    </div>
  );
}

function CategoryTab({
  active,
  count,
  children,
  onClick,
}: {
  active: boolean;
  count?: number;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all shadow-none',
        active
          ? 'bg-[#00873E] text-white shadow-sm ring-2 ring-[#00873E]/20'
          : 'border border-slate-200/90 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
      )}
    >
      <span>{children}</span>
      {typeof count === 'number' && (
        <span
          className={cn(
            'rounded-full px-1.5 py-0.2 text-[11px] font-bold',
            active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500',
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function FaqItem({
  faq,
  feedback,
  onFeedback,
}: {
  faq: SupportFaq & { categoryName?: string };
  feedback?: 'up' | 'down';
  onFeedback: (type: 'up' | 'down') => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        'rounded-xl border transition-all duration-150 overflow-hidden',
        open
          ? 'border-[#00873E]/30 bg-slate-50/50 shadow-xs'
          : 'border-slate-100 hover:border-slate-200 bg-white',
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 p-4 sm:p-5 text-left text-sm font-bold text-slate-800 transition-colors hover:text-[#00873E]"
      >
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          {faq.categoryName && (
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 shrink-0">
              {faq.categoryName}
            </span>
          )}
          <span className="text-sm font-bold text-slate-900 leading-snug">{faq.question}</span>
        </div>
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <ChevronDown
            className={cn('size-4 transition-transform duration-200', open && 'rotate-180 text-[#00873E]')}
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100/80 px-4 sm:px-5 pb-5 pt-3 space-y-4">
          <div className="text-xs sm:text-sm leading-relaxed text-slate-600 whitespace-pre-line">
            {faq.answer}
          </div>

          {/* Helpful Feedback Widget */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-lg bg-white border border-slate-100 p-3 text-xs">
            <span className="text-slate-500 font-medium">Câu trả lời này có hữu ích với bạn không?</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onFeedback('up')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors',
                  feedback === 'up'
                    ? 'bg-[#E8F7EC] text-[#00873E] border border-[#00873E]/30'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50',
                )}
              >
                <ThumbsUp className="size-3.5" /> Có
              </button>
              <button
                type="button"
                onClick={() => onFeedback('down')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors',
                  feedback === 'down'
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50',
                )}
              >
                <ThumbsDown className="size-3.5" /> Chưa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
