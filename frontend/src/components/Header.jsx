import React from 'react';
import { Loader2, Upload, FileText, Wifi, WifiOff } from 'lucide-react';

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
 * Header - Top navigation bar with logo, upload, and action buttons
 */
export function Header({
  uploadedFileName,
  uploadStatus,
  isUploading,
  fileInputRef,
  onFileUpload,
  onNewChat,
  connectionStatus,
}) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onFileUpload(file);
  };

  return (
    <header className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-black/20">
      {/* Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            src="/chatbot.png"
            alt="Logo"
            className="w-12 h-12 object-contain hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
          />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-white">
            RAG Chatbot
          </h1>
          <p className="text-xs text-gray-400 font-medium tracking-wide">
            INTELLIGENT DOCUMENT ASSISTANT
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Connection Status */}
        <ConnectionIndicator status={connectionStatus} />

        <div className="h-6 w-px bg-white/10" />

        {/* Upload Status Indicator */}
        {uploadStatus && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
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
          <>
            <button
              onClick={onNewChat}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/5 transition-all text-sm font-medium text-gray-200 hover:text-white"
            >
              <img
                src="/message.png"
                alt="New Chat"
                className="w-4 h-4 object-contain brightness-0 invert relative top-[1px]"
              />
              <span>New Chat</span>
            </button>
          </>
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
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 transition-all text-sm font-medium text-blue-200 hover:text-blue-100 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
              )}
              <span>Upload PDF</span>
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
            <FileText className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-100 truncate max-w-[200px]">
              {uploadedFileName}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
