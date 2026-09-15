'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminAuthSettingsUpdateRequest } from '@zenx-go/api-client';
import { api } from '@/lib/api';

export const adminAuthSettingsQueryKey = ['admin', 'auth-settings'] as const;

export function useAuthProviderAvailability() {
  return useQuery({
    queryKey: ['auth', 'provider-availability'],
    queryFn: api.auth.providerAvailability,
    retry: false,
    staleTime: 0,
  });
}

export function useAdminAuthSettings() {
  return useQuery({
    queryKey: adminAuthSettingsQueryKey,
    queryFn: api.admin.authSettings.get,
    retry: false,
    staleTime: 0,
  });
}

export function useUpdateAdminAuthSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminAuthSettingsUpdateRequest) => api.admin.authSettings.update(input),
    retry: false,
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: adminAuthSettingsQueryKey,
        exact: true,
      });
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(adminAuthSettingsQueryKey, settings);
    },
  });
}
