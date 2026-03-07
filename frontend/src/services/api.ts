/**
 * API Service - Centralized API calls
 * All backend communication goes through this module
 */

import type { Message, StatusResponse, UploadResponse, ResetResponse } from '../types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Default timeout for requests (10 seconds)
const DEFAULT_TIMEOUT = 10000;

/**
 * Wrapper for fetch with timeout support
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param timeout - Timeout in milliseconds
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout: number = DEFAULT_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch chat history from the server
 * @returns Array of message objects
 */
export async function fetchHistory(): Promise<Message[]> {
  const res = await fetchWithTimeout(`${API_URL}/history`);
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json() as Promise<Message[]>;
}

/**
 * Fetch current document status
 * @returns Status with filename (or null if no document loaded)
 */
export async function fetchStatus(): Promise<StatusResponse> {
  const res = await fetchWithTimeout(`${API_URL}/status`);
  if (!res.ok) throw new Error('Failed to fetch status');
  return res.json() as Promise<StatusResponse>;
}

/**
 * Reset the entire session (document + chat)
 * @returns Reset confirmation status
 */
export async function resetSession(): Promise<ResetResponse> {
  const res = await fetchWithTimeout(`${API_URL}/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset session');
  return res.json() as Promise<ResetResponse>;
}

/**
 * Clear only the chat history (keep document)
 * @returns Clear confirmation status
 */
export async function clearChat(): Promise<ResetResponse> {
  const res = await fetchWithTimeout(`${API_URL}/clear_chat`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to clear chat');
  return res.json() as Promise<ResetResponse>;
}

/**
 * Upload a PDF document
 * @param file - PDF file to upload
 * @returns Upload result with filename, status, and chunk count
 */
export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  // Longer timeout for uploads (2 minutes)
  const res = await fetchWithTimeout(
    `${API_URL}/upload`,
    {
      method: 'POST',
      body: formData,
    },
    120000 // 2 minute timeout for large file uploads
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Upload failed');
  }
  return res.json() as Promise<UploadResponse>;
}

/**
 * Send a chat message and get streaming response
 * Note: No timeout for streaming - handled by caller
 * @param question - User's question
 * @returns Streaming response (caller must handle body.getReader() with null guard)
 */
export async function sendChatMessage(question: string): Promise<Response> {
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
