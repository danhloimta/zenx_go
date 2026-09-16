'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupportCategory, SupportFaq, SupportTicket, SupportTicketStatus } from '@zenx-go/api-client';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock,
  Headset,
  Inbox,
  Loader2,
  Mail,
  MessageCircle,
  MessageSquare,
  MessageSquarePlus,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Ticket,
  X,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { formatDate } from '@/lib/utils';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/status-badge';
import { SupportMarkdown } from '@/components/support-markdown';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

type SupportTab = 'tickets' | 'create' | 'faq';

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PENDING', label: 'Đang xử lý' },
  { value: 'WAITING_USER', label: 'Chờ bạn phản hồi' },
  { value: 'RESOLVED', label: 'Đã giải quyết' },
];

export default function AccountSupportPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  // Active Tab state synced with ?tab= query
  const queryTab = searchParams.get('tab');
  const activeTab: SupportTab =
    queryTab === 'create' || queryTab === 'faq' ? queryTab : 'tickets';

  const setTab = (nextTab: SupportTab) => {
    const params = new URLSearchParams(searchParams);
    if (nextTab === 'tickets') {
      params.delete('tab');
    } else {
      params.set('tab', nextTab);
    }
    router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false });
  };

  // State for ticket filters & pagination
  const [ticketPage, setTicketPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Quick Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // State for FAQ Search & Category
  const [faqSearch, setFaqSearch] = useState('');
  const [selectedFaqCategory, setSelectedFaqCategory] = useState('ALL');
  const [faqFeedback, setFaqFeedback] = useState<Record<string, 'up' | 'down'>>({});

  // Query: Tickets list
  const ticketsQuery = useQuery({
    queryKey: ['support', 'tickets', { page: ticketPage, pageSize: PAGE_SIZE }],
    queryFn: () => api.support.tickets({ page: ticketPage, pageSize: PAGE_SIZE }),
    retry: false,
  });

  // Query: FAQs & Categories
  const faqQuery = useQuery({
    queryKey: ['support', 'faqs'],
    queryFn: api.support.faqs,
    retry: false,
  });

  const categories = faqQuery.data?.categories ?? [];
  const rawTickets = ticketsQuery.data?.items ?? [];
  const totalTickets = ticketsQuery.data?.total ?? rawTickets.length;

  // Filtered tickets on client side by selected status tab
  const filteredTickets = useMemo(() => {
    if (statusFilter === 'ALL') return rawTickets;
    if (statusFilter === 'PENDING') {
      return rawTickets.filter((t) => t.status === 'NEW' || t.status === 'IN_PROGRESS');
    }
    if (statusFilter === 'WAITING_USER') {
      return rawTickets.filter((t) => t.status === 'WAITING_USER');
    }
    if (statusFilter === 'RESOLVED') {
      return rawTickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED');
    }
    return rawTickets;
  }, [rawTickets, statusFilter]);

  // KPI calculations
  const kpi = useMemo(() => {
    const pendingCount = rawTickets.filter(
      (t) => t.status === 'NEW' || t.status === 'IN_PROGRESS',
    ).length;
    const waitingUserCount = rawTickets.filter((t) => t.status === 'WAITING_USER').length;
    const resolvedCount = rawTickets.filter(
      (t) => t.status === 'RESOLVED' || t.status === 'CLOSED',
    ).length;

    return {
      total: totalTickets,
      pending: pendingCount,
      waitingUser: waitingUserCount,
      resolved: resolvedCount,
    };
  }, [rawTickets, totalTickets]);

  const totalPages = Math.max(1, ticketsQuery.data?.totalPages ?? 1);

  // Flatten FAQs for searching
  const allFaqs = useMemo(() => {
    return categories.flatMap((cat) =>
      cat.faqs.map((faq) => ({
        ...faq,
        categoryId: cat.id,
        categoryName: cat.name,
      })),
    );
  }, [categories]);

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    const source =
      selectedFaqCategory === 'ALL'
        ? allFaqs
        : allFaqs.filter((f) => f.categoryId === selectedFaqCategory);
    const term = faqSearch.trim().toLowerCase();
    if (!term) return source;
    return source.filter(
      (f) =>
        f.question.toLowerCase().includes(term) ||
        f.answer.toLowerCase().includes(term) ||
        f.categoryName.toLowerCase().includes(term),
    );
  }, [allFaqs, faqSearch, selectedFaqCategory]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        ticketsQuery.refetch(),
        faqQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: ['support', 'unread-count'] }),
      ]);
      toast.success('Đã làm mới dữ liệu hỗ trợ mới nhất');
    } catch {
      toast.error('Lỗi khi tải lại dữ liệu');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFeedback = (faqId: string, type: 'up' | 'down') => {
    setFaqFeedback((prev) => ({ ...prev, [faqId]: type }));
    if (type === 'up') {
      toast.success('Cảm ơn bạn! Phản hồi giúp chúng tôi nâng cao chất lượng hỗ trợ.');
    } else {
      toast.info('Cảm ơn phản hồi! Bạn có thể tạo yêu cầu hỗ trợ mới để được giải đáp kỹ hơn.');
    }
  };

  return (
    <div className="mx-auto max-w-[1240px] space-y-7 pb-12">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#00873E]">
            <Headset className="size-4" />
            <span className="uppercase tracking-wider">HỖ TRỢ KHÁCH HÀNG 24/7</span>
          </div>
          <h1 className="mt-1.5 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Trung tâm hỗ trợ & Yêu cầu
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Gửi yêu cầu hỗ trợ trực tiếp, theo dõi tiến độ giải quyết và tra cứu câu hỏi thường gặp ngay trong tài khoản.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || ticketsQuery.isFetching}
            className="h-10 rounded-xl px-3.5 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw
              className={`size-3.5 mr-1.5 ${isRefreshing || ticketsQuery.isFetching ? 'animate-spin text-[#00873E]' : ''}`}
            />
            <span>Làm mới</span>
          </Button>

          <Button
            type="button"
            onClick={() => {
              if (activeTab !== 'create') {
                setIsCreateModalOpen(true);
              }
            }}
            className="h-10 rounded-xl px-5 text-xs font-bold bg-[#00873E] hover:bg-[#007335] text-white shadow-xs"
          >
            <Plus className="size-4 mr-1.5" />
            <span>Tạo yêu cầu mới</span>
          </Button>
        </div>
      </div>

      {/* 4 Thẻ thống kê KPI */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Tổng yêu cầu */}
        <button
          type="button"
          onClick={() => {
            setTab('tickets');
            setStatusFilter('ALL');
          }}
          className={`group flex flex-col justify-between rounded-2xl border p-4 sm:p-5 text-left transition-all ${
            activeTab === 'tickets' && statusFilter === 'ALL'
              ? 'border-[#00873E] bg-emerald-50/40 shadow-xs ring-1 ring-[#00873E]/20'
              : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Tổng yêu cầu</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 group-hover:bg-[#00873E]/10 group-hover:text-[#00873E] transition-colors">
              <Ticket className="size-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{kpi.total}</span>
            <span className="text-[11px] font-semibold text-slate-400">yêu cầu</span>
          </div>
        </button>

        {/* Đang xử lý */}
        <button
          type="button"
          onClick={() => {
            setTab('tickets');
            setStatusFilter('PENDING');
          }}
          className={`group flex flex-col justify-between rounded-2xl border p-4 sm:p-5 text-left transition-all ${
            activeTab === 'tickets' && statusFilter === 'PENDING'
              ? 'border-sky-500 bg-sky-50/40 shadow-xs ring-1 ring-sky-500/20'
              : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Đang xử lý</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <Clock className="size-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-sky-700">{kpi.pending}</span>
            <span className="text-[11px] font-semibold text-slate-400">ticket</span>
          </div>
        </button>

        {/* Chờ bạn phản hồi */}
        <button
          type="button"
          onClick={() => {
            setTab('tickets');
            setStatusFilter('WAITING_USER');
          }}
          className={`group relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 text-left transition-all ${
            activeTab === 'tickets' && statusFilter === 'WAITING_USER'
              ? 'border-amber-500 bg-amber-50/50 shadow-xs ring-1 ring-amber-500/20'
              : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <span>Cần phản hồi</span>
              {kpi.waitingUser > 0 ? (
                <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              ) : null}
            </span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <MessageSquare className="size-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{kpi.waitingUser}</span>
            <span className="text-[11px] font-semibold text-slate-400">cần xem</span>
          </div>
        </button>

        {/* Đã giải quyết */}
        <button
          type="button"
          onClick={() => {
            setTab('tickets');
            setStatusFilter('RESOLVED');
          }}
          className={`group flex flex-col justify-between rounded-2xl border p-4 sm:p-5 text-left transition-all ${
            activeTab === 'tickets' && statusFilter === 'RESOLVED'
              ? 'border-emerald-500 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-500/20'
              : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Đã giải quyết</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-100 text-[#00873E]">
              <CheckCircle2 className="size-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#00873E]">{kpi.resolved}</span>
            <span className="text-[11px] font-semibold text-slate-400">hoàn tất</span>
          </div>
        </button>
      </div>

      {/* Main Tabs Header */}
      <div className="border-b border-slate-200">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setTab('tickets')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'tickets'
                ? 'border-[#00873E] text-[#00873E]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageCircle className="size-4" />
            <span>Yêu cầu của tôi</span>
            <span
              className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                activeTab === 'tickets'
                  ? 'bg-emerald-100 text-[#00873E]'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {totalTickets}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab('create')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'border-[#00873E] text-[#00873E]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquarePlus className="size-4" />
            <span>Gửi yêu cầu mới</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('faq')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'faq'
                ? 'border-[#00873E] text-[#00873E]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CircleHelp className="size-4" />
            <span>Câu hỏi thường gặp (FAQ)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: YÊU CẦU CỦA TÔI */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {/* Sub-toolbar filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    statusFilter === filter.value
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <span className="text-xs font-semibold text-slate-500 self-end sm:self-auto pr-2">
              Hiển thị <strong className="text-slate-800">{filteredTickets.length}</strong> yêu cầu
            </span>
          </div>

          {/* Ticket Table Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            {ticketsQuery.isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : ticketsQuery.isError ? (
              <div className="p-6">
                <Alert>{getErrorMessage(ticketsQuery.error, 'Không thể tải danh sách yêu cầu.')}</Alert>
              </div>
            ) : !filteredTickets.length ? (
              <div className="py-14 text-center px-4">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Inbox className="size-7" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-800">
                  {statusFilter === 'ALL'
                    ? 'Bạn chưa có yêu cầu hỗ trợ nào'
                    : 'Không có yêu cầu phù hợp với bộ lọc'}
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  {statusFilter === 'ALL'
                    ? 'Khi gặp bất kỳ sự cố nào về tài khoản, nạp Coin hoặc trong game, hãy gửi yêu cầu để được hỗ trợ nhanh chóng.'
                    : 'Thử chuyển sang bộ lọc "Tất cả" hoặc tạo một yêu cầu mới.'}
                </p>
                <div className="mt-5 flex items-center justify-center gap-3">
                  {statusFilter !== 'ALL' ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setStatusFilter('ALL')}
                      className="rounded-xl text-xs font-bold"
                    >
                      Xem tất cả
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setTab('create')}
                    className="rounded-xl text-xs font-bold bg-[#00873E] hover:bg-[#007335]"
                  >
                    <Plus className="size-3.5 mr-1" />
                    Tạo yêu cầu ngay
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-3.5 pl-6 pr-4">Mã yêu cầu</th>
                        <th className="px-4 py-3.5">Tiêu đề & Nội dung</th>
                        <th className="px-4 py-3.5">Danh mục</th>
                        <th className="px-4 py-3.5">Ngày gửi</th>
                        <th className="px-4 py-3.5">Trạng thái</th>
                        <th className="py-3.5 pr-6 pl-4 text-right">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTickets.map((ticket) => (
                        <tr
                          key={ticket.ticketNo}
                          className="group hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="py-4 pl-6 pr-4 align-top whitespace-nowrap">
                            <Link
                              href={`/account/support/${encodeURIComponent(ticket.ticketNo)}`}
                              className="font-mono text-xs font-bold text-[#00873E] hover:underline"
                            >
                              #{ticket.ticketNo}
                            </Link>
                          </td>

                          <td className="px-4 py-4 max-w-[320px] align-top">
                            <Link
                              href={`/account/support/${encodeURIComponent(ticket.ticketNo)}`}
                              className="block font-bold text-slate-900 group-hover:text-[#00873E] transition-colors leading-snug"
                            >
                              {ticket.subject}
                            </Link>
                            <p className="mt-1 line-clamp-2 text-xs text-slate-500 leading-relaxed">
                              {ticket.description}
                            </p>
                          </td>

                          <td className="px-4 py-4 align-top whitespace-nowrap">
                            <Badge
                              variant="default"
                              className="border border-slate-200 bg-slate-50 text-slate-700 font-semibold text-[11px]"
                            >
                              {ticket.category.name}
                            </Badge>
                          </td>

                          <td className="px-4 py-4 align-top whitespace-nowrap text-xs text-slate-500">
                            {formatDate(ticket.createdAt)}
                          </td>

                          <td className="px-4 py-4 align-top whitespace-nowrap">
                            <StatusBadge status={ticket.status} />
                          </td>

                          <td className="py-4 pr-6 pl-4 align-top text-right whitespace-nowrap">
                            <Button
                              asChild
                              size="sm"
                              variant="ghost"
                              className="h-8 rounded-lg px-2.5 text-xs font-bold text-[#00873E] hover:bg-emerald-50 hover:text-[#007335]"
                            >
                              <Link
                                href={`/account/support/${encodeURIComponent(ticket.ticketNo)}`}
                                className="flex items-center gap-1"
                              >
                                <span>Xem</span>
                                <ArrowRight className="size-3.5" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3.5 text-xs text-slate-600 bg-slate-50/40">
                    <span>
                      Trang <strong className="font-bold text-slate-900">{ticketPage}</strong> / {totalPages}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={ticketPage <= 1}
                        onClick={() => setTicketPage((p) => p - 1)}
                        className="h-8 rounded-lg px-2.5 text-xs font-bold"
                      >
                        <ChevronLeft className="size-3.5 mr-1" /> Trước
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={ticketPage >= totalPages}
                        onClick={() => setTicketPage((p) => p + 1)}
                        className="h-8 rounded-lg px-2.5 text-xs font-bold"
                      >
                        Sau <ChevronRight className="size-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TẠO YÊU CẦU MỚI */}
      {activeTab === 'create' && (
        <CreateTicketSection
          categories={categories}
          onSuccess={(ticket) => {
            setTab('tickets');
            ticketsQuery.refetch();
          }}
          onCancel={() => setTab('tickets')}
        />
      )}

      {/* TAB 3: CÂU HỎI THƯỜNG GẶP (FAQ) */}
      {activeTab === 'faq' && (
        <div className="space-y-6">
          {/* FAQ Search Hero Box */}
          <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/40 to-sky-50/40 p-6 sm:p-8 shadow-xs">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-emerald-200 px-3 py-1 text-xs font-bold text-[#00873E]">
                <Sparkles className="size-3.5" /> GIẢI ĐÁP THẮC MẮC NHANH
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Tìm kiếm câu trả lời nhanh chóng
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Nhập câu hỏi hoặc chọn danh mục bên dưới để tra cứu các vấn đề về tài khoản, nạp Coin và quy định bảo mật.
              </p>

              {/* Search Bar */}
              <div className="relative pt-2">
                <Search className="pointer-events-none absolute left-3.5 top-5 size-4 text-slate-400" />
                <Input
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  placeholder="Nhập từ khóa tìm kiếm (VD: Nạp Coin, VietQR, OTP, Đổi mật khẩu...)"
                  className="h-11 rounded-xl pl-10 pr-9 text-xs sm:text-sm bg-white border-slate-200 shadow-2xs focus:border-[#00873E]"
                />
                {faqSearch ? (
                  <button
                    type="button"
                    onClick={() => setFaqSearch('')}
                    className="absolute right-3 top-5 text-slate-400 hover:text-slate-600"
                    aria-label="Xóa tìm kiếm"
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedFaqCategory('ALL')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedFaqCategory === 'ALL'
                  ? 'bg-[#00873E] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              Tất cả ({allFaqs.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedFaqCategory(cat.id)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedFaqCategory === cat.id
                    ? 'bg-[#00873E] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {cat.name} ({cat.faqs.length})
              </button>
            ))}
          </div>

          {/* FAQ List */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-sm">
            {faqQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredFaqs.length === 0 ? (
              <div className="py-10 text-center">
                <CircleHelp className="size-10 mx-auto text-slate-400" />
                <p className="mt-3 text-sm font-bold text-slate-700">
                  Không tìm thấy câu hỏi phù hợp
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Thử tìm với từ khóa khác hoặc bấm nút bên dưới để gửi yêu cầu hỗ trợ trực tiếp.
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setTab('create')}
                  className="mt-4 rounded-xl text-xs font-bold bg-[#00873E] hover:bg-[#007335]"
                >
                  Gửi yêu cầu hỗ trợ mới
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFaqs.map((faq) => (
                  <AccountFaqItem
                    key={faq.id}
                    faq={faq}
                    feedback={faqFeedback[faq.id]}
                    onFeedback={(type) => handleFeedback(faq.id, type)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Need More Help Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-slate-900 text-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#00873E] text-white">
                <Headset className="size-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Vẫn cần thêm trợ giúp từ kỹ thuật viên?</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Đội ngũ CSKH ZENX GO luôn trực tuyến 24/7 để tiếp nhận và phản hồi yêu cầu của bạn.
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => setTab('create')}
              className="rounded-xl px-5 h-10 text-xs font-bold bg-[#00873E] hover:bg-[#007335] text-white shrink-0 shadow-sm"
            >
              Gửi yêu cầu hỗ trợ ngay
            </Button>
          </div>
        </div>
      )}

      {/* Quick Create Modal Dialog */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              aria-label="Đóng"
            >
              <X className="size-5" />
            </button>

            <CreateTicketSection
              categories={categories}
              isModal
              onSuccess={(ticket) => {
                setIsCreateModalOpen(false);
                setTab('tickets');
                ticketsQuery.refetch();
              }}
              onCancel={() => setIsCreateModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Component Form Tạo Ticket Hỗ Trợ
 */
function CreateTicketSection({
  categories,
  isModal = false,
  onSuccess,
  onCancel,
}: {
  categories: SupportCategory[];
  isModal?: boolean;
  onSuccess: (ticket: SupportTicket) => void;
  onCancel: () => void;
}) {
  const queryClient = useQueryClient();
  const [categoryId, setCategoryId] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!categoryId && categories[0]) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const createMutation = useMutation({
    mutationFn: api.support.createTicket,
    onSuccess: (ticket) => {
      toast.success(`Đã tạo yêu cầu hỗ trợ #${ticket.ticketNo} thành công!`);
      void queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] });
      void queryClient.invalidateQueries({ queryKey: ['support', 'unread-count'] });
      onSuccess(ticket);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Không thể gửi yêu cầu hỗ trợ. Vui lòng thử lại.'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      toast.error('Vui lòng chọn danh mục hỗ trợ');
      return;
    }
    if (subject.trim().length < 3) {
      toast.error('Tiêu đề yêu cầu cần ít nhất 3 ký tự');
      return;
    }
    if (description.trim().length < 10) {
      toast.error('Mô tả chi tiết cần ít nhất 10 ký tự');
      return;
    }

    createMutation.mutate({
      categoryId,
      subject: subject.trim(),
      description: description.trim(),
    });
  };

  return (
    <div
      className={
        isModal
          ? 'space-y-5'
          : 'rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6 max-w-3xl'
      }
    >
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-[#00873E]">
          <MessageSquarePlus className="size-4" />
          <span>PHIẾU YÊU CẦU HỖ TRỢ</span>
        </div>
        <h2 className="mt-1 text-xl sm:text-2xl font-black text-slate-900">
          Gửi yêu cầu hỗ trợ mới
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Vui lòng điền đầy đủ thông tin để kỹ thuật viên kiểm tra và giải quyết nhanh nhất.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Danh mục */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">
            Danh mục hỗ trợ <span className="text-red-500">*</span>
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-xs sm:text-sm font-medium text-slate-800 shadow-2xs focus:border-[#00873E] focus:outline-none focus:ring-2 focus:ring-[#00873E]/10"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tiêu đề */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">
            Tiêu đề yêu cầu <span className="text-red-500">*</span>
          </label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Tóm tắt ngắn gọn vấn đề (VD: Chưa nhận được Coin sau giao dịch VietQR)"
            className="h-11 rounded-xl text-xs sm:text-sm font-medium border-slate-200 shadow-2xs focus:border-[#00873E]"
            maxLength={160}
          />
        </div>

        {/* Mô tả chi tiết */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">
            Mô tả chi tiết <span className="text-red-500">*</span>
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Cung cấp các thông tin liên quan: Mã giao dịch (nếu có), Tên tài khoản, Thời điểm xảy ra lỗi, thiết bị bạn đang dùng..."
            className="rounded-xl text-xs sm:text-sm font-medium border-slate-200 shadow-2xs focus:border-[#00873E] resize-none leading-relaxed"
            maxLength={4000}
          />
          <div className="flex justify-between text-[11px] text-slate-400 px-1">
            <span>Tối thiểu 10 ký tự</span>
            <span>{description.length} / 4000</span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={createMutation.isPending}
            className="h-10 rounded-xl px-4 text-xs font-bold border-slate-200 text-slate-700"
          >
            Hủy bỏ
          </Button>

          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="h-10 rounded-xl px-6 text-xs font-bold bg-[#00873E] hover:bg-[#007335] text-white shadow-xs"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin mr-1.5" />
                <span>Đang gửi...</span>
              </>
            ) : (
              <>
                <Send className="size-3.5 mr-1.5" />
                <span>Gửi yêu cầu hỗ trợ</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

/**
 * FAQ Accordion Item
 */
function AccountFaqItem({
  faq,
  feedback,
  onFeedback,
}: {
  faq: SupportFaq & { categoryName?: string };
  feedback?: 'up' | 'down';
  onFeedback: (type: 'up' | 'down') => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white transition-all overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
      >
        <div className="space-y-1">
          <span className="text-xs sm:text-sm font-bold text-slate-900 block leading-snug">
            {faq.question}
          </span>
          {faq.categoryName ? (
            <span className="text-[11px] font-semibold text-[#00873E]">
              {faq.categoryName}
            </span>
          ) : null}
        </div>
        <ChevronDown
          className={`size-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#00873E]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="border-t border-slate-100 bg-[#F9FBFA] p-4 sm:p-5 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-4">
          <SupportMarkdown>{faq.answer}</SupportMarkdown>

          <div className="pt-2 flex items-center justify-between border-t border-slate-200/60 text-xs text-slate-500">
            <span>Thông tin này có hữu ích với bạn không?</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onFeedback('up')}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                  feedback === 'up'
                    ? 'bg-emerald-100 text-[#00873E]'
                    : 'bg-white border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ThumbsUp className="size-3" />
                <span>Có</span>
              </button>
              <button
                type="button"
                onClick={() => onFeedback('down')}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                  feedback === 'down'
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-white border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ThumbsDown className="size-3" />
                <span>Chưa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
