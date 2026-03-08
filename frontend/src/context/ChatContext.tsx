import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useChat } from '../hooks/useChat';
import type { UseChatReturn } from '../hooks/useChat';

type ChatState = UseChatReturn;

const ChatContext = createContext<ChatState | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const chatState = useChat();
  return <ChatContext.Provider value={chatState}>{children}</ChatContext.Provider>;
};

export const useChatContext = (): ChatState => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};
