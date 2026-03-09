import { useState, useEffect, useRef, useCallback } from 'react';
import type React from 'react';
import { STORAGE_KEYS } from './useChatMessages';
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
  uploadedFileName: string | null;
  connectionStatus: 'online' | 'offline' | 'checking';
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (file: File) => Promise<void>;
  handleNewChat: () => Promise<void>;
  handleClearChat: () => Promise<void>;
}

/**
 * Hook for upload state, file actions, and connection status.
 * Owns: uploadStatus, uploadedFileName, fileInputRef, connectionStatus derivation,
 * and all file/chat action callbacks.
 */
export function useDocumentState({
  statusQuery,
  healthQuery,
  uploadMutation,
  resetMutation,
  clearChatMutation,
  abortControllerRef,
  clearMessages,
}: UseDocumentStateParams): UseDocumentStateReturn {
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.FILENAME) || null;
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

  // Sync server status with local state
  useEffect(() => {
    if (statusQuery.isSuccess) {
      setUploadedFileName(statusQuery.data.filename || null);
    }
  }, [statusQuery.data, statusQuery.isSuccess]);

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

  // Handle file upload with mutation
  const handleFileUpload = useCallback(
    async (file: File): Promise<void> => {
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
  const handleNewChat = useCallback(async (): Promise<void> => {
    try {
      // Abort any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      await resetMutation.mutateAsync();
      clearMessages();
      setUploadedFileName(null);

      // Clear filename from localStorage (clearMessages handles RECENT)
      localStorage.removeItem(STORAGE_KEYS.FILENAME);

      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Failed to reset chat:', err);
    }
  }, [resetMutation, abortControllerRef, clearMessages]);

  // Handle clear chat (keep document)
  const handleClearChat = useCallback(async (): Promise<void> => {
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

  return {
    isUploading,
    uploadStatus,
    uploadedFileName,
    connectionStatus,
    fileInputRef,
    handleFileUpload,
    handleNewChat,
    handleClearChat,
  };
}
