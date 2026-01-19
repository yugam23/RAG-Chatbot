import React from 'react';
import { Loader2, Upload, FileText, Wifi, WifiOff, Sun, Moon, MessageSquarePlus } from 'lucide-react';

/**
 * ConnectionIndicator - Shows backend connection status
 */
const ConnectionIndicator = ({ status }) => {
  if (status === 'online') {
    return (
      <div className="flex items-center gap-1.5 text-green-400" title="Connected">
        <Wifi size={14} />
        <span className="text-xs font-medium hidden sm:inline">Connected</span>
      </div>
    );
  } else if (status === 'offline') {
    return (
      <div className="flex items-center gap-1.5 text-red-400" title="Offline">
        <WifiOff size={14} />
        <span className="text-xs font-medium hidden sm:inline">Offline</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-yellow-400 animate-pulse" title="Connecting...">
      <Wifi size={14} />
      <span className="text-xs font-medium hidden sm:inline">Connecting...</span>
    </div>
  );
};

/**
 * ThemeToggle - Button to switch between dark and light mode
 */
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-yellow-300" />
      ) : (
        <Moon className="w-5 h-5 text-slate-600" />
      )}
    </button>
  );
};

/**
 * Header - Top navigation bar with logo, upload, and action buttons
 */
import { useChatContext } from '../context/ChatContext';

/**
 * Header - Top navigation bar with logo, upload, and action buttons
 */
export function Header() {
  const {
    uploadedFileName,
    uploadStatus,
    isUploading,
    fileInputRef,
    handleFileUpload: onFileUpload,
    handleNewChat: onNewChat,
    connectionStatus,
  } = useChatContext();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onFileUpload(file);
  };

  return (
    <header className="px-3 sm:px-6 py-3 sm:py-4 border-b border-white/5 bg-black/20">
      {/* Single-row responsive layout */}
      <div className="flex items-center justify-between gap-2">
        {/* Logo & Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <img
            src="/chatbot.png"
            alt="RAG Chatbot Logo"
            className="w-8 h-8 sm:w-12 sm:h-12 object-contain flex-shrink-0"
          />
          <div className="min-w-0">
            <h1 className="text-sm sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-white truncate">
              RAG Chatbot
            </h1>
            <p className="text-[8px] sm:text-xs text-gray-400 font-medium tracking-wide hidden sm:block">
              INTELLIGENT DOCUMENT ASSISTANT
            </p>
          </div>
        </div>

        {/* Actions - compact on mobile */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          {/* Connection Status */}
          <ConnectionIndicator status={connectionStatus} />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Upload Status Indicator - hide text on mobile */}
          {uploadStatus && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
              {isUploading ? (
                <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              )}
              <span className="text-xs text-blue-300 font-medium">{uploadStatus}</span>
            </div>
          )}

          {/* New Chat Button - Only show after upload */}
          {uploadedFileName && (
            <button
              onClick={onNewChat}
              className="new-chat-btn p-2 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-white/10 hover:bg-white/15 border border-white/5 transition-all"
              aria-label="Start new chat"
              title="New Chat"
            >
              <MessageSquarePlus className="w-4 h-4 text-gray-200" />
            </button>
          )}

          {/* Upload Button / File Name Display */}
          {!uploadedFileName ? (
            <>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
                aria-label="Upload PDF document"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-blue-200 hover:text-blue-100"
                aria-label="Upload PDF"
                title="Upload PDF"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                ) : (
                  <Upload className="w-4 h-4 text-blue-400" />
                )}
                <span className="hidden sm:inline">Upload PDF</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg sm:rounded-xl bg-green-500/10 border border-green-500/20 max-w-[100px] sm:max-w-[180px]">
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs font-medium text-green-100 truncate">
                {uploadedFileName}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
