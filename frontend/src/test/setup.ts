import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from '../mocks/server';

// Mock requestIdleCallback for @axe-core/react (jsdom does not provide this API)
// requestIdleCallback is used by axe-core to defer work; we polyfill with setTimeout
if (typeof global.requestIdleCallback === 'undefined') {
  global.requestIdleCallback = (cb: IdleRequestCallback) => setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 }), 0);
  global.cancelIdleCallback = (id: number) => clearTimeout(id);
}

// Mock scrollIntoView for jsdom (jsdom Element does not implement scrollIntoView)
if (typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = function _scrollIntoView() {
    // no-op in jsdom — real browser provides this
  };
}

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

// Close MSW server after all tests
afterAll(() => server.close());
