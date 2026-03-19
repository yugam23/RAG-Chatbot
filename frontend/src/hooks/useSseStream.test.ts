import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSseStream } from './useSseStream';
import type { Message } from '../types/api';

// Manually mock api — locked decision: vi.mock with ReadableStream, NOT MSW
vi.mock('../services/api', () => ({
  sendChatMessage: vi.fn(),
}));
import * as api from '../services/api';

function makeStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

describe('useSseStream', () => {
  beforeEach(() => {
    vi.mocked(api.sendChatMessage).mockReset();
  });

  it('accumulates streaming tokens into messages', async () => {
    const token1 = JSON.stringify({ type: 'token', data: 'Hello' }) + '\n';
    const token2 = JSON.stringify({ type: 'token', data: ' World' }) + '\n';

    vi.mocked(api.sendChatMessage).mockResolvedValue({
      body: makeStream([token1, token2]),
      ok: true,
    } as unknown as Response);

    const setMessages = vi.fn();
    const { result } = renderHook(() => useSseStream(setMessages));

    await act(async () => {
      await result.current.sendMessage('test question');
    });

    // setMessages should have been called multiple times:
    // 1. Add user message
    // 2. Add assistant placeholder
    // 3+. Token updates
    expect(setMessages).toHaveBeenCalled();

    // Verify isLoading is false after completion
    expect(result.current.isLoading).toBe(false);

    // Examine the token accumulation: the last call to setMessages
    // should have been with an updater that adds 'Hello World' to assistant
    const lastCall = setMessages.mock.calls[setMessages.mock.calls.length - 1];
    const updater = lastCall[0] as (prev: Message[]) => Message[];
    const messagesAfterToken2 = updater([
      { role: 'user', content: 'test question' },
      { role: 'assistant', content: 'Hello' },
    ]);
    const lastMsg = messagesAfterToken2[messagesAfterToken2.length - 1];
    expect(lastMsg.content).toBe('Hello World');
  });

  it('throws typed error when response.body is null', async () => {
    vi.mocked(api.sendChatMessage).mockResolvedValue({
      body: null,
      ok: true,
    } as unknown as Response);

    const setMessages = vi.fn();
    const { result } = renderHook(() => useSseStream(setMessages));

    await act(async () => {
      await result.current.sendMessage('test');
    });

    // The catch block should have called setMessages with an error message
    // containing "Response body is null"
    const errorCall = setMessages.mock.calls.find((call) => {
      const arg = call[0];
      if (typeof arg === 'function') {
        const result = arg([]);
        return result.some(
          (m: Message) =>
            m.role === 'assistant' && m.content.includes('Response body is null')
        );
      }
      return Array.isArray(arg) && arg.some(
        (m: Message) =>
          m.role === 'assistant' && m.content.includes('Response body is null')
      );
    });
    expect(errorCall).toBeDefined();
  });

  it('AbortController cancels stream mid-flight', async () => {
    // Create a stream that never closes (never enqueues, never closes)
    const neverCloses = new ReadableStream({
      start(controller) {
        // Intentionally never calling controller.close() or enqueue()
      },
    });

    vi.mocked(api.sendChatMessage).mockResolvedValue({
      body: neverCloses,
      ok: true,
    } as unknown as Response);

    const setMessages = vi.fn();
    const { result } = renderHook(() => useSseStream(setMessages));

    // Start sendMessage without awaiting
    const promise = act(async () => {
      void result.current.sendMessage('test');
    });

    // Immediately abort
    act(() => {
      result.current.abortRequest();
    });

    await promise;

    // isLoading should be false after abort
    expect(result.current.isLoading).toBe(false);
  });

  it('empty input is ignored', async () => {
    const setMessages = vi.fn();
    const { result } = renderHook(() => useSseStream(setMessages));

    await act(async () => {
      await result.current.sendMessage('   ');
    });

    expect(vi.mocked(api.sendChatMessage)).not.toHaveBeenCalled();
  });
});
