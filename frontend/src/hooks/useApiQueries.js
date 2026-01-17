import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api';

// Query Keys
export const queryKeys = {
  history: ['chat', 'history'],
  status: ['chat', 'status'],
  health: ['chat', 'health'],
};

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
    queryFn: async () => {
      const response = await fetch(`${api.API_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw new Error('Backend offline');
      return response.json();
    },
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 30000, // Poll every 30s
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
      queryClient.invalidateQueries({ queryKey: queryKeys.status });
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
      queryClient.invalidateQueries({ queryKey: ['chat'] });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.history });
    },
  });
}
