import React, { useState } from 'react';
import { Send } from 'lucide-react';

/**
 * ChatInput - Message input field with send button and clear chat action
 */
import { useChatContext } from '../context/ChatContext';

/**
 * ChatInput - Message input field with send button and clear chat action
 */
export function ChatInput() {
  const {
    sendMessage: onSend,
    handleClearChat: onClearChat,
    abortRequest: onAbort,
    isLoading,
    uploadedFileName,
  } = useChatContext();
  const showClearChat = !!uploadedFileName;
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-5 border-t border-white/5 bg-black/20 backdrop-blur-md">
      <div className="flex gap-3 relative max-w-4xl mx-auto">
        {/* Clear Chat Button */}
        {showClearChat && (
          <button
            onClick={onClearChat}
            className="absolute bottom-full mb-7 -left-12 p-2.5 rounded-full bg-black/40 hover:bg-blue-600/20 border border-white/10 hover:border-blue-500/30 transition-all text-gray-400 hover:text-blue-400 group backdrop-blur-md shadow-lg"
            aria-label="Clear chat history"
          >
            <img
              src="/clear_chat.png"
              alt="Clear Chat"
              className="w-6 h-6 object-contain brightness-0 invert opacity-70 group-hover:opacity-100 transition-opacity"
            />
            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2.5 py-1 bg-black/90 border border-white/10 rounded-lg text-[10px] font-medium tracking-wide text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0 pointer-events-none shadow-xl">
              Clear Chat
            </span>
          </button>
        )}

        {/* Input Field */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question..."
          disabled={isLoading}
          className="glass-input w-full pr-12"
          aria-label="Ask a question about your document"
        />

        {/* Send / Stop Button */}
        <button
          onClick={isLoading ? onAbort : handleSubmit}
          disabled={!isLoading && !input.trim()}
          className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all shadow-lg 
                        ${
                          isLoading
                            ? 'bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30'
                            : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white disabled:opacity-0 disabled:scale-75'
                        }`}
          aria-label={isLoading ? 'Stop generating' : 'Send message'}
        >
          {isLoading ? (
            <div className="w-4 h-4 rounded-sm bg-current" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

export default ChatInput;
