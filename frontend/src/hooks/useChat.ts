import {
  useHistoryQuery,
  useStatusQuery,
  useHealthQuery,
  useUploadMutation,
  useResetMutation,
  useClearChatMutation,
  useDeleteDocumentMutation,
} from './useApiQueries';
import { useChatMessages } from './useChatMessages';
import { useSseStream } from './useSseStream';
import { useDocumentState } from './useDocumentState';
import React from 'react';
import type { Message, Document } from '../types/api';

export interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  isUploading: boolean;
  uploadStatus: string;
  documents: Document[];
  connectionStatus: 'online' | 'offline' | 'checking';
  isHistoryLoading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  sendMessage: (input: string) => Promise<void>;
  handleFileUpload: (file: File) => Promise<void>;
  handleNewChat: () => Promise<void>;
  handleResetSession: () => Promise<void>;
  handleRemoveDocument: (docId: string) => Promise<void>;
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
  const deleteDocumentMutation = useDeleteDocumentMutation();

  // Message state + localStorage sync + server history + auto-scroll
  const { messages, setMessages, clearMessages, messagesEndRef, isHistoryLoading } =
    useChatMessages(historyQuery);

  // SSE streaming + AbortController
  const { isLoading, sendMessage, abortRequest, abortControllerRef } = useSseStream(setMessages);

  // Upload state + file actions + connection status
  const {
    isUploading,
    uploadStatus,
    documents,
    connectionStatus,
    fileInputRef,
    handleFileUpload,
    handleNewChat,
    handleResetSession,
  } = useDocumentState({
    statusQuery,
    healthQuery,
    uploadMutation,
    resetMutation,
    clearChatMutation,
    abortControllerRef,
    clearMessages,
  });

  // Handle remove document — calls delete API and invalidates documents query
  const handleRemoveDocument = React.useCallback(
    async (docId: string): Promise<void> => {
      try {
        await deleteDocumentMutation.mutateAsync(docId);
        // useDeleteDocumentMutation already invalidates the documents query on success
      } catch (err) {
        console.error('Failed to remove document:', err);
      }
    },
    [deleteDocumentMutation]
  );

  return {
    /** Array of chat messages */
    messages,
    /** Whether the chatbot is currently generating a response */
    isLoading,
    /** Whether a file is currently uploading */
    isUploading,
    /** Status text for the upload process */
    uploadStatus,
    /** Array of currently uploaded documents */
    documents,
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
    handleResetSession,
    handleRemoveDocument,
    sendMessage,
    abortRequest,
  };
}
