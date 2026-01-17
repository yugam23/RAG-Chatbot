import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User } from 'lucide-react';
import { markdownComponents } from './MarkdownComponents';

/**
 * ChatMessage - Renders a single chat message bubble
 * @param {{role: 'user' | 'assistant', content: string}} message
 */
export function ChatMessage({ message }) {
    const isUser = message.role === 'user';

    return (
        <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20'
                    : 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/20'
                }`}>
                {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
            </div>

            {/* Message Bubble */}
            <div className={`max-w-[80%] rounded-2xl px-5 py-4 shadow-sm ${isUser
                    ? 'bg-white/10 text-white rounded-tr-none border border-white/5'
                    : 'bg-black/40 text-gray-100 rounded-tl-none border border-white/5'
                }`}>
                <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {message.content}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
}

export default ChatMessage;
