'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AccountStatus, AdminAuditAction } from '@zenx-go/api-client';

export function useAdminMe() {
  return useQuery({
    queryKey: ['admin', 'me'],
    queryFn: api.admin.me,
    retry: false,
    staleTime: 60_000,
  });
}

export function useAdminDashboard(enabled = true) {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: api.admin.dashboard,
    enabled,
    retry: false,
  });
}

export function useAdminUsers(
  query: { page?: number; pageSize?: number; search?: string; status?: AccountStatus },
  enabled = true,
) {
  return useQuery({
    queryKey: ['admin', 'users', query],
    queryFn: () => api.admin.users(query),
    enabled,
    retry: false,
    placeholderData: (previous) => previous,
  });
}

export function useAdminUser(userId: string, enabled = true) {
  return useQuery({
    queryKey: ['admin', 'user', userId],
    queryFn: () => api.admin.user(userId),
    enabled: enabled && Boolean(userId),
    retry: false,
  });
}

export function useAdminAuditLogs(
  query: {
    page?: number;
    pageSize?: number;
    actorUserId?: string;
    action?: AdminAuditAction;
    targetId?: string;
    from?: string;
    to?: string;
  },
  enabled = true,
) {
  return useQuery({
    queryKey: ['admin', 'audit-logs', query],
    queryFn: () => api.admin.auditLogs(query),
    enabled,
    retry: false,
    placeholderData: (previous) => previous,
  });
}
