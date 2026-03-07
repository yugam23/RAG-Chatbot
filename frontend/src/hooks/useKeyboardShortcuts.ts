/**
 * Keyboard Shortcuts Hook (Tier 5)
 * Provides global keyboard shortcuts for better UX
 */

import { useEffect, useCallback } from 'react';
import type React from 'react';

interface UseKeyboardShortcutsOptions {
  onFocusInput?: () => void;
  onNewChat?: () => void;
  onAbort?: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

/**
 * Global keyboard shortcuts:
 * - Ctrl/Cmd + K: Focus input
 * - Ctrl/Cmd + Shift + N: New chat
 * - Escape: Abort current request or clear
 */
export function useKeyboardShortcuts({
  onFocusInput,
  onNewChat,
  onAbort,
  inputRef,
}: UseKeyboardShortcutsOptions): void {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + K: Focus input
      if (ctrlOrCmd && e.key === 'k') {
        e.preventDefault();
        if (inputRef?.current) {
          inputRef.current.focus();
        }
        onFocusInput?.();
      }

      // Ctrl/Cmd + Shift + N: New chat
      if (ctrlOrCmd && e.shiftKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        onNewChat?.();
      }

      // Escape: Abort current request
      if (e.key === 'Escape') {
        onAbort?.();
      }
    },
    [onFocusInput, onNewChat, onAbort, inputRef]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Get keyboard shortcut display text based on platform
 */
export function getShortcutKey(): string {
  const isMac = navigator.platform?.toUpperCase().indexOf('MAC') >= 0;
  return isMac ? '⌘' : 'Ctrl';
}

export default useKeyboardShortcuts;
