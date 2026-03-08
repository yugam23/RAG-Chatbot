import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api';
import type { HealthResponse } from '../types/api';

// Query Keys
export const queryKeys = {
  history: ['chat', 'history'] as const,
  status: ['chat', 'status'] as const,
  health: ['chat', 'health'] as const,
} as const;

/**
 * Hook to fetch chat history
 */
export function useHistoryQuery() {
  return useQuery({
    queryKey: queryKeys.history,
    queryFn: api.fetchHistory,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Hook to fetch upload status
 */
export function useStatusQuery() {
  return useQuery({
    queryKey: queryKeys.status,
    queryFn: api.fetchStatus,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Hook to check backend health
 */
export function useHealthQuery() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: async (): Promise<HealthResponse> => {
      const response = await fetch(`${api.API_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      // Parse body on 200 (ok) and 503 (degraded) — both are valid health responses
      if (response.ok || response.status === 503) {
        return response.json() as Promise<HealthResponse>;
      }
      // Any other status is unexpected — treat as offline
      throw new Error('Backend offline');
    },
    staleTime: 1000 * 30,
    refetchInterval: 30000,
  });
}

/**
 * Hook to upload a document
 */
export function useUploadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.uploadDocument,
    onSuccess: () => {
      // Invalidate status query to refetch
      void queryClient.invalidateQueries({ queryKey: queryKeys.status });
    },
  });
}

/**
 * Hook to reset session (new chat)
 */
export function useResetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.resetSession,
    onSuccess: () => {
      // Invalidate all chat-related queries
      void queryClient.invalidateQueries({ queryKey: ['chat'] });
    },
  });
}

/**
 * Hook to clear chat history
 */
export function useClearChatMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.clearChat,
    onSuccess: () => {
      // Invalidate history query
      void queryClient.invalidateQueries({ queryKey: queryKeys.history });
    },
  });
}
