import { useState, useEffect, useRef, useCallback } from 'react';
import * as api from '../services/api';

/**
 * Custom hook for chat functionality
 * Manages messages, document state, and API interactions
 */
export function useChat() {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [uploadedFileName, setUploadedFileName] = useState(null);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Initialize: fetch history and status on mount
    useEffect(() => {
        const init = async () => {
            try {
                const [history, status] = await Promise.all([
                    api.fetchHistory(),
                    api.fetchStatus(),
                ]);
                setMessages(history);
                setUploadedFileName(status.filename || null);
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

    // Handle file upload
    const handleFileUpload = useCallback(async (file) => {
        if (!file) return;

        setIsUploading(true);
        setUploadStatus('Indexing Document...');

        try {
            await api.uploadDocument(file);
            setUploadStatus('Document Ready!');
            setUploadedFileName(file.name);
            setTimeout(() => setUploadStatus(''), 3000);
        } catch (err) {
            console.error('Upload error:', err);
            setUploadStatus('Upload Failed');
        } finally {
            setIsUploading(false);
        }
    }, []);

    // Handle new chat (reset everything)
    const handleNewChat = useCallback(async () => {
        try {
            await api.resetSession();
            setMessages([]);
            setUploadedFileName(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            console.error('Failed to reset chat:', err);
        }
    }, []);

    // Handle clear chat (keep document)
    const handleClearChat = useCallback(async () => {
        try {
            await api.clearChat();
            setMessages([]);
        } catch (err) {
            console.error('Failed to clear chat:', err);
        }
    }, []);

    // Send a message
    const sendMessage = useCallback(async (input) => {
        if (!input.trim()) return;

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
            console.error('Chat error:', err);
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: '**Error:** Failed to get response. Please try again.' }
            ]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        // State
        messages,
        isLoading,
        isUploading,
        uploadStatus,
        uploadedFileName,

        // Refs
        fileInputRef,
        messagesEndRef,

        // Actions
        handleFileUpload,
        handleNewChat,
        handleClearChat,
        sendMessage,
    };
}
