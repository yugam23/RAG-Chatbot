/**
 * Skeleton Components
 * Loading placeholders for better UX during data fetching
 */

import React from 'react';
import './Skeleton.css';

/**
 * MessageSkeleton - Loading placeholder for chat messages
 */
export function MessageSkeleton({ isUser = false }) {
    return (
        <div className={`message-skeleton ${isUser ? 'user' : 'assistant'}`}>
            <div className="skeleton-avatar" />
            <div className="skeleton-content">
                <div className="skeleton-line" style={{ width: '60%' }} />
                <div className="skeleton-line" style={{ width: '80%' }} />
                <div className="skeleton-line" style={{ width: '40%' }} />
            </div>
        </div>
    );
}

/**
 * DocumentSkeleton - Loading placeholder for document processing
 */
export function DocumentSkeleton() {
    return (
        <div className="document-skeleton">
            <div className="skeleton-icon pulse" />
            <div className="skeleton-text">
                <div className="skeleton-line" style={{ width: '70%' }} />
                <div className="skeleton-line small" style={{ width: '50%' }} />
            </div>
        </div>
    );
}

/**
 * ChatAreaSkeleton - Loading placeholder for the entire chat area
 */
export function ChatAreaSkeleton() {
    return (
        <div className="chat-area-skeleton">
            <MessageSkeleton isUser={false} />
            <MessageSkeleton isUser={true} />
            <MessageSkeleton isUser={false} />
        </div>
    );
}

export default { MessageSkeleton, DocumentSkeleton, ChatAreaSkeleton };
