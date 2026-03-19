import { useState, useEffect, useRef, useCallback } from 'react';
import type React from 'react';
import { STORAGE_KEYS } from './useChatMessages';
import type { Document } from '../types/api';
import type { useStatusQuery, useHealthQuery, useUploadMutation, useResetMutation, useClearChatMutation } from './useApiQueries';

export interface UseDocumentStateParams {
  statusQuery: ReturnType<typeof useStatusQuery>;
  healthQuery: ReturnType<typeof useHealthQuery>;
  uploadMutation: ReturnType<typeof useUploadMutation>;
  resetMutation: ReturnType<typeof useResetMutation>;
  clearChatMutation: ReturnType<typeof useClearChatMutation>;
  abortControllerRef: React.MutableRefObject<AbortController | null>;
  clearMessages: () => void;
}

export interface UseDocumentStateReturn {
  isUploading: boolean;
  uploadStatus: string;
  documents: Document[];
  connectionStatus: 'online' | 'offline' | 'checking';
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (file: File) => Promise<void>;
  handleNewChat: () => Promise<void>;
  handleResetSession: () => Promise<void>;
}

/**
 * Hook for upload state, file actions, and connection status.
 * Owns: uploadStatus, documents array, fileInputRef, connectionStatus derivation,
 * and all file/chat action callbacks.
 *
 * Documents array is local state initialized from localStorage — it is NOT synced
 * from a query in this hook. React Query syncing happens in useChat.ts via
 * queryClient.invalidateQueries after mutations.
 */
export function useDocumentState({
  statusQuery: _statusQuery,
  healthQuery,
  uploadMutation,
  resetMutation,
  clearChatMutation,
  abortControllerRef,
  clearMessages,
}: UseDocumentStateParams): UseDocumentStateReturn {
  const [uploadStatus, setUploadStatus] = useState('');
  const [documents, setDocuments] = useState<Document[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FILENAME);
      if (stored) {
        // Backwards compat: old format was a string (filename), treat as empty array
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      // Fall through to empty array
    }
    return [];
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Derive connection status from health query
  const connectionStatus: 'online' | 'offline' | 'checking' = healthQuery.isLoading
    ? 'checking'
    : healthQuery.isError
      ? 'offline'
      : 'online';

  // Derive isUploading from mutation state
  const isUploading = uploadMutation.isPending;

  // Persist documents array to localStorage
  useEffect(() => {
    try {
      if (documents.length > 0) {
        localStorage.setItem(STORAGE_KEYS.FILENAME, JSON.stringify(documents));
      } else {
        localStorage.removeItem(STORAGE_KEYS.FILENAME);
      }
    } catch (e) {
      console.warn('Failed to persist documents to localStorage:', e);
    }
  }, [documents]);

  // Handle file upload with mutation
  const handleFileUpload = useCallback(
    async (file: File): Promise<void> => {
      if (!file) return;

      setUploadStatus('Indexing Document...');

      try {
        await uploadMutation.mutateAsync(file);
        setUploadStatus('Document Ready!');
        setTimeout(() => setUploadStatus(''), 3000);
        // Documents are refetched via React Query invalidation in useChat.ts
        // after a successful upload — no need to invalidate here
      } catch (err) {
        console.error('Upload error:', err);
        setUploadStatus('Upload Failed');
      }
    },
    [uploadMutation]
  );

  // Handle new chat (history only, documents persist)
  const handleNewChat = useCallback(async (): Promise<void> => {
    try {
      // Abort any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      await clearChatMutation.mutateAsync();
      clearMessages();
    } catch (err) {
      console.error('Failed to clear chat:', err);
    }
  }, [clearChatMutation, abortControllerRef, clearMessages]);

  // Handle reset session (full wipe: history + documents)
  const handleResetSession = useCallback(async (): Promise<void> => {
    try {
      // Abort any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      await resetMutation.mutateAsync();
      clearMessages();
      setDocuments([]);

      // Clear documents from localStorage
      localStorage.removeItem(STORAGE_KEYS.FILENAME);

      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Failed to reset session:', err);
    }
  }, [resetMutation, abortControllerRef, clearMessages]);

  return {
    isUploading,
    uploadStatus,
    documents,
    connectionStatus,
    fileInputRef,
    handleFileUpload,
    handleNewChat,
    handleResetSession,
  };
}
