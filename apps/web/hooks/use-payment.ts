"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useCoinPackages() {
  return useQuery({
    queryKey: ["coin-packages"],
    queryFn: api.coinPackages.list,
    retry: false,
  });
}

export function usePayment(paymentNo: string) {
  return useQuery({
    queryKey: ["payment", paymentNo],
    queryFn: () => api.payments.get(paymentNo),
    enabled: Boolean(paymentNo),
    retry: false,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "PENDING" || status === "CREATED" ? 5_000 : false;
    },
  });
}
