/**
 * Sentry initialization for frontend error tracking.
 *
 * MUST be imported as the first module in main.tsx before any other code runs.
 * Initializes Sentry conditionally only when VITE_SENTRY_DSN_FRONTEND is set.
 * If the DSN is absent or empty, Sentry is silently disabled with no error or warning.
 *
 * Part of: OBS-02, OBS-03, OBS-04
 */

import * as Sentry from "@sentry/react";

const dsn = import.meta.env.VITE_SENTRY_DSN_FRONTEND;
if (dsn && dsn.trim() !== "") {
  Sentry.init({ dsn });
}
// No else branch — Sentry silently disabled when no DSN is provided
