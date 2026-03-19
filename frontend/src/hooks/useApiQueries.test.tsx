import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUploadMutation, useResetMutation, useClearChatMutation, queryKeys } from '../hooks/useApiQueries';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

describe('useApiQueries mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useUploadMutation', () => {
    it('invalidates status query on success', async () => {
      const queryClient = createTestQueryClient();
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: unknown }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useUploadMutation(), { wrapper });

      const testFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      await result.current.mutateAsync(testFile);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: queryKeys.status });
    });
  });

  describe('useResetMutation', () => {
    it('invalidates all chat queries on success', async () => {
      const queryClient = createTestQueryClient();
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: unknown }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useResetMutation(), { wrapper });

      await result.current.mutateAsync(undefined);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['chat'] });
    });
  });

  describe('useClearChatMutation', () => {
    it('invalidates history query on success', async () => {
      const queryClient = createTestQueryClient();
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: unknown }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useClearChatMutation(), { wrapper });

      await result.current.mutateAsync(undefined);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: queryKeys.history });
    });
  });
});
