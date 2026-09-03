'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SupportTicketStatus, SupportTicketPriority } from '@zenx-go/api-client';

export function useSupportUnreadCount(enabled = true) {
  return useQuery({
    queryKey: ['support', 'unread-count'],
    queryFn: api.support.unreadCount,
    enabled,
    retry: false,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useSupportTicketMessages(
  ticketNo: string,
  page = 1,
  pageSize = 20,
  enabled = true,
) {
  return useQuery({
    queryKey: ['support', 'messages', ticketNo, page, pageSize],
    queryFn: () => api.support.messages(ticketNo, { page, pageSize }),
    enabled: enabled && Boolean(ticketNo),
    retry: false,
  });
}

export function useSupportAdminDashboard(enabled = true) {
  return useQuery({
    queryKey: ['admin', 'support', 'dashboard'],
    queryFn: api.admin.support.dashboard,
    enabled,
    retry: false,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useSupportAdminAgents(enabled = true) {
  return useQuery({
    queryKey: ['admin', 'support', 'agents'],
    queryFn: api.admin.support.agents,
    enabled,
    retry: false,
  });
}

export function useSupportAdminTickets(
  query: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: SupportTicketStatus;
    priority?: SupportTicketPriority;
    assignee?: 'ME' | 'UNASSIGNED';
    categoryId?: string;
    unreadOnly?: boolean;
  },
  enabled = true,
) {
  return useQuery({
    queryKey: ['admin', 'support', 'tickets', query],
    queryFn: () => api.admin.support.tickets(query),
    enabled,
    retry: false,
    placeholderData: (previous) => previous,
  });
}

export function useSupportAdminTicket(ticketNo: string, enabled = true) {
  return useQuery({
    queryKey: ['admin', 'support', 'ticket', ticketNo],
    queryFn: () => api.admin.support.ticket(ticketNo),
    enabled: enabled && Boolean(ticketNo),
    retry: false,
  });
}

export function useSupportAdminFaqs(
  query: { categoryId?: string; status?: 'ACTIVE' | 'INACTIVE'; search?: string } = {},
  enabled = true,
) {
  return useQuery({
    queryKey: ['admin', 'support', 'faqs', query],
    queryFn: () => api.admin.support.faqs(query),
    enabled,
    retry: false,
  });
}
