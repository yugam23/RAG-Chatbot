import { useState, useEffect, useRef, useCallback } from 'react';
import * as api from '../services/api';
import {
  useHistoryQuery,
  useStatusQuery,
  useHealthQuery,
  useUploadMutation,
  useResetMutation,
  useClearChatMutation,
} from './useApiQueries';

// LocalStorage keys
const STORAGE_KEYS = {
  MESSAGES: 'rag_chatbot_messages',
  FILENAME: 'rag_chatbot_filename',
};

/**
 * Custom hook for chat functionality
 * Manages messages, document state, and API interactions
 * Refactored to use React Query for data fetching
 */
export function useChat() {
  // Initialize state from localStorage if available
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.FILENAME) || null;
  });

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  // React Query hooks
  const historyQuery = useHistoryQuery();
  const statusQuery = useStatusQuery();
  const healthQuery = useHealthQuery();
  const uploadMutation = useUploadMutation();
  const resetMutation = useResetMutation();
  const clearChatMutation = useClearChatMutation();

  // Derive connection status from health query
  const connectionStatus = healthQuery.isLoading
    ? 'checking'
    : healthQuery.isError
      ? 'offline'
      : 'online';

  // Derive isUploading from mutation state
  const isUploading = uploadMutation.isPending;

  // Sync server history with local state on successful fetch
  useEffect(() => {
    if (historyQuery.data?.length > 0) {
      setMessages(historyQuery.data);
    }
  }, [historyQuery.data]);

  // Sync server status with local state
  useEffect(() => {
    if (statusQuery.isSuccess) {
      setUploadedFileName(statusQuery.data.filename || null);
    }
  }, [statusQuery.data, statusQuery.isSuccess]);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to persist messages to localStorage:', e);
    }
  }, [messages]);

  // Persist filename to localStorage
  useEffect(() => {
    try {
      if (uploadedFileName) {
        localStorage.setItem(STORAGE_KEYS.FILENAME, uploadedFileName);
      } else {
        localStorage.removeItem(STORAGE_KEYS.FILENAME);
      }
    } catch (e) {
      console.warn('Failed to persist filename to localStorage:', e);
    }
  }, [uploadedFileName]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle file upload with mutation
  const handleFileUpload = useCallback(
    async (file) => {
      if (!file) return;

      setUploadStatus('Indexing Document...');

      try {
        await uploadMutation.mutateAsync(file);
        setUploadStatus('Document Ready!');
        setUploadedFileName(file.name);
        setTimeout(() => setUploadStatus(''), 3000);
      } catch (err) {
        console.error('Upload error:', err);
        setUploadStatus('Upload Failed');
      }
    },
    [uploadMutation]
  );

  // Handle new chat (reset everything)
  const handleNewChat = useCallback(async () => {
    try {
      // Abort any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      await resetMutation.mutateAsync();
      setMessages([]);
      setUploadedFileName(null);

      // Clear localStorage
      localStorage.removeItem(STORAGE_KEYS.MESSAGES);
      localStorage.removeItem(STORAGE_KEYS.FILENAME);

      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Failed to reset chat:', err);
    }
  }, [resetMutation]);

  // Handle clear chat (keep document)
  const handleClearChat = useCallback(async () => {
    try {
      // Abort any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      await clearChatMutation.mutateAsync();
      setMessages([]);
      localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    } catch (err) {
      console.error('Failed to clear chat:', err);
    }
  }, [clearChatMutation]);

  // Abort ongoing request
  const abortRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  // Send a message with abort support
  const sendMessage = useCallback(async (input) => {
    if (!input.trim()) return;

    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    const userMsg = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await api.sendChatMessage(input);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = { role: 'assistant', content: '' };

      setMessages((prev) => [...prev, assistantMsg]);

      while (true) {
        // Check if aborted
        if (abortControllerRef.current?.signal.aborted) {
          reader.cancel();
          break;
        }

        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line) continue;
          try {
            const json = JSON.parse(line);
            if (json.type === 'token') {
              assistantMsg.content += json.data;
              setMessages((prev) => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1] = { ...assistantMsg };
                return newMsgs;
              });
            } else if (json.type === 'error') {
              assistantMsg.content += `\n\n**Error:** ${json.data}`;
              setMessages((prev) => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1] = { ...assistantMsg };
                return newMsgs;
              });
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '**Error:** Failed to get response. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  return {
    // State
    messages,
    isLoading,
    isUploading,
    uploadStatus,
    uploadedFileName,
    connectionStatus,

    // Refs
    fileInputRef,
    messagesEndRef,

    // Actions
    handleFileUpload,
    handleNewChat,
    handleClearChat,
    sendMessage,
    abortRequest,
  };
}
