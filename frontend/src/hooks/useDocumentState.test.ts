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
    expect(result.current.uploadedFileName).toBe('test.pdf');
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

  it('handleNewChat resets state and calls clearMessages', async () => {
    // First upload a file to set uploadedFileName state
    const uploadMutation = {
      isPending: false,
      mutateAsync: vi
        .fn<[File], Promise<{ filename: string; chunk_count: number }>>()
        .mockResolvedValue({ filename: 'test.pdf', chunk_count: 5 }),
    };
    const clearMessages = vi.fn();
    const resetMutation = {
      isPending: false,
      mutateAsync: vi
        .fn<[], Promise<{ status: string }>>()
        .mockResolvedValue({ status: 'Session Reset' }),
    };
    const params = makeMockParams({
      uploadMutation: uploadMutation as UseDocumentStateParams['uploadMutation'],
      clearMessages,
      resetMutation: resetMutation as UseDocumentStateParams['resetMutation'],
    });

    const { result } = renderHook(() => useDocumentState(params));

    // Upload file first
    await act(async () => {
      await result.current.handleFileUpload(
        new File(['test'], 'test.pdf', { type: 'application/pdf' })
      );
    });

    expect(result.current.uploadedFileName).toBe('test.pdf');

    // Now trigger new chat
    await act(async () => {
      await result.current.handleNewChat();
    });

    expect(resetMutation.mutateAsync).toHaveBeenCalled();
    expect(clearMessages).toHaveBeenCalled();
    expect(result.current.uploadedFileName).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.FILENAME)).toBeNull();
  });

  it('handleClearChat clears messages but keeps document', async () => {
    const uploadMutation = {
      isPending: false,
      mutateAsync: vi
        .fn<[File], Promise<{ filename: string; chunk_count: number }>>()
        .mockResolvedValue({ filename: 'test.pdf', chunk_count: 5 }),
    };
    const clearMessages = vi.fn();
    const clearChatMutation = {
      isPending: false,
      mutateAsync: vi
        .fn<[], Promise<{ status: string }>>()
        .mockResolvedValue({ status: 'Chat Cleared' }),
    };
    const params = makeMockParams({
      uploadMutation: uploadMutation as UseDocumentStateParams['uploadMutation'],
      clearMessages,
      clearChatMutation: clearChatMutation as UseDocumentStateParams['clearChatMutation'],
    });

    const { result } = renderHook(() => useDocumentState(params));

    // Upload file first
    await act(async () => {
      await result.current.handleFileUpload(
        new File(['test'], 'test.pdf', { type: 'application/pdf' })
      );
    });

    expect(result.current.uploadedFileName).toBe('test.pdf');

    // Now clear chat
    await act(async () => {
      await result.current.handleClearChat();
    });

    expect(clearChatMutation.mutateAsync).toHaveBeenCalled();
    expect(clearMessages).toHaveBeenCalled();
    // Document should still be present
    expect(result.current.uploadedFileName).toBe('test.pdf');
  });
});
