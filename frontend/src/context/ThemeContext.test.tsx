import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme, ThemeProvider } from './ThemeContext';

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('useTheme', () => {
    it('throws when rendered outside ThemeProvider', () => {
      expect(() => renderHook(() => useTheme())).toThrow(
        'useTheme must be used within a ThemeProvider'
      );
    });

    it('theme defaults to dark when no localStorage value', () => {
      const wrapper = ({ children }: { children: unknown }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.theme).toBe('dark');
    });

    it('theme persists choice to localStorage under rag_chatbot_theme', () => {
      const wrapper = ({ children }: { children: unknown }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => result.current.toggleTheme());

      expect(localStorage.getItem('rag_chatbot_theme')).toBe('light');
      expect(result.current.theme).toBe('light');
    });

    it('theme reads saved value from localStorage on mount', () => {
      localStorage.setItem('rag_chatbot_theme', 'light');

      const wrapper = ({ children }: { children: unknown }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.theme).toBe('light');
      expect(result.current.isLight).toBe(true);
      expect(result.current.isDark).toBe(false);
    });

    it('isDark and isLight are derived correctly from theme', () => {
      const wrapper = ({ children }: { children: unknown }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      // Initially dark
      expect(result.current.isDark).toBe(true);
      expect(result.current.isLight).toBe(false);

      // After toggle
      act(() => result.current.toggleTheme());
      expect(result.current.isDark).toBe(false);
      expect(result.current.isLight).toBe(true);
    });
  });
});
