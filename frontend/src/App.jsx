import React, { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion'; // eslint-disable-line no-unused-vars

import { Header, ChatArea, ChatInput, SplashScreen } from './components';
import ErrorBoundary from './components/ErrorBoundary';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useChatContext } from './context/ChatContext';

/**
 * App - Main application component
 * Now wrapped in ErrorBoundary with connection status indicator
 * Keyboard shortcuts: Ctrl+K (focus), Ctrl+Shift+N (new chat), Escape (abort)
 */
const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const inputRef = useRef(null);

  // Get chat context for keyboard shortcuts
  const { handleNewChat, abortRequest } = useChatContext();

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    onNewChat: handleNewChat,
    onAbort: abortRequest,
    onFocusInput: () => {
      // Focus the input element
      const input = document.querySelector('.glass-input');
      if (input) input.focus();
    },
    inputRef,
  });

  return (
    <ErrorBoundary>
      <AnimatePresence mode="wait">
        {showSplash ? (
          <SplashScreen key="splash" onComplete={() => setShowSplash(false)} />
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen flex flex-col items-center justify-center p-2 sm:p-4 selection:bg-blue-500/30"
            style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
          >
            {/* Main Glass Panel */}
            <div className="w-full max-w-5xl h-[95vh] sm:h-[85vh] flex flex-col overflow-hidden glass-panel relative">
              {/* Background Glow Effects */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px]" />
              </div>

              {/* Header */}
              <Header />

              {/* Chat Area */}
              <ChatArea />

              {/* Input Area */}
              <ChatInput />
            </div>

            {/* Keyboard Shortcuts Hint - Hidden on mobile */}
            <div className="keyboard-hint mt-3 opacity-60 hidden md:flex">
              <kbd>Ctrl</kbd>+<kbd>K</kbd> Focus
              <span className="mx-2">•</span>
              <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>N</kbd> New Chat
              <span className="mx-2">•</span>
              <kbd>Esc</kbd> Stop
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ErrorBoundary>
  );
};

export default App;
