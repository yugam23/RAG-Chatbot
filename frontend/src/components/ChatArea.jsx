import React from 'react';
import { FileText, Loader2, Bot } from 'lucide-react';
import { ChatMessage } from './ChatMessage';

/**
 * ChatArea - Main chat display area with message list and empty states
 */
export function ChatArea({
    messages,
    messagesEndRef,
    uploadedFileName,
    isLoading
}) {
    // Filter out empty assistant messages (we'll show "Thinking..." instead)
    const visibleMessages = messages.filter((msg, idx) => {
        // Show all non-empty messages
        if (msg.content !== '') return true;
        // Hide empty assistant message at the end (we show thinking indicator instead)
        if (idx === messages.length - 1 && msg.role === 'assistant' && isLoading) return false;
        return true;
    });

    const showThinking = isLoading &&
        messages.length > 0 &&
        messages[messages.length - 1]?.role === 'assistant' &&
        messages[messages.length - 1]?.content === '';

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth custom-scrollbar">
            {/* Empty State */}
            {messages.length === 0 && !isLoading && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                    <div className="p-4 rounded-full bg-white/5 border border-white/5">
                        <FileText className="w-12 h-12 text-gray-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-gray-200">
                            {uploadedFileName ? "Document Ready!" : "No documents indexed"}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {uploadedFileName
                                ? "Start asking questions about your document"
                                : "Upload a PDF to start analyzing content"
                            }
                        </p>
                    </div>
                </div>
            )}

            {/* Messages */}
            {visibleMessages.map((msg, idx) => (
                <ChatMessage key={idx} message={msg} />
            ))}

            {/* Thinking Indicator (replaces empty assistant bubble) */}
            {showThinking && (
                <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/20">
                        <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-black/40 text-gray-100 rounded-2xl rounded-tl-none border border-white/5 px-5 py-4">
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                            <span className="text-gray-400">Thinking...</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
        </div>
    );
}

export default ChatArea;
