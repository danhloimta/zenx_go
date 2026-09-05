'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  AdminFinanceCoinPackageCreateRequest,
  AdminFinanceCoinPackageUpdateRequest,
  AdminFinanceConfirmPaymentRequest,
  AdminFinancePaymentActionRequest,
  AdminFinanceWalletAdjustmentRequest,
  CoinPackageStatus,
  PaymentMethod,
  PaymentStatus,
  WalletTransactionStatus,
  WalletTransactionType,
} from '@zenx-go/api-client';

export function useAdminFinanceDashboard(enabled = true) {
  return useQuery({
    queryKey: ['admin', 'finance', 'dashboard'],
    queryFn: api.admin.finance.dashboard,
    enabled,
    retry: false,
  });
}

export function useAdminFinancePackages(status?: CoinPackageStatus, enabled = true) {
  return useQuery({
    queryKey: ['admin', 'finance', 'packages', status],
    queryFn: () => api.admin.finance.packages(status ? { status } : {}),
    enabled,
    retry: false,
  });
}

export function useAdminFinancePackageMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'finance'] });
    void queryClient.invalidateQueries({ queryKey: ['coin-packages'] });
  };
  const create = useMutation({ mutationFn: (input: AdminFinanceCoinPackageCreateRequest) => api.admin.finance.createPackage(input), onSuccess: invalidate });
  const update = useMutation({ mutationFn: ({ id, input }: { id: string; input: AdminFinanceCoinPackageUpdateRequest }) => api.admin.finance.updatePackage(id, input), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: (id: string) => api.admin.finance.deletePackage(id), onSuccess: invalidate });
  return { create, update, remove };
}

export function useAdminFinancePayments(query: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: PaymentStatus;
  provider?: string;
  paymentMethod?: PaymentMethod;
  from?: string;
  to?: string;
} = {}, enabled = true) {
  return useQuery({
    queryKey: ['admin', 'finance', 'payments', query],
    queryFn: () => api.admin.finance.payments(query),
    enabled,
    retry: false,
    placeholderData: (previous) => previous,
  });
}

export function useAdminFinancePayment(paymentNo: string, enabled = true) {
  return useQuery({
    queryKey: ['admin', 'finance', 'payment', paymentNo],
    queryFn: () => api.admin.finance.payment(paymentNo),
    enabled: enabled && Boolean(paymentNo),
    retry: false,
  });
}

export function useAdminFinancePaymentActions(paymentNo: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'finance'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'user'] });
  };
  const confirmSuccess = useMutation({ mutationFn: (input: AdminFinanceConfirmPaymentRequest) => api.admin.finance.confirmSuccess(paymentNo, input), onSuccess: invalidate });
  const fail = useMutation({ mutationFn: (input: AdminFinancePaymentActionRequest) => api.admin.finance.failPayment(paymentNo, input), onSuccess: invalidate });
  const expire = useMutation({ mutationFn: (input: AdminFinancePaymentActionRequest) => api.admin.finance.expirePayment(paymentNo, input), onSuccess: invalidate });
  const cancel = useMutation({ mutationFn: (input: AdminFinancePaymentActionRequest) => api.admin.finance.cancelPayment(paymentNo, input), onSuccess: invalidate });
  const refund = useMutation({ mutationFn: (input: AdminFinancePaymentActionRequest) => api.admin.finance.refundPayment(paymentNo, input), onSuccess: invalidate });
  return { confirmSuccess, fail, expire, cancel, refund };
}

export function useAdminFinanceTransactions(query: {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: WalletTransactionType;
  status?: WalletTransactionStatus;
  from?: string;
  to?: string;
} = {}, enabled = true) {
  return useQuery({
    queryKey: ['admin', 'finance', 'transactions', query],
    queryFn: () => api.admin.finance.transactions(query),
    enabled,
    retry: false,
    placeholderData: (previous) => previous,
  });
}

export function useAdminFinanceWalletAdjustment(userId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'finance'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId] });
  };
  const credit = useMutation({ mutationFn: (input: AdminFinanceWalletAdjustmentRequest) => api.admin.finance.creditWallet(userId, input), onSuccess: invalidate });
  const debit = useMutation({ mutationFn: (input: AdminFinanceWalletAdjustmentRequest) => api.admin.finance.debitWallet(userId, input), onSuccess: invalidate });
  return { credit, debit };
}
