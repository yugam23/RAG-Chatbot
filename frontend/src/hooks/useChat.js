import { useState, useEffect, useRef, useCallback } from 'react';
import * as api from '../services/api';

// LocalStorage keys
const STORAGE_KEYS = {
    MESSAGES: 'rag_chatbot_messages',
    FILENAME: 'rag_chatbot_filename',
};

// Retry configuration
const RETRY_CONFIG = {
    maxRetries: 3,
    baseDelay: 1000, // ms
};

/**
 * Custom hook for chat functionality
 * Manages messages, document state, and API interactions
 * Now with: abort controller, retry logic, localStorage persistence
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
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [uploadedFileName, setUploadedFileName] = useState(() => {
        return localStorage.getItem(STORAGE_KEYS.FILENAME) || null;
    });
    const [connectionStatus, setConnectionStatus] = useState('checking'); // 'online', 'offline', 'checking'

    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const abortControllerRef = useRef(null);

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

    // Check backend health on mount and periodically
    useEffect(() => {
        const checkHealth = async () => {
            try {
                const response = await fetch(`${api.API_URL}/health`, {
                    method: 'GET',
                    signal: AbortSignal.timeout(5000)
                });
                if (response.ok) {
                    setConnectionStatus('online');
                } else {
                    setConnectionStatus('offline');
                }
            } catch {
                setConnectionStatus('offline');
            }
        };

        checkHealth();
        const interval = setInterval(checkHealth, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    // Initialize: fetch history and status on mount (if online)
    useEffect(() => {
        const init = async () => {
            try {
                const [history, status] = await Promise.all([
                    api.fetchHistory(),
                    api.fetchStatus(),
                ]);

                // Only update if server has data (don't overwrite local with empty)
                if (history.length > 0) {
                    setMessages(history);
                }
                if (status.filename) {
                    setUploadedFileName(status.filename);
                }
            } catch (err) {
                console.error('Failed to initialize chat:', err);
            }
        };
        init();
    }, []);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    /**
     * Retry wrapper for API calls
     */
    const withRetry = useCallback(async (fn, retries = RETRY_CONFIG.maxRetries) => {
        let lastError;
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                return await fn();
            } catch (err) {
                lastError = err;
                if (attempt < retries - 1) {
                    const delay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt);
                    console.warn(`Retry attempt ${attempt + 1} after ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        throw lastError;
    }, []);

    // Handle file upload with retry
    const handleFileUpload = useCallback(async (file) => {
        if (!file) return;

        setIsUploading(true);
        setUploadStatus('Indexing Document...');

        try {
            await withRetry(() => api.uploadDocument(file));
            setUploadStatus('Document Ready!');
            setUploadedFileName(file.name);
            setTimeout(() => setUploadStatus(''), 3000);
        } catch (err) {
            console.error('Upload error:', err);
            setUploadStatus('Upload Failed');
        } finally {
            setIsUploading(false);
        }
    }, [withRetry]);

    // Handle new chat (reset everything)
    const handleNewChat = useCallback(async () => {
        try {
            // Abort any ongoing request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            await api.resetSession();
            setMessages([]);
            setUploadedFileName(null);

            // Clear localStorage
            localStorage.removeItem(STORAGE_KEYS.MESSAGES);
            localStorage.removeItem(STORAGE_KEYS.FILENAME);

            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            console.error('Failed to reset chat:', err);
        }
    }, []);

    // Handle clear chat (keep document)
    const handleClearChat = useCallback(async () => {
        try {
            // Abort any ongoing request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            await api.clearChat();
            setMessages([]);
            localStorage.removeItem(STORAGE_KEYS.MESSAGES);
        } catch (err) {
            console.error('Failed to clear chat:', err);
        }
    }, []);

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
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const response = await api.sendChatMessage(input);
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantMsg = { role: 'assistant', content: '' };

            setMessages(prev => [...prev, assistantMsg]);

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
                            setMessages(prev => {
                                const newMsgs = [...prev];
                                newMsgs[newMsgs.length - 1] = { ...assistantMsg };
                                return newMsgs;
                            });
                        } else if (json.type === 'error') {
                            assistantMsg.content += `\n\n**Error:** ${json.data}`;
                            setMessages(prev => {
                                const newMsgs = [...prev];
                                newMsgs[newMsgs.length - 1] = { ...assistantMsg };
                                return newMsgs;
                            });
                        }
                    } catch (e) {
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
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: '**Error:** Failed to get response. Please try again.' }
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
