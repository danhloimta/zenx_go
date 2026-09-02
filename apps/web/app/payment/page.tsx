'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ApiError } from '@zenx-go/api-client';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Lock,
  Pencil,
  QrCode,
  ShieldCheck,
  Building2,
  Wallet,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { formatAmount } from '@/lib/utils';
import { useWallet } from '@/hooks/use-wallet';
import { useAccount } from '@/hooks/use-account';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MoMoLogo,
  ZaloPayLogo,
  VisaMastercardLogo,
  ZenxCoinGoldIcon,
  ZenxCoinGreenIcon,
} from '@/components/icons';

const methods = [
  {
    value: 'MOMO',
    label: 'MoMo',
    badge: 'Ưu đãi',
    detail: 'Thanh toán qua ví MoMo',
    icon: () => <MoMoLogo className="size-8" />,
  },
  {
    value: 'ZALOPAY',
    label: 'ZaloPay',
    detail: 'Thanh toán qua ZaloPay',
    icon: () => <ZaloPayLogo className="size-8" />,
  },
  {
    value: 'BANK_TRANSFER',
    label: 'Chuyển khoản ngân hàng',
    detail: 'Chuyển khoản qua ngân hàng',
    icon: () => (
      <div className="flex size-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
        <Building2 className="size-5" />
      </div>
    ),
  },
  {
    value: 'CARD',
    label: 'Thẻ Visa / Mastercard',
    detail: 'Thanh toán bằng thẻ quốc tế',
    icon: () => <VisaMastercardLogo className="h-6" />,
  },
  {
    value: 'VIETQR',
    label: 'QR Code (VietQR)',
    detail: 'Quét mã QR để thanh toán',
    icon: () => (
      <div className="flex size-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
        <QrCode className="size-5" />
      </div>
    ),
  },
] as const;

const schema = z.object({
  coinPackageId: z.string().min(1, 'Vui lòng chọn gói Coin.'),
  paymentMethod: z.enum(['MOMO', 'ZALOPAY', 'BANK_TRANSFER', 'CARD', 'VIETQR']),
});
type Values = z.infer<typeof schema>;

