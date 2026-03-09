import { http, HttpResponse } from 'msw';

const API_URL = 'http://localhost:8000';

// NOTE: The streaming /chat SSE endpoint is intentionally excluded from MSW handlers.
// SSE streaming tests use a manually constructed ReadableStream via vi.mock('../services/api').
// This is a jsdom architectural limitation — MSW cannot intercept ReadableStream in jsdom.
// See .planning/STATE.md "MSW streaming constraint" decision.

export const handlers = [
  // GET /history — returns chat message history
  http.get(`${API_URL}/history`, () => {
    return HttpResponse.json([]);
  }),

  // GET /status — returns document upload status
  http.get(`${API_URL}/status`, () => {
    return HttpResponse.json({ has_document: false, filename: null, chunk_count: 0 });
  }),

  // GET /health — returns health check
  http.get(`${API_URL}/health`, () => {
    return HttpResponse.json({
      status: 'ok',
      checks: { faiss: 'ok', sqlite: 'ok', gemini: 'ok' },
    });
  }),

  // POST /upload — file upload
  http.post(`${API_URL}/upload`, () => {
    return HttpResponse.json({ message: 'Document uploaded successfully', filename: 'test.pdf', chunk_count: 10 });
  }),

  // POST /reset — reset session (new chat)
  http.post(`${API_URL}/reset`, () => {
    return HttpResponse.json({ message: 'Session reset' });
  }),

  // POST /clear_chat — clear chat history only
  http.post(`${API_URL}/clear_chat`, () => {
    return HttpResponse.json({ message: 'Chat cleared' });
  }),

  // GET /documents — list uploaded documents
  http.get(`${API_URL}/documents`, () => {
    return HttpResponse.json([]);
  }),

  // DELETE /documents/:doc_id — delete a specific document
  http.delete(`${API_URL}/documents/:doc_id`, () => {
    return HttpResponse.json({ message: 'Document deleted' });
  }),
];
