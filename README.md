<div align="center">

# RAG Chatbot

### *Your Documents. Your Questions. Instant AI-Powered Answers.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.9+-blue?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![Sentry](https://img.shields.io/badge/Sentry-Observability-362d59?style=flat-square&logo=sentry&logoColor=white)](https://sentry.io/)

<!-- Feature Badges -->
[![PDF Processing](https://img.shields.io/badge/PDF-Processing-FF6B6B?style=flat-square)](#pdf-processing)
[![FAISS Vector Search](https://img.shields.io/badge/FAISS-Vector%20Search-4ECDC4?style=flat-square)](#rag-pipeline)
[![SSE Streaming](https://img.shields.io/badge/SSE-Streaming-45B7D1?style=flat-square)](#real-time-streaming)
[![SQLite Sessions](https://img.shields.io/badge/SQLite-Sessions-96CEB4?style=flat-square)](#session-management)
[![Rate Limiting](https://img.shields.io/badge/Security-Rate%20Limiting-F7DC6F?style=flat-square)](#security)

[Quick Start](#-quick-start) · [Features](#-features) · [Architecture](#-architecture) · [API Reference](#-api-reference) · [Docker](#-docker) · [Contributing](./CONTRIBUTING.md)

---

</div>

## TL;DR

**RAG Chatbot** lets you upload PDFs and chat with them using Google's Gemini AI. It uses [RAG](https://arxiv.org/abs/2005.11401) (Retrieval-Augmented Generation) to ensure answers come *directly from your documents* — no hallucinations, no made-up facts.

> Upload a 200-page contract → ask "What are the termination clauses?" → get instant, accurate answers with citations.

---

## Use Cases

RAG Chatbot is perfect for:

| Use Case | What You Upload | What You Ask |
|----------|-----------------|--------------|
| **Legal Documents** | Contracts, NDAs, agreements | "What are the liability limits?" |
| **Research Papers** | Academic PDFs, technical papers | "Summarize the methodology" |
| **Technical Docs** | API specs, architecture docs | "How do I authenticate?" |
| **Financial Reports** | Earnings reports, audits | "What was the revenue growth?" |
| **Policy Documents** | Employee handbooks, compliance | "What's the PTO policy?" |
| **Books & Manuals** | Product manuals, guidebooks | "How do I reset the device?" |

---

## Demo

<div align="center">
  <img src="demo/demo.webp" alt="RAG Chatbot Demo" width="100%">
</div>

---

## Quick Start

### Prerequisites

| Requirement | Version | Download |
|-------------|---------|----------|
| Python | 3.9+ | [python.org](https://www.python.org/downloads/) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| Google API Key | — | [Get free key](https://aistudio.google.com/app/apikey) |

### 1. Clone & Configure

```bash
git clone https://github.com/yugam23/RAG-Chatbot.git
cd RAG-Chatbot
cp .env.example .env
```

Edit `.env` and add your Google API key:
```env
GOOGLE_API_KEY=your_actual_api_key_here
```

### 2. Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python main.py
# Backend running at http://localhost:8000
```

### 3. Frontend

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
# Frontend running at http://localhost:5173
```

Open **[http://localhost:5173](http://localhost:5173)** and start chatting!

> **Tip:** Press `Ctrl+K` to focus the chat input. Press `Ctrl+Shift+N` for a new chat session.

---

## Docker

One-command setup with Docker Compose:

```bash
# 1. Add your API key
echo "GOOGLE_API_KEY=your_key_here" > .env

# 2. Start everything
docker compose up
```

App available at **[http://localhost:5173](http://localhost:5173)** · API docs at **[http://localhost:8000/docs](http://localhost:8000/docs)**

> **Ephemeral Sessions:** The FAISS index and SQLite database are **deleted on every container restart** by design. Uploaded documents do not persist across restarts. See `docker-compose.yml` for optional volume mounting to enable persistence.

---

## Features

### Backend

| Feature | Description |
|---------|-------------|
| **Google Gemini** | `gemini-flash-latest` for fast, accurate responses |
| **RAG Pipeline** | Recursive chunking (800 chars, 400 overlap) + Gecko embeddings |
| **FAISS Vector Search** | CPU-optimized indexing, top-k=7 retrieval |
| **PDF Processing** | Magic byte validation, 50MB limit, PyPDF text extraction |
| **Multi-document Index** | Per-document FAISS shards merged into unified index |
| **Session Management** | SQLite chat history with async operations |
| **Security** | Rate limiting (10 uploads/min, 30 chat/min), API key auth, CSP headers |
| **Observability** | Sentry error tracking + structured logging (structlog) |

### Frontend

| Feature | Description |
|---------|-------------|
| **Glassmorphism UI** | Blur effects, gradients, depth |
| **Startup Animation** | Smooth logo intro with Framer Motion |
| **Real-Time Streaming** | SSE with live token rendering |
| **Markdown Rendering** | Syntax highlighting via `react-markdown` + `remark-gfm` |
| **Dark/Light Theme** | Persistent theme toggle |
| **Responsive** | Optimized for desktop, tablet, mobile |
| **Connection Status** | Live health indicators (FAISS, SQLite, Gemini API) |
| **ErrorBoundary** | Sentry-integrated error handling with fallback UI |
| **Keyboard Shortcuts** | `Ctrl+K` focus · `Ctrl+Shift+N` new chat · `Esc` abort |
| **TanStack Query** | Optimistic updates, caching, background refetch |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  React 19 + Vite 7 + Tailwind CSS 4 + Framer Motion +           │
│  TanStack Query + TypeScript + Sentry ErrorBoundary              │
│  ─────────────────────────────────────────────────────────────   │
│  Ports: 5173 (dev) · 80 (prod)                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP / SSE (application/x-ndjson)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│  FastAPI 0.109+ · Python 3.9+ · LangChain · Sentry SDK          │
│  ─────────────────────────────────────────────────────────────   │
│  Routers: /upload · /chat · /documents · /history · /health    │
│  Middleware: RateLimit · RequestID · APIKey · CSP               │
│  Ports: 8000                                                    │
└─────────────────────────────────────────────────────────────────┘
```

### RAG Pipeline

```
 PDF Upload ──▶ Magic Byte Validation ──▶ PyPDF Extraction
                                            │
                                            ▼
                                     Recursive Chunking
                                       (800 / 400 overlap)
                                            │
                                            ▼
                                    Gecko Embeddings (001)
                                            │
                                            ▼
                              ┌───────────────────────────┐
                              │   Per-doc FAISS Shards    │
                              │        (faiss_shards/)    │
                              └───────────┬───────────────┘
                                          │ merge on new upload
                                          ▼
                               ┌──────────────────────┐
                               │  Unified FAISS Index  │
                               │     (faiss_index/)     │
                               └───────────┬──────────┘
                                           │
                   User Query ─────────────►│
                                           ▼
                               ┌──────────────────────┐
                               │  Top-K Similarity    │
                               │     Search (k=7)     │
                               └───────────┬──────────┘
                                           │
                                           ▼
                               ┌──────────────────────┐
                               │  Prompt Construction │
                               │  (context + query)   │
                               └───────────┬──────────┘
                                           │
                                           ▼
                               ┌──────────────────────┐
                               │  Gemini Flash LLM    │
                               │  (streaming via SSE) │
                               └──────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend Framework** | React | 19.2 |
| **Build Tool** | Vite | 7.2 |
| **Language** | TypeScript | 5.9 |
| **Styling** | Tailwind CSS | 4.1 |
| **Animations** | Framer Motion | 12.26 |
| **State/Data** | TanStack Query | 5.90 |
| **Markdown** | react-markdown | 10.1 |
| **Error Tracking** | @sentry/react | 10.45 |
| **Testing** | Vitest | 4.0 |
| **Backend Framework** | FastAPI | 0.109 |
| **AI/ML** | LangChain + langchain-google-genai | 0.1 / 0.0.6 |
| **Vector Store** | FAISS (CPU) | 1.7.4 |
| **PDF Processing** | PyPDF | 3.17 |
| **Database** | aiosqlite (async SQLite) | 0.19 |
| **Validation** | Pydantic | 2.5 |
| **Logging** | structlog | 24.0 |
| **Observability** | sentry-sdk | 1.0 |

---

## Project Structure

```
RAG-Chatbot/
│
├── backend/                          # FastAPI Backend
│   ├── main.py                       # App entry, lifespan, middleware
│   ├── config.py                     # Pydantic Settings (all config)
│   ├── models.py                     # Request/response Pydantic models
│   ├── database.py                   # Async SQLite (messages, docs)
│   ├── state.py                      # AppState (vector store, sessions)
│   ├── cache.py                      # In-memory caching utilities
│   ├── ingestion.py                  # PDF → chunks pipeline
│   ├── rag.py                        # Retrieval + generation chain
│   ├── vector_store.py               # FAISS abstraction layer
│   ├── middleware.py                 # RateLimit, RequestID, APIKey, CSP
│   ├── logging_config.py             # structlog setup
│   ├── requirements.txt              # Python dependencies
│   ├── Dockerfile
│   ├── routers/                      # API route handlers
│   │   ├── chat.py                   # POST /chat · GET /history
│   │   │                             # POST /clear_chat · POST /reset
│   │   ├── upload.py                 # POST /upload
│   │   └── documents.py              # GET /documents · DELETE /documents/{id}
│   ├── tests/                        # pytest suite
│   ├── temp/                         # Temporary PDF storage
│   ├── faiss_index/                  # Unified FAISS index (generated)
│   ├── faiss_shards/                 # Per-document FAISS shards
│   └── chat_history.db               # SQLite database (generated)
│
├── frontend/                         # React Frontend
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx                  # Entry point (Sentry init → App)
│   │   ├── instrument.ts             # Sentry frontend setup
│   │   ├── App.tsx                   # Root component + providers
│   │   ├── index.css                 # Tailwind + global styles
│   │   ├── components/
│   │   │   ├── Header.tsx            # Nav: upload, docs, theme
│   │   │   ├── ChatArea.tsx          # Message list container
│   │   │   ├── ChatInput.tsx         # Message input + send
│   │   │   ├── ChatMessage.tsx       # Individual message bubble
│   │   │   ├── SplashScreen.tsx       # Startup animation
│   │   │   ├── ErrorBoundary.tsx     # Sentry ErrorBoundary wrapper
│   │   │   ├── MarkdownComponents.tsx # Markdown render config
│   │   │   ├── Skeleton.tsx           # Loading placeholder
│   │   │   └── index.ts               # Component exports
│   │   ├── hooks/
│   │   │   ├── useChat.ts            # Chat orchestration
│   │   │   ├── useSseStream.ts        # SSE streaming + AbortController
│   │   │   ├── useChatMessages.ts    # Message state management
│   │   │   ├── useDocumentState.ts   # Upload/document state
│   │   │   ├── useApiQueries.ts      # TanStack Query hooks
│   │   │   └── useKeyboardShortcuts.ts
│   │   ├── services/
│   │   │   └── api.ts                # All backend API calls
│   │   ├── context/
│   │   │   ├── ChatContext.tsx       # Chat state provider
│   │   │   └── ThemeContext.tsx      # Theme provider
│   │   ├── types/
│   │   │   └── api.ts                # TypeScript interfaces
│   │   ├── mocks/                    # MSW mocks for testing
│   │   └── test/                     # Test utilities
│   └── public/
│       └── chatbot.png               # Logo
│
├── demo/                             # Screenshots
├── docs/                             # Architecture Decision Records
├── scripts/                          # Utility scripts
├── .env.example                      # Environment template
├── docker-compose.yml                # Docker orchestration
├── model_capabilities.yaml           # Model selection guide
├── LICENSE                           # MIT License
├── README.md                         # This file
├── CONTRIBUTING.md                  # Contribution guidelines
└── PROJECT_RULES.md                  # Project conventions
```

---

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_API_KEY` | **Yes** | — | Google AI API key ([get one free](https://aistudio.google.com/app/apikey)) |
| `ALLOWED_ORIGINS` | No | `http://localhost:5173` | CORS origins (comma-separated) |
| `REQUIRE_AUTH` | No | `false` | Enable API key authentication |
| `API_KEYS` | No | — | Comma-separated API keys (when `REQUIRE_AUTH=true`) |
| `SENTRY_DSN_BACKEND` | No | — | Sentry DSN for backend error tracking |
| `VITE_SENTRY_DSN_FRONTEND` | No | — | Sentry DSN for frontend error tracking |
| `VITE_API_URL` | No | `http://localhost:8000` | Backend API URL for frontend |

### Tuning Parameters

In `backend/config.py`:

```python
# Document Processing
CHUNK_SIZE = 800              # Characters per chunk
CHUNK_OVERLAP = 400           # Overlap between chunks

# Retrieval
RETRIEVER_K = 7               # Number of chunks to retrieve

# Models
EMBEDDING_MODEL = "models/text-embedding-004"   # Google Gecko
LLM_MODEL = "gemini-flash-latest"              # Google Gemini Flash
```

---

## API Reference

Interactive docs: **[http://localhost:8000/docs](http://localhost:8000/docs)**

### Upload & Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/upload` | Upload PDF, validate, chunk, and index |
| `GET` | `/documents` | List all uploaded documents |
| `DELETE` | `/documents/{doc_id}` | Delete a document and its FAISS shard |
| `GET` | `/status` | Current indexing status and document count |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat` | Stream a chat response via SSE |
| `GET` | `/history` | Retrieve paginated chat history |
| `POST` | `/clear_chat` | Clear chat history, keep documents |
| `POST` | `/reset` | Full reset: clear history + rebuild index |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check with dependency probes (FAISS, SQLite, Gemini) |

---

## Testing

### Backend

```bash
cd backend
pytest -v                          # Run all tests
pytest tests/test_ingestion.py -v  # Test specific module
pytest --cov=.                     # With coverage report
```

### Frontend

```bash
cd frontend
npm test                           # Run tests
npm run test:coverage              # With coverage
npm run lint                       # Lint code
npm run build                      # Production build
```

---

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|---------|
| `ValidationError: GOOGLE_API_KEY field required` | Missing API key | Add `GOOGLE_API_KEY=your_key` to `.env` |
| `Failed to fetch` | Backend not running | Ensure `python main.py` is running on port 8000 |
| `Invalid file type` | Not a valid PDF | Ensure file is a real PDF (magic bytes checked) |
| `File too large` | Exceeds 50MB | Reduce PDF size or split into smaller files |
| Docker: `service unhealthy` | Missing API key | Verify `GOOGLE_API_KEY` is set in `.env` |
| `CORS error` | Origin mismatch | Set `ALLOWED_ORIGINS` to include your frontend URL |

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on code style, commit format, and pull request process.

Quick links:
- [Open an issue](https://github.com/yugam23/RAG-Chatbot/issues) for bugs or features
- [Start a discussion](https://github.com/yugam23/RAG-Chatbot/discussions) for questions

---

## Roadmap

Interested in what's next? Check out our [GitHub Issues](https://github.com/yugam23/RAG-Chatbot/issues) for planned features and known bugs.

---

<div align="center">

**MIT License** · Built by [Yugam](https://github.com/yugam23)

[Back to Top](#rag-chatbot)

</div>
