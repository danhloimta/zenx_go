"use client";

import type { WalletTransactionStatus, WalletTransactionType } from "@zenx-go/api-client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useWallet() {
  return useQuery({
    queryKey: ["wallet", "summary"],
    queryFn: api.wallet.summary,
    retry: false,
  });
}

export function useWalletTransactions(filters: {
  type?: WalletTransactionType | "ALL";
  status?: WalletTransactionStatus | "ALL";
}) {
  return useQuery({
    queryKey: ["wallet", "transactions", filters],
    queryFn: () => api.wallet.transactions({ ...filters, page: 1, pageSize: 20 }),
    retry: false,
  });
}
