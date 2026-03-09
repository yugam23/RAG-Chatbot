import { useState, useRef, useCallback } from 'react';
import type React from 'react';
import * as api from '../services/api';
import type { Message, StreamEvent } from '../types/api';

export interface UseSseStreamReturn {
  isLoading: boolean;
  sendMessage: (input: string) => Promise<void>;
  abortRequest: () => void;
  abortControllerRef: React.MutableRefObject<AbortController | null>;
}

/**
 * Hook for SSE streaming logic with AbortController.
 * Owns: isLoading state, abortControllerRef, sendMessage and abortRequest callbacks.
 * Accepts setMessages from useChatMessages to update message state during streaming.
 */
export function useSseStream(
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
): UseSseStreamReturn {
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Abort ongoing request
  const abortRequest = useCallback((): void => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  // Send a message with abort support
  const sendMessage = useCallback(
    async (input: string): Promise<void> => {
      if (!input.trim()) return;

      // Abort any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      const userMsg: Message = { role: 'user', content: input };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const response = await api.sendChatMessage(input);
        // API-03: Response.body is ReadableStream | null in DOM types
        if (response.body === null) {
          throw new Error('Response body is null — streaming not supported in this environment');
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const assistantMsg: Message = { role: 'assistant', content: '' };

        setMessages((prev) => [...prev, assistantMsg]);

        while (true) {
          // Check if aborted
          if (abortControllerRef.current?.signal.aborted) {
            void reader.cancel();
            break;
          }

          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line) continue;
            try {
              const json = JSON.parse(line) as StreamEvent;
              if (json.type === 'token') {
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  const lastMsg = newMsgs[newMsgs.length - 1];
                  newMsgs[newMsgs.length - 1] = {
                    ...lastMsg,
                    content: lastMsg.content + (json.data as string),
                  };
                  return newMsgs;
                });
              } else if (json.type === 'error') {
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  const lastMsg = newMsgs[newMsgs.length - 1];
                  newMsgs[newMsgs.length - 1] = {
                    ...lastMsg,
                    content: lastMsg.content + `\n\n**Error:** ${json.data as string}`,
                  };
                  return newMsgs;
                });
              }
            } catch {
              // Skip malformed JSON chunks
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          // Request was aborted, no need to log
          return;
        }
        console.error('Chat error:', err);
        const message = (err as Error).message || 'Failed to get response. Please try again.';
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `**Error:** ${message}` },
        ]);
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [setMessages]
  );

  return { isLoading, sendMessage, abortRequest, abortControllerRef };
}
