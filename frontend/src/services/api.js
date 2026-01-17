/**
 * API Service - Centralized API calls
 * All backend communication goes through this module
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

// Default timeout for requests (10 seconds)
const DEFAULT_TIMEOUT = 10000;

/**
 * Wrapper for fetch with timeout support
 * @param {string} url - URL to fetch
 * @param {RequestInit} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}, timeout = DEFAULT_TIMEOUT) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        return response;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error(`Request timed out after ${timeout}ms`);
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Fetch chat history from the server
 * @returns {Promise<Array>} Array of message objects
 */
export async function fetchHistory() {
    const res = await fetchWithTimeout(`${API_URL}/history`);
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
}

/**
 * Fetch current document status
 * @returns {Promise<{filename: string|null}>}
 */
export async function fetchStatus() {
    const res = await fetchWithTimeout(`${API_URL}/status`);
    if (!res.ok) throw new Error('Failed to fetch status');
    return res.json();
}

/**
 * Reset the entire session (document + chat)
 * @returns {Promise<{status: string}>}
 */
export async function resetSession() {
    const res = await fetchWithTimeout(`${API_URL}/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset session');
    return res.json();
}

/**
 * Clear only the chat history (keep document)
 * @returns {Promise<{status: string}>}
 */
export async function clearChat() {
    const res = await fetchWithTimeout(`${API_URL}/clear_chat`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to clear chat');
    return res.json();
}

/**
 * Upload a PDF document
 * @param {File} file - PDF file to upload
 * @returns {Promise<{filename: string, status: string, chunks: number}>}
 */
export async function uploadDocument(file) {
    const formData = new FormData();
    formData.append('file', file);

    // Longer timeout for uploads (2 minutes)
    const res = await fetchWithTimeout(
        `${API_URL}/upload`,
        {
            method: 'POST',
            body: formData,
        },
        120000  // 2 minute timeout for large file uploads
    );

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Upload failed');
    }
    return res.json();
}

/**
 * Send a chat message and get streaming response
 * Note: No timeout for streaming - handled by caller
 * @param {string} question - User's question
 * @returns {Promise<Response>} Streaming response
 */
export async function sendChatMessage(question) {
    const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Chat request failed');
    }
    return res;
}

export { API_URL };
