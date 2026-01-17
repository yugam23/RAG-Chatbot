import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useChat } from './hooks/useChat';
import { Header, ChatArea, ChatInput, SplashScreen } from './components';
import ErrorBoundary from './components/ErrorBoundary';

/**
 * App - Main application component
 * Now wrapped in ErrorBoundary with connection status indicator
 */
const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const {
    messages,
    isLoading,
    isUploading,
    uploadStatus,
    uploadedFileName,
    connectionStatus,
    fileInputRef,
    messagesEndRef,
    handleFileUpload,
    handleNewChat,
    handleClearChat,
    sendMessage,
    abortRequest,
  } = useChat();

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
            className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 to-black text-white selection:bg-blue-500/30"
          >
            {/* Main Glass Panel */}
            <div className="w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden glass-panel relative">
              {/* Background Glow Effects */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px]" />
              </div>

              {/* Header */}
              <Header
                uploadedFileName={uploadedFileName}
                uploadStatus={uploadStatus}
                isUploading={isUploading}
                fileInputRef={fileInputRef}
                onFileUpload={handleFileUpload}
                onNewChat={handleNewChat}
                connectionStatus={connectionStatus}
              />

              {/* Chat Area */}
              <ChatArea
                messages={messages}
                messagesEndRef={messagesEndRef}
                uploadedFileName={uploadedFileName}
                isLoading={isLoading}
              />

              {/* Input Area */}
              <ChatInput
                onSend={sendMessage}
                onClearChat={handleClearChat}
                onAbort={abortRequest}
                isLoading={isLoading}
                showClearChat={!!uploadedFileName}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ErrorBoundary>
  );
};

export default App;
