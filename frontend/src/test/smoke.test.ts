import { test, expect } from 'vitest';

test('vitest + MSW infrastructure works', async () => {
  // Verify MSW intercepts a request to /health
  const response = await fetch('http://localhost:8000/health');
  const data = await response.json() as { status: string; checks: { faiss: string; sqlite: string; gemini: string } };

  expect(response.ok).toBe(true);
  expect(data).toEqual({
    status: 'ok',
    checks: { faiss: 'ok', sqlite: 'ok', gemini: 'ok' },
  });
});

test('MSW intercepts /history endpoint', async () => {
  const response = await fetch('http://localhost:8000/history');
  const data = await response.json() as unknown[];

  expect(response.ok).toBe(true);
  expect(data).toEqual([]);
});

test('MSW intercepts /status endpoint', async () => {
  const response = await fetch('http://localhost:8000/status');
  const data = await response.json() as { has_document: boolean };

  expect(response.ok).toBe(true);
  expect(data.has_document).toBe(false);
});
