import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatMessages, STORAGE_KEYS } from './useChatMessages';
import type { Message } from '../types/api';

// Minimal mock for ReturnType<typeof useHistoryQuery>
const makeHistoryQuery = (overrides = {}) => ({
  data: undefined as Message[] | undefined,
  isSuccess: false,
  isLoading: false,
  isError: false,
  error: null,
  ...overrides,
});

describe('useChatMessages', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads messages from localStorage on mount', () => {
    localStorage.setItem(
      STORAGE_KEYS.RECENT,
      JSON.stringify([{ role: 'user', content: 'hi' }])
    );

    const { result } = renderHook(() =>
      useChatMessages(makeHistoryQuery() as ReturnType<typeof makeHistoryQuery>)
    );

    expect(result.current.messages).toEqual([{ role: 'user', content: 'hi' }]);
  });

  it('starts with empty messages when localStorage is empty', () => {
    const { result } = renderHook(() =>
      useChatMessages(makeHistoryQuery() as ReturnType<typeof makeHistoryQuery>)
    );

    expect(result.current.messages).toEqual([]);
  });

  it('persists messages to localStorage on change', () => {
    const { result } = renderHook(() =>
      useChatMessages(makeHistoryQuery() as ReturnType<typeof makeHistoryQuery>)
    );

    act(() => {
      result.current.setMessages([{ role: 'user', content: 'hello' }]);
    });

    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENT) as string)
    ).toEqual([{ role: 'user', content: 'hello' }]);
  });

  it('clears messages and removes localStorage on reset', () => {
    localStorage.setItem(
      STORAGE_KEYS.RECENT,
      JSON.stringify([{ role: 'user', content: 'seeded' }])
    );

    const { result } = renderHook(() =>
      useChatMessages(makeHistoryQuery() as ReturnType<typeof makeHistoryQuery>)
    );

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEYS.RECENT)).toBeNull();
  });

  it('syncs server history when historyQuery succeeds', () => {
    const serverMsgs = [{ role: 'assistant', content: 'server msg' }];

    const { result } = renderHook(() =>
      useChatMessages(
        makeHistoryQuery({ data: serverMsgs, isSuccess: true }) as ReturnType<typeof makeHistoryQuery>
      )
    );

    expect(result.current.messages).toEqual(serverMsgs);
  });

  it('isHistoryLoading reflects historyQuery.isLoading', () => {
    const { result: loadingResult } = renderHook(() =>
      useChatMessages(
        makeHistoryQuery({ isLoading: true }) as ReturnType<typeof makeHistoryQuery>
      )
    );
    expect(loadingResult.current.isHistoryLoading).toBe(true);

    const { result: notLoadingResult } = renderHook(() =>
      useChatMessages(
        makeHistoryQuery({ isLoading: false }) as ReturnType<typeof makeHistoryQuery>
      )
    );
    expect(notLoadingResult.current.isHistoryLoading).toBe(false);
  });
});
