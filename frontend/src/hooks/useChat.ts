import {
  useHistoryQuery,
  useStatusQuery,
  useHealthQuery,
  useUploadMutation,
  useResetMutation,
  useClearChatMutation,
} from './useApiQueries';
import { useChatMessages } from './useChatMessages';
import { useSseStream } from './useSseStream';
import { useDocumentState } from './useDocumentState';
import type React from 'react';
import type { Message } from '../types/api';

export interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  isUploading: boolean;
  uploadStatus: string;
  uploadedFileName: string | null;
  connectionStatus: 'online' | 'offline' | 'checking';
  isHistoryLoading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  sendMessage: (input: string) => Promise<void>;
  handleFileUpload: (file: File) => Promise<void>;
  handleNewChat: () => Promise<void>;
  handleClearChat: () => Promise<void>;
  abortRequest: () => void;
}

/**
 * Custom hook for chat functionality.
 * Thin orchestrator composing useChatMessages, useSseStream, and useDocumentState.
 * The public UseChatReturn interface is unchanged — zero consumer changes required.
 */
export function useChat(): UseChatReturn {
  // React Query hooks
  const historyQuery = useHistoryQuery();
  const statusQuery = useStatusQuery();
  const healthQuery = useHealthQuery();
  const uploadMutation = useUploadMutation();
  const resetMutation = useResetMutation();
  const clearChatMutation = useClearChatMutation();

  // Message state + localStorage sync + server history + auto-scroll
  const { messages, setMessages, clearMessages, messagesEndRef, isHistoryLoading } =
    useChatMessages(historyQuery);

  // SSE streaming + AbortController
  const { isLoading, sendMessage, abortRequest, abortControllerRef } = useSseStream(setMessages);

  // Upload state + file actions + connection status
  const {
    isUploading,
    uploadStatus,
    uploadedFileName,
    connectionStatus,
    fileInputRef,
    handleFileUpload,
    handleNewChat,
    handleClearChat,
  } = useDocumentState({
    statusQuery,
    healthQuery,
    uploadMutation,
    resetMutation,
    clearChatMutation,
    abortControllerRef,
    clearMessages,
  });

  return {
    /** Array of chat messages */
    messages,
    /** Whether the chatbot is currently generating a response */
    isLoading,
    /** Whether a file is currently uploading */
    isUploading,
    /** Status text for the upload process */
    uploadStatus,
    /** Name of the currently active document */
    uploadedFileName,
    /** Connection health status: 'online' | 'offline' | 'checking' */
    connectionStatus,
    /** Whether the chat history is currently loading from the server */
    isHistoryLoading,

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
