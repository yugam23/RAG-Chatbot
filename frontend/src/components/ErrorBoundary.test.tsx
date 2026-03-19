import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from './ErrorBoundary';

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test error');
  return <div>Safe content</div>;
}

// Child that succeeds after first successful render (not just mount)
// Uses successfulRenderCount to track actual successful renders
let successfulRenderCount = 0;
function RecoveryChild() {
  successfulRenderCount++;
  if (successfulRenderCount === 1) {
    throw new Error('First render error');
  }
  return <div>Safe after retry</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    successfulRenderCount = 0;
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary showDetails={false}>
        <ThrowingChild shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  it('catches thrown error and renders fallback UI', () => {
    render(
      <ErrorBoundary showDetails={false}>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('renders error details when showDetails is true', async () => {
    render(
      <ErrorBoundary showDetails={true}>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(await screen.findByText(/test error/i)).toBeInTheDocument();
  });

  it('resets error state when Try Again is clicked', async () => {
    const user = userEvent.setup();

    render(
      <ErrorBoundary showDetails={false}>
        <RecoveryChild />
      </ErrorBoundary>
    );

    // Fallback shown with Try Again button
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /try again/i }));

    // After successful recovery, fallback is gone and child content is shown
    expect(await screen.findByText('Safe after retry')).toBeInTheDocument();
  });

  it('multiple throws are re-caught after reset', async () => {
    render(
      <ErrorBoundary showDetails={false}>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );

    // Verify fallback is shown
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();

    // Click Try Again - child throws again
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));

    // Fallback should appear again
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
