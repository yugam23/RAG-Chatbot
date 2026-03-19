import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axe from 'axe-core';
import { ChatProvider } from '../context/ChatContext';
import { ThemeProvider } from '../context/ThemeContext';
import { Header } from '../components/Header';
import { ChatArea } from '../components/ChatArea';
import { ChatInput } from '../components/ChatInput';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import type { ReactElement } from 'react';

// Multi-document MSW handler for axe tests
const multiDocHandlers = [
  http.get('http://localhost:8000/documents', () => {
    return HttpResponse.json([
      { doc_id: '1', filename: 'doc1.pdf', chunk_count: 5, created_at: '2026-01-01' },
      { doc_id: '2', filename: 'doc2.pdf', chunk_count: 3, created_at: '2026-01-02' },
    ]);
  }),
];

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

// Render with ChatProvider + ThemeProvider + QueryClientProvider
// (required for components using useChatContext and useTheme)
function renderWithChatProvider(
  ui: ReactElement,
  { mswHandlers = [] }: { mswHandlers?: Parameters<typeof server.use>[0] } = {}
) {
  const queryClient = createTestQueryClient();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ChatProvider>{children}</ChatProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  if (mswHandlers.length > 0) {
    server.use(...mswHandlers);
  }

  return { ...render(ui, { wrapper: Wrapper }), queryClient };
}

// axe-core configuration: disable color-contrast in jsdom (glassmorphism backgrounds
// don't render correctly in jsdom, causing false positive contrast violations).
// Contrast will be validated in real browser via Playwright.
const axeConfig = {
  rules: [{ id: 'color-contrast', enabled: false }],
};

describe('Accessibility audits (axe-core)', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => {
    server.resetHandlers();
  });
  afterAll(() => server.close());

  it('Header has zero critical or serious violations', async () => {
    const { container } = renderWithChatProvider(<Header />, { mswHandlers: multiDocHandlers });
    axe.configure(axeConfig);
    const results = await axe.run(container);
    const criticalOrSerious = results.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalOrSerious).toHaveLength(0);
  });

  it('ChatArea has zero critical or serious violations', async () => {
    const { container } = renderWithChatProvider(<ChatArea />);
    axe.configure(axeConfig);
    const results = await axe.run(container);
    const criticalOrSerious = results.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalOrSerious).toHaveLength(0);
  });

  it('ChatInput has zero critical or serious violations', async () => {
    const { container } = renderWithChatProvider(<ChatInput />);
    axe.configure(axeConfig);
    const results = await axe.run(container);
    const criticalOrSerious = results.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalOrSerious).toHaveLength(0);
  });
});
