"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useAccount() {
  return useQuery({
    queryKey: ["account", "me"],
    queryFn: api.account.me,
    retry: false,
  });
}
