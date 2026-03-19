import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDocumentState } from './useDocumentState';
import { STORAGE_KEYS } from './useChatMessages';
import type { UseDocumentStateParams } from './useDocumentState';

const makeMockParams = (overrides = {}): UseDocumentStateParams => ({
  statusQuery: {
    data: { filename: null },
    isSuccess: false,
    isLoading: false,
    isError: false,
  },
  healthQuery: {
    isLoading: false,
    isError: false,
  },
  uploadMutation: {
    isPending: false,
    mutateAsync: vi
      .fn<[File], Promise<{ filename: string; chunk_count: number }>>()
      .mockResolvedValue({ filename: 'test.pdf', chunk_count: 5 }),
  },
  resetMutation: {
    isPending: false,
    mutateAsync: vi
      .fn<[], Promise<{ status: string }>>()
      .mockResolvedValue({ status: 'Session Reset' }),
  },
  clearChatMutation: {
    isPending: false,
    mutateAsync: vi
      .fn<[], Promise<{ status: string }>>()
      .mockResolvedValue({ status: 'Chat Cleared' }),
  },
  abortControllerRef: { current: null },
  clearMessages: vi.fn(),
  ...overrides,
} as UseDocumentStateParams);

describe('useDocumentState', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('upload transitions through loading to success', async () => {
    const params = makeMockParams();
    const { result } = renderHook(() => useDocumentState(params));

    await act(async () => {
      await result.current.handleFileUpload(
        new File(['test'], 'test.pdf', { type: 'application/pdf' })
      );
    });

    expect(result.current.uploadStatus).toBe('Document Ready!');
    // Note: documents array is populated via React Query invalidation from useChat,
    // not directly by handleFileUpload in this isolated hook
  });

  it('upload transitions to error state on failure', async () => {
    const uploadMutation = {
      isPending: false,
      mutateAsync: vi
        .fn<[File], Promise<never>>()
        .mockRejectedValue(new Error('Upload failed')),
    };
    const params = makeMockParams({ uploadMutation: uploadMutation as UseDocumentStateParams['uploadMutation'] });
    const { result } = renderHook(() => useDocumentState(params));

    await act(async () => {
      await result.current.handleFileUpload(
        new File(['test'], 'test.pdf', { type: 'application/pdf' })
      );
    });

    expect(result.current.uploadStatus).toBe('Upload Failed');
  });

  it("connectionStatus is 'online' when healthQuery succeeds", () => {
    const params = makeMockParams();
    const { result } = renderHook(() => useDocumentState(params));

    expect(result.current.connectionStatus).toBe('online');
  });

  it("connectionStatus is 'checking' when healthQuery is loading", () => {
    const params = makeMockParams({
      healthQuery: { isLoading: true, isError: false },
    });
    const { result } = renderHook(() => useDocumentState(params));

    expect(result.current.connectionStatus).toBe('checking');
  });

  it("connectionStatus is 'offline' when healthQuery errors", () => {
    const params = makeMockParams({
      healthQuery: { isLoading: false, isError: true },
    });
    const { result } = renderHook(() => useDocumentState(params));

    expect(result.current.connectionStatus).toBe('offline');
  });

  it('handleNewChat calls clearChatMutation and clearMessages (history only)', async () => {
    const clearMessages = vi.fn();
    const clearChatMutation = {
      isPending: false,
      mutateAsync: vi
        .fn<[], Promise<{ status: string }>>()
        .mockResolvedValue({ status: 'Chat Cleared' }),
    };
    const params = makeMockParams({
      clearMessages,
      clearChatMutation: clearChatMutation as UseDocumentStateParams['clearChatMutation'],
    });

    const { result } = renderHook(() => useDocumentState(params));

    // Trigger new chat
    await act(async () => {
      await result.current.handleNewChat();
    });

    expect(clearChatMutation.mutateAsync).toHaveBeenCalled();
    expect(clearMessages).toHaveBeenCalled();
  });

  it('handleResetSession wipes documents and clears messages', async () => {
    const clearMessages = vi.fn();
    const resetMutation = {
      isPending: false,
      mutateAsync: vi
        .fn<[], Promise<{ status: string }>>()
        .mockResolvedValue({ status: 'Session Reset' }),
    };
    const params = makeMockParams({
      clearMessages,
      resetMutation: resetMutation as UseDocumentStateParams['resetMutation'],
    });

    const { result } = renderHook(() => useDocumentState(params));

    // Trigger reset session
    await act(async () => {
      await result.current.handleResetSession();
    });

    expect(resetMutation.mutateAsync).toHaveBeenCalled();
    expect(clearMessages).toHaveBeenCalled();
    expect(result.current.documents).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEYS.FILENAME)).toBeNull();
  });
});