export default function PaymentPage() {
  const router = useRouter();
  const idempotencyKey = useRef<string>(createIdempotencyKey());
  const account = useAccount();
  const wallet = useWallet({ enabled: Boolean(account.data) });
  const packages = useQuery({
    queryKey: ['coin-packages'],
    queryFn: api.coinPackages.list,
    retry: false,
  });
  const paymentConfig = useQuery({
    queryKey: ['payment-config'],
    queryFn: api.payments.config,
    retry: false,
  });

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { coinPackageId: '', paymentMethod: 'MOMO' },
  });

  const selectedId = form.watch('coinPackageId');
  const selectedMethod = form.watch('paymentMethod');
  const availableMethods = paymentConfig.data
    ? methods.filter((method) => paymentConfig.data.methods.includes(method.value))
    : [];

  // Auto-select first package if none selected once data arrives
  const selected = packages.data?.find((item) => item.id === selectedId) || packages.data?.[0];

  useEffect(() => {
    const firstPackage = packages.data?.[0];
    const currentPackageId = form.getValues('coinPackageId');
    const currentPackageIsAvailable = packages.data?.some((item) => item.id === currentPackageId);
    if (firstPackage && (!currentPackageId || !currentPackageIsAvailable)) {
      form.setValue('coinPackageId', firstPackage.id, { shouldValidate: true });
    }
  }, [form, packages.data]);

  useEffect(() => {
    const configuredMethods = paymentConfig.data?.methods;
    if (!configuredMethods?.length) return;
    const currentMethod = form.getValues('paymentMethod');
    if (!configuredMethods.includes(currentMethod)) {
      form.setValue('paymentMethod', configuredMethods[0], { shouldValidate: true });
    }
  }, [form, paymentConfig.data]);

  const createPayment = useMutation({
    mutationFn: api.payments.create,
    onSuccess: (payment) => {
      idempotencyKey.current = createIdempotencyKey();
      router.push(`/payment/${encodeURIComponent(payment.paymentNo)}`);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'PAYMENT_FAILED') idempotencyKey.current = createIdempotencyKey();
      toast.error(getErrorMessage(error));
    },
  });

  const handleSelectPackage = (id: string) => {
    if (form.getValues('coinPackageId') !== id) idempotencyKey.current = createIdempotencyKey();
    form.setValue('coinPackageId', id, { shouldValidate: true });
  };

  const handleSelectMethod = (val: (typeof methods)[number]['value']) => {
    if (form.getValues('paymentMethod') !== val) idempotencyKey.current = createIdempotencyKey();
    form.setValue('paymentMethod', val);
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-10">
      {/* Top Banner: Wallet Balance */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#E8F7EC] text-[#00873E]">
              <Wallet className="size-7" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Số dư ví</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 tracking-tight">
                  {wallet.isLoading ? '—' : formatAmount(wallet.data?.balance)}
                </span>
                <span className="flex items-center gap-1 text-sm font-bold text-[#00873E]">
                  <ZenxCoinGoldIcon className="size-4" /> ZENX
                </span>
              </div>
            </div>
          </div>
          <img
            src="/images/wallet.png"
            alt="Ví ZENX"
            className="hidden h-24 w-auto object-contain sm:block"
          />
        </div>
      </div>

      {paymentConfig.data?.isDemo ? <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        <span><strong>Chế độ mô phỏng:</strong> các phương thức thanh toán bên dưới chỉ mô phỏng giao dịch, chưa kết nối cổng thanh toán thật.</span>
      </div> : null}

      {wallet.isError ? <Alert>{getErrorMessage(wallet.error, 'Không thể tải số dư ví.')}</Alert> : null}

      <form
          onSubmit={form.handleSubmit((values) => {
            const configuredMethods = paymentConfig.data?.methods ?? [];
            const paymentMethod = configuredMethods.includes(values.paymentMethod) ? values.paymentMethod : configuredMethods[0];
            if (!paymentMethod) return;
            createPayment.mutate({
              coinPackageId: selected?.id || values.coinPackageId,
              paymentMethod,
              idempotencyKey: idempotencyKey.current,
            });
          })}
        className="grid gap-6 lg:grid-cols-[1fr_360px]"
      >
        {/* Left Column: Choose Package & Payment Method */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
          {/* Section 1: Choose Package */}
          <div>
            <h2 className="text-base font-bold text-slate-900">1. Chọn gói nạp</h2>
            <div className="mt-4 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
              {packages.isLoading
                ? Array.from({ length: 8 }).map((_, index) => (
                    <Skeleton key={index} className="h-28 rounded-xl" />
                  ))
                : packages.isError
                ? (
                  <div className="col-span-full">
                    <Alert>{getErrorMessage(packages.error, 'Không thể tải danh sách gói Coin.')}</Alert>
                  </div>
                )
                : packages.data?.length ? (
                  <>
                    {packages.data?.map((item, index) => {
                      const isCurrent =
                        selectedId === item.id || (!selectedId && index === 0);
                      return (
                        <button
                          type="button"
                          aria-pressed={isCurrent}
                          key={item.id}
                          onClick={() => handleSelectPackage(item.id)}
                          className={`relative w-full cursor-pointer rounded-xl p-4 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00873E]/30 ${
                            isCurrent
                              ? 'border-2 border-[#00873E] bg-[#F4FAF5] shadow-xs'
                              : 'border border-slate-200 bg-white hover:border-[#00873E]/50'
                          }`}
                        >
                          {index === 0 && (
                            <span className="absolute right-2 top-2 rounded-full bg-[#00873E] px-2 py-0.5 text-[10px] font-bold text-white">
                              Phổ biến
                            </span>
                          )}
                          <div className="mx-auto flex justify-center">
                            <ZenxCoinGreenIcon className="size-7" />
                          </div>
                          <p className="mt-2.5 text-sm font-bold text-slate-900">
                            {formatAmount(item.coinAmount)} ZENX
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500 font-medium">
                            {formatAmount(item.priceVnd)} VND
                          </p>
                        </button>
                      );
                    })}

                    {/* Custom amounts are intentionally outside the fixed-package simulation scope. */}
                    <button
                      type="button"
                      disabled
                      className="cursor-not-allowed rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center opacity-70"
                    >
                      <div className="mx-auto flex size-7 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                        <Pencil className="size-3.5" />
                      </div>
                      <p className="mt-2.5 text-sm font-bold text-slate-900">Nhập số lượng</p>
                      <p className="mt-0.5 text-xs text-slate-400">Chưa hỗ trợ</p>
                    </button>
                  </>
                ) : (
                  <div className="col-span-full">
                    <Alert>Hiện chưa có gói Coin khả dụng.</Alert>
                  </div>
                )}
            </div>
            {form.formState.errors.coinPackageId?.message && (
              <p className="mt-2 text-xs text-red-600">
                {form.formState.errors.coinPackageId.message}
              </p>
            )}
          </div>

          <div className="my-8 h-px bg-slate-100" />

          {/* Section 2: Choose Payment Method */}
          <div>
            <h2 className="text-base font-bold text-slate-900">
              2. Chọn phương thức thanh toán
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {paymentConfig.isLoading ? <Skeleton className="h-20 rounded-xl sm:col-span-2" /> : null}
              {paymentConfig.isError ? <div className="sm:col-span-2"><Alert>Không thể tải cấu hình thanh toán.</Alert></div> : null}
              {availableMethods.map((method) => {
                const IconComponent = method.icon;
                const isSelected = selectedMethod === method.value;
                return (
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    key={method.value}
                    onClick={() => handleSelectMethod(method.value)}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-xl p-3.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00873E]/30 ${
                      isSelected
                        ? 'border-2 border-[#00873E] bg-[#F4FAF5] shadow-xs'
                        : 'border border-slate-200 bg-white hover:border-[#00873E]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <IconComponent />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">{method.label}</p>
                          {'badge' in method && method.badge ? (
                            <span className="rounded-full bg-[#E8F7EC] px-2 py-0.5 text-[10px] font-bold text-[#00873E]">
                              {method.badge}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{method.detail}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="size-5 shrink-0 text-[#00873E]" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs text-slate-500 font-medium">
              <ShieldCheck className="size-4 text-[#00873E]" />
              <span>Giao dịch được bảo mật tuyệt đối và xử lý nhanh chóng.</span>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <aside className="h-fit">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sticky top-24">
            <h2 className="text-base font-bold text-slate-900">3. Thông tin đơn hàng</h2>

            {selected ? (
              <div className="mt-5 space-y-3.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs">Gói nạp đã chọn</span>
                  <span className="font-bold text-[#00873E]">
                    {formatAmount(selected.coinAmount)} ZENX
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs">Số lượng Coin</span>
                  <span className="font-semibold text-slate-900">
                    {formatAmount(selected.coinAmount)} ZENX
                  </span>
                </div>

                <div className="h-px bg-slate-100 my-2" />

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs">Tạm tính</span>
                  <span className="font-semibold text-slate-900">
                    {formatAmount(selected.priceVnd)} VND
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs">Phí giao dịch</span>
                  <span className="font-bold text-[#00873E]">Miễn phí</span>
                </div>

                {/* Total Box */}
                <div className="rounded-xl bg-[#E8F7EC] p-4 my-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Tổng thanh toán</span>
                    <strong className="text-xl font-bold text-[#00873E]">
                      {formatAmount(selected.priceVnd)} VND
                    </strong>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#00873E]/15 pt-2 text-xs">
                    <span className="text-slate-600">Bạn sẽ nhận được</span>
                    <strong className="flex items-center gap-1 text-slate-900 font-bold">
                      <ZenxCoinGoldIcon className="size-3.5" />
                      {formatAmount(selected.coinAmount)} ZENX
                    </strong>
                  </div>
                </div>

                {/* Security Guarantee Box */}
                <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-[#F9FCFA] p-3 text-xs">
                  <ShieldCheck className="size-4 shrink-0 text-[#00873E] mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">Cam kết bảo mật</p>
                    <p className="mt-0.5 text-[11px] text-slate-500 leading-normal">
                      Thông tin thanh toán của bạn được mã hóa và bảo vệ theo tiêu chuẩn bảo mật cao nhất.
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="mt-4 h-12 w-full text-sm font-semibold shadow-sm gap-2"
                  disabled={createPayment.isPending || !paymentConfig.isSuccess || availableMethods.length === 0}
                >
                  <Lock className="size-4" />
                  {createPayment.isPending ? 'Đang tạo đơn…' : 'Thanh toán'}
                </Button>

                <p className="text-center text-[11px] text-slate-400 leading-tight pt-1">
                  Bằng việc nhấn “Thanh toán”, bạn đồng ý với{' '}
                  <Link href="/terms" className="font-semibold text-[#00873E] hover:underline">
                    Điều khoản sử dụng
                  </Link>{' '}
                  của ZENX GO.
                </p>
              </div>
            ) : packages.isError ? (
              <div className="py-8"><Alert>{getErrorMessage(packages.error, 'Không thể tải danh sách gói Coin.')}</Alert></div>
            ) : !packages.isLoading && !packages.data?.length ? (
              <div className="py-8"><Alert>Hiện chưa có gói Coin khả dụng.</Alert></div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Đang tải thông tin gói nạp…
              </div>
            )}
          </div>
        </aside>
      </form>
    </div>
  );
}

function createIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
