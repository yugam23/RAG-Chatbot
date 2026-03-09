import { useState, useEffect, useRef } from 'react';
import type React from 'react';
import type { Message } from '../types/api';
import type { useHistoryQuery } from './useApiQueries';

// LocalStorage keys (Tier 4 - Optimized Strategy)
export const STORAGE_KEYS = {
  RECENT: 'rag_chatbot_recent', // Only last 20 messages
  FILENAME: 'rag_chatbot_filename',
};

// Maximum messages to cache locally (Tier 4)
export const MAX_LOCAL_MESSAGES = 20;

export interface UseChatMessagesReturn {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  clearMessages: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  isHistoryLoading: boolean;
}

/**
 * Hook for message state management with localStorage sync and server history.
 * Owns: messages array, localStorage caching, server history sync, auto-scroll ref.
 */
export function useChatMessages(
  historyQuery: ReturnType<typeof useHistoryQuery>
): UseChatMessagesReturn {
  const [messages, setMessages] = useState<Message[]>(() => {
    // Try to load recent messages as fallback
    try {
      const recent = localStorage.getItem(STORAGE_KEYS.RECENT);
      return recent ? (JSON.parse(recent) as Message[]) : [];
    } catch {
      return [];
    }
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Sync server history with local state on successful fetch (Tier 4)
  useEffect(() => {
    if (historyQuery.data && historyQuery.data.length > 0) {
      setMessages(historyQuery.data);
    } else if (historyQuery.isSuccess && historyQuery.data && historyQuery.data.length === 0) {
      // Server has no messages, clear local state
      setMessages([]);
    }
  }, [historyQuery.data, historyQuery.isSuccess]);

  // Cache only recent messages to localStorage (Tier 4 optimization)
  useEffect(() => {
    try {
      const recentMessages = messages.slice(-MAX_LOCAL_MESSAGES);
      localStorage.setItem(STORAGE_KEYS.RECENT, JSON.stringify(recentMessages));
    } catch (e) {
      console.warn('Failed to persist recent messages to localStorage:', e);
    }
  }, [messages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const clearMessages = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEYS.RECENT);
  };

  return {
    messages,
    setMessages,
    clearMessages,
    messagesEndRef,
    isHistoryLoading: historyQuery.isLoading,
  };
}
