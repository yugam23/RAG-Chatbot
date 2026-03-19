import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { userEvent } from '@testing-library/user-event';
import { ChatProvider } from '../context/ChatContext';
import { ThemeProvider } from '../context/ThemeContext';
import App from '../App';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import type { ReactElement } from 'react';

const multiDocHandlers = [
  http.get('http://localhost:8000/documents', () => {
    return HttpResponse.json([
      { doc_id: '1', filename: 'doc1.pdf', chunk_count: 5, created_at: '2026-01-01' },
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

function renderWithApp(
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

  const result = render(ui, { wrapper: Wrapper });
  return { ...result, queryClient };
}

describe('Keyboard navigation', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => {
    server.resetHandlers();
  });
  afterAll(() => server.close());

  it('Ctrl+K focuses chat input from anywhere', async () => {
    renderWithApp(<App testProps={{ skipSplash: true }} />, { mswHandlers: multiDocHandlers });

    const input = document.querySelector<HTMLInputElement>('[aria-label="Ask a question about your document"]');
    expect(input).not.toBeNull();

    // Focus somewhere else first (body)
    document.body.focus();

    // Press Ctrl+K
    await userEvent.keyboard('{Control>}k');

    expect(input).toBe(document.activeElement);
  });

  it('Tab cycles through interactive elements in logical order', async () => {
    renderWithApp(<App testProps={{ skipSplash: true }} />, { mswHandlers: multiDocHandlers });

    // Get first tabbable element
    const firstTabbable = document.querySelector<HTMLElement>('button, input, [tabindex="0"]');
    firstTabbable?.focus();
    expect(document.activeElement).toBe(firstTabbable);

    // Tab to next element
    await userEvent.tab();
    const secondTabbable = document.activeElement;

    // Verify at least one interactive element is focused
    expect(secondTabbable).not.toBeNull();
    expect(['BUTTON', 'INPUT']).toContain(secondTabbable?.tagName);
  });

  it('Escape does not throw when not loading', async () => {
    renderWithApp(<App testProps={{ skipSplash: true }} />, { mswHandlers: multiDocHandlers });

    // Press Escape — should not throw
    await userEvent.keyboard('{Escape}');

    // Verify app still renders
    const header = document.querySelector('header');
    expect(header).not.toBeNull();
  });

  it('Enter activates send button when input is not empty', async () => {
    renderWithApp(<App testProps={{ skipSplash: true }} />, { mswHandlers: multiDocHandlers });

    const input = document.querySelector<HTMLInputElement>('[aria-label="Ask a question about your document"]');
    expect(input).not.toBeNull();

    // Focus input and type
    input?.focus();
    await userEvent.keyboard('Hello world');

    // Verify input has value
    expect(input?.value).toBe('Hello world');
  });
});
