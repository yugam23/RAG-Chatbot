import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useChatContext, ChatProvider } from './ChatContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('ChatContext', () => {
  describe('useChatContext', () => {
    it('throws when rendered outside ChatProvider', () => {
      expect(() => renderHook(() => useChatContext())).toThrow(
        'useChatContext must be used within a ChatProvider'
      );
    });

    it('does NOT throw when rendered inside ChatProvider', () => {
      const testQueryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false, gcTime: 0 },
          mutations: { retry: false },
        },
      });

      const wrapper = ({ children }: { children: unknown }) => (
        <QueryClientProvider client={testQueryClient}>
          <ChatProvider>{children}</ChatProvider>
        </QueryClientProvider>
      );

      expect(() => renderHook(() => useChatContext(), { wrapper })).not.toThrow();
    });
  });
});
