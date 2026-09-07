'use client';

import Link from 'next/link';
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAdminFinancePayment, useAdminFinancePaymentActions } from '@/hooks/use-finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { bankNameMap, formatAmount, formatDate, paymentMethodLabels } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errors';
import { toast } from 'sonner';

const statusBadge: Record<string, { label: string; className: string }> = {
  CREATED: { label: 'Chờ thanh toán', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  PENDING: { label: 'Chờ thanh toán', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  SUCCESS: { label: 'Thành công', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  FAILED: { label: 'Thất bại', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  EXPIRED: { label: 'Hết hạn', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  REFUNDED: { label: 'Đã hoàn tiền', className: 'bg-purple-50 text-purple-700 border-purple-200' },
};

type ActionKind = 'success' | 'fail' | 'expire' | 'cancel' | 'refund';

function parsePayload(payload: unknown): Record<string, any> | null {
  if (!payload) return null;
  if (typeof payload === 'object') return payload as Record<string, any>;
  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload);
    } catch {
      return null;
    }
  }
  return null;
}

export default function AdminFinancePaymentDetailPage() {
  const params = useParams<{ paymentNo: string }>();
  const paymentNo = decodeURIComponent(params.paymentNo);
  const query = useAdminFinancePayment(paymentNo);
  const actions = useAdminFinancePaymentActions(paymentNo);

  const [providerTransactionId, setProviderTransactionId] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [confirmKind, setConfirmKind] = useState<ActionKind | null>(null);
  const [missingTxError, setMissingTxError] = useState(false);

  useEffect(() => {
    if (query.data?.providerTransactionId && !query.data.providerTransactionId.startsWith('*')) {
      setProviderTransactionId(query.data.providerTransactionId);
    }
  }, [query.data?.providerTransactionId]);

  const copy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Đã sao chép');
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleExecuteAction = () => {
    if (!confirmKind || !query.data) return;
    const payment = query.data;
    const input = { expectedUpdatedAt: payment.updatedAt };

    if (confirmKind === 'success') {
      actions.confirmSuccess.mutate(
        {
          expectedUpdatedAt: payment.updatedAt,
          providerTransactionId: providerTransactionId.trim() || undefined,
        },
        {
          onSuccess: () => {
            toast.success('Đã duyệt đơn và cộng Coin.');
            setConfirmKind(null);
          },
          onError: (error) => toast.error(getErrorMessage(error)),
        },
      );
    } else {
      const mutationMap = {
        fail: actions.fail,
        expire: actions.expire,
        cancel: actions.cancel,
        refund: actions.refund,
      };
      mutationMap[confirmKind].mutate(input, {
        onSuccess: () => {
          toast.success('Cập nhật trạng thái thành công.');
          setConfirmKind(null);
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      });
    }
  };

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-6 text-center text-rose-900">
        <XCircle className="mx-auto size-8 text-rose-500" />
        <p className="mt-2 text-sm font-bold">Không tìm thấy đơn nạp tiền</p>
        <Button asChild variant="outline" size="sm" className="mt-4 rounded-xl">
          <Link href="/admin/finance/payments">Quay lại danh sách</Link>
        </Button>
      </div>
    );
  }

  const payment = query.data;
  const status = statusBadge[payment.status] || {
    label: payment.status,
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const isPending =
    actions.confirmSuccess.isPending ||
    actions.fail.isPending ||
    actions.expire.isPending ||
    actions.cancel.isPending ||
    actions.refund.isPending;

  const payload = parsePayload(payment.providerPayload);
  const metadata = payload?.displayMetadata || {};
  const qrImageUrl = payload?.qrImageUrl;
  const bankAccount = metadata.bankAccount || '';
  const accountHolder = metadata.accountHolder || '';
  const bankName = bankNameMap[metadata.bankCode] || (metadata.bankCode ? `Ngân hàng ${metadata.bankCode}` : '');
  const userName = payment.user.profile?.fullName || payment.user.username;

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Compact Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <Button asChild variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-slate-100">
            <Link href="/admin/finance/payments">
              <ArrowLeft className="size-4 text-slate-600" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 font-mono tracking-tight">
              {payment.paymentNo}
            </h1>
            <button
              type="button"
              onClick={() => copy(payment.paymentNo, 'paymentNo')}
              className="text-slate-400 hover:text-slate-700 transition-colors p-1"
              title="Sao chép mã đơn"
            >
              {copiedKey === 'paymentNo' ? (
                <Check className="size-3.5 text-emerald-600" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-400">{formatDate(payment.createdAt)}</span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-bold ${status.className}`}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {status.label}
          </span>
        </div>
      </div>

      {/* Hero Overview Strip */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Số tiền</p>
            <p className="mt-1 text-2xl font-black text-slate-900">
              {formatAmount(payment.amountVnd)} <span className="text-sm font-semibold text-slate-500">₫</span>
            </p>
            <p className="text-xs text-slate-500">{payment.coinPackage.name}</p>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Coin nhận</p>
            <p className="mt-1 text-2xl font-black text-emerald-600">
              +{formatAmount(payment.coinAmount)} <span className="text-sm font-bold">Coin</span>
            </p>
            <p className="text-xs text-emerald-800/80">Cộng vào ví</p>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Hình thức</p>
            <p className="mt-1 text-sm font-bold text-slate-800">
              {paymentMethodLabels[payment.paymentMethod ?? ''] ?? payment.paymentMethod}
            </p>
            <p className="text-xs text-slate-500 uppercase">{payment.provider}</p>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Khách hàng</p>
            <Link
              href={`/admin/users/${payment.user.id}`}
              className="mt-1 block text-sm font-bold text-slate-900 hover:text-[#00873E] truncate"
              title="Xem hồ sơ khách"
            >
              {userName}
            </Link>
            <p className="text-xs text-slate-400 truncate font-mono">
              {payment.user.phone || payment.user.email}
            </p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Left Column */}
        <div className="space-y-5">
          {/* Thông tin chuyển khoản */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Thông tin chuyển khoản</h2>
              {qrImageUrl ? (
                <a
                  href={qrImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#00873E] hover:underline"
                >
                  <span>Mở ảnh VietQR</span>
                  <ExternalLink className="size-3" />
                </a>
              ) : null}
            </div>

            <div className="mt-3.5 flex flex-col sm:flex-row gap-4 items-start">
              {/* QR Thumbnail */}
              {qrImageUrl ? (
                <div className="size-20 shrink-0 rounded-xl border border-slate-200 bg-white p-1">
                  <img src={qrImageUrl} alt="QR" className="size-full object-contain" />
                </div>
              ) : null}

              {/* Bank Details */}
              <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-3 text-xs">
                {bankName ? (
                  <div>
                    <span className="text-slate-400">Ngân hàng</span>
                    <p className="font-semibold text-slate-800">{bankName}</p>
                  </div>
                ) : null}

                {bankAccount ? (
                  <div>
                    <span className="text-slate-400">Số tài khoản</span>
                    <p className="flex items-center gap-1 font-mono font-bold text-slate-900">
                      {bankAccount}
                      <button
                        type="button"
                        onClick={() => copy(bankAccount, 'acc')}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        {copiedKey === 'acc' ? (
                          <Check className="size-3 text-emerald-600" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </button>
                    </p>
                  </div>
                ) : null}

                {accountHolder ? (
                  <div>
                    <span className="text-slate-400">Người nhận</span>
                    <p className="font-semibold text-slate-800 uppercase">{accountHolder}</p>
                  </div>
                ) : null}

                <div>
                  <span className="text-slate-400">Nội dung chuyển</span>
                  <p className="flex items-center gap-1 font-mono font-bold text-amber-900">
                    <span className="bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      {payment.paymentNo}
                    </span>
                    <button
                      type="button"
                      onClick={() => copy(payment.paymentNo, 'memo')}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      {copiedKey === 'memo' ? (
                        <Check className="size-3 text-emerald-600" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </button>
                  </p>
                </div>

                <div>
                  <span className="text-slate-400">Mã giao dịch đối tác</span>
                  <p className="font-mono font-medium text-slate-700">
                    {payment.providerTransactionId || <span className="text-slate-400 italic">Chưa có</span>}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400">Thanh toán lúc</span>
                  <p className="font-medium text-slate-700">
                    {payment.paidAt ? formatDate(payment.paidAt) : <span className="text-slate-400">—</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Biến động ví */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Biến động ví</h2>
              <Link
                href="/admin/finance/transactions"
                className="text-xs font-semibold text-[#00873E] hover:underline"
              >
                Xem tất cả giao dịch ví →
              </Link>
            </div>

            <div className="mt-3 overflow-x-auto">
              {payment.walletTransactions && payment.walletTransactions.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400">
                      <th className="pb-2 font-medium">Mã giao dịch ví</th>
                      <th className="pb-2 font-medium">Hành động</th>
                      <th className="pb-2 font-medium">Số Coin</th>
                      <th className="pb-2 font-medium">Số dư sau</th>
                      <th className="pb-2 font-medium">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {payment.walletTransactions.map((tx) => {
                      const isCredit = tx.type !== 'DEBIT';
                      return (
                        <tr key={tx.transactionNo}>
                          <td className="py-2.5 font-mono font-medium text-slate-700">{tx.transactionNo}</td>
                          <td className="py-2.5">
                            <span
                              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                                isCredit
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {isCredit ? <ArrowDownRight className="size-3" /> : <ArrowUpRight className="size-3" />}
                              {isCredit ? 'Cộng Coin' : 'Thu hồi'}
                            </span>
                          </td>
                          <td
                            className={`py-2.5 font-bold ${
                              isCredit ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isCredit ? '+' : '−'}
                            {formatAmount(tx.amount)} Coin
                          </td>
                          <td className="py-2.5 text-slate-600">{formatAmount(tx.balanceAfter)} Coin</td>
                          <td className="py-2.5 text-slate-400">{formatDate(tx.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="py-4 text-center text-xs text-slate-400">Chưa có biến động ví.</p>
              )}
            </div>
          </div>

          {/* Collapsible raw data */}
          {payload ? (
            <div className="text-xs">
              <button
                type="button"
                onClick={() => setShowJson((prev) => !prev)}
                className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <span>Dữ liệu kỹ thuật</span>
                {showJson ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              </button>
              {showJson && (
                <pre className="mt-2 max-h-48 overflow-auto rounded-xl bg-slate-900 p-3 font-mono text-[11px] text-slate-300">
                  {JSON.stringify(payload, null, 2)}
                </pre>
              )}
            </div>
          ) : null}
        </div>

        {/* Right Column: Actions */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
              Xử lý đơn
            </h2>

            {/* Chưa thành công */}
            {payment.status !== 'SUCCESS' && payment.status !== 'REFUNDED' ? (
              <div className="mt-3.5 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Mã giao dịch ngân hàng {!payment.providerTransactionId && <span className="text-rose-500 font-bold">*</span>}
                  </label>
                  <Input
                    className={`mt-1 h-8 rounded-lg text-xs ${
                      missingTxError ? 'border-rose-400 bg-rose-50/20' : ''
                    }`}
                    value={providerTransactionId}
                    onChange={(e) => {
                      setProviderTransactionId(e.target.value);
                      if (missingTxError) setMissingTxError(false);
                    }}
                    placeholder={payment.providerTransactionId ? 'Mã đối soát' : 'Bắt buộc nhập mã sao kê'}
                  />
                  {missingTxError ? (
                    <p className="mt-1 text-[11px] font-medium text-rose-600">
                      Cần điền mã giao dịch ngân hàng để đối soát khi duyệt đơn.
                    </p>
                  ) : !payment.providerTransactionId ? (
                    <p className="mt-1 text-[11px] text-slate-400">
                      Bắt buộc nhập mã sao kê để đối soát khi duyệt thủ công.
                    </p>
                  ) : null}
                </div>

                <Button
                  className="w-full gap-1.5 rounded-xl bg-[#00873E] text-white hover:bg-[#006830] font-bold text-xs py-2 shadow-xs"
                  disabled={isPending}
                  onClick={() => {
                    if (!payment.providerTransactionId && !providerTransactionId.trim()) {
                      setMissingTxError(true);
                      toast.error('Vui lòng nhập mã giao dịch ngân hàng trước khi duyệt.');
                      return;
                    }
                    setConfirmKind('success');
                  }}
                >
                  <CheckCircle2 className="size-3.5" />
                  Duyệt & Cộng Coin
                </Button>

                {['CREATED', 'PENDING'].includes(payment.status) ? (
                  <div className="grid gap-1.5 pt-2 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => setConfirmKind('cancel')}
                      className="w-full justify-start text-xs text-slate-600 hover:text-slate-900 h-8"
                    >
                      Hủy đơn nạp
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => setConfirmKind('expire')}
                      className="w-full justify-start text-xs text-amber-700 hover:bg-amber-50 h-8"
                    >
                      Đóng đơn quá hạn
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => setConfirmKind('fail')}
                      className="w-full justify-start text-xs text-rose-700 hover:bg-rose-50 h-8"
                    >
                      Báo thanh toán thất bại
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Đã thành công */}
            {payment.status === 'SUCCESS' ? (
              <div className="mt-3.5 space-y-3">
                <p className="text-xs text-emerald-800 font-medium bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  Đơn đã hoàn tất. Coin đã cộng vào ví.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-bold"
                  disabled={isPending}
                  onClick={() => setConfirmKind('refund')}
                >
                  <RotateCcw className="size-3.5" />
                  Hoàn tiền & Thu hồi Coin
                </Button>
              </div>
            ) : null}

            {/* Đã hoàn tiền */}
            {payment.status === 'REFUNDED' ? (
              <p className="mt-3.5 text-xs text-purple-800 font-medium bg-purple-50 p-2.5 rounded-xl border border-purple-200">
                Đơn đã hoàn tiền và thu hồi Coin.
              </p>
            ) : null}
          </div>

          {/* Quick Customer Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">Tài khoản</span>
              <Link
                href={`/admin/users/${payment.user.id}`}
                className="text-[#00873E] font-semibold hover:underline"
              >
                Hồ sơ →
              </Link>
            </div>
            <p className="font-semibold text-slate-900 truncate">{userName}</p>
            <p className="text-slate-500 font-mono truncate">{payment.user.email}</p>
            {payment.user.phone ? (
              <p className="text-slate-500 font-mono">{payment.user.phone}</p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmKind && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-5 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              {confirmKind === 'success' && 'Xác nhận duyệt nạp tiền'}
              {confirmKind === 'refund' && 'Xác nhận hoàn tiền'}
              {confirmKind === 'cancel' && 'Xác nhận hủy đơn'}
              {confirmKind === 'expire' && 'Xác nhận đóng đơn'}
              {confirmKind === 'fail' && 'Xác nhận thất bại'}
            </h3>

            <div className="mt-2 text-xs leading-relaxed text-slate-600">
              {confirmKind === 'success' && (
                <div>
                  <p>Cộng +{formatAmount(payment.coinAmount)} Coin vào ví của {userName}?</p>
                  {(providerTransactionId.trim() || payment.providerTransactionId) && (
                    <p className="mt-1 text-[11px] text-slate-400 font-mono">
                      Mã GD: {providerTransactionId.trim() || payment.providerTransactionId}
                    </p>
                  )}
                </div>
              )}
              {confirmKind === 'refund' &&
                `Thu hồi -${formatAmount(payment.coinAmount)} Coin từ ví của ${userName}?`}
              {confirmKind === 'cancel' && `Hủy đơn nạp ${payment.paymentNo}?`}
              {confirmKind === 'expire' && `Đóng đơn nạp ${payment.paymentNo} do quá hạn?`}
              {confirmKind === 'fail' && `Đánh dấu đơn ${payment.paymentNo} thanh toán thất bại?`}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmKind(null)}
                disabled={isPending}
                className="rounded-xl px-3 text-xs"
              >
                Hủy
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleExecuteAction}
                disabled={isPending}
                className={`rounded-xl px-3 text-xs font-bold text-white ${
                  confirmKind === 'success'
                    ? 'bg-[#00873E] hover:bg-[#006830]'
                    : confirmKind === 'refund'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isPending ? 'Đang xử lý...' : 'Đồng ý'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
