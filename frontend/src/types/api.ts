/**
 * API contract interfaces — shapes matching FastAPI backend responses.
 * Source of truth for the entire data pipeline.
 */

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface StatusResponse {
  filename: string | null;
}

export interface UploadResponse {
  filename: string;
  status: string;
  chunks: number;
}

export interface ResetResponse {
  status: string;
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  checks: {
    faiss: 'ok' | 'degraded';
    sqlite: 'ok' | 'degraded';
    gemini: 'ok' | 'degraded';
  };
}

/**
 * Server-Sent Event payload from /chat endpoint.
 * type 'token' → data is a string token fragment
 * type 'sources' → data is string[] of source chunk identifiers
 * type 'error' → data is a string error message
 */
export interface StreamEvent {
  type: 'token' | 'sources' | 'error';
  data: string | string[];
}
