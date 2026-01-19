# ADR 003: React + FastAPI Full-Stack Architecture

## Status
Accepted

## Context
We needed to build a full-stack web application for document Q&A with:
- Modern, responsive UI
- Real-time streaming responses
- File upload capabilities
- State management

### Frontend Options Considered
1. **React** - Industry standard, massive ecosystem
2. **Vue.js** - Simpler learning curve
3. **Svelte** - Modern, compiles to vanilla JS
4. **Next.js** - React with SSR, but adds complexity

### Backend Options Considered
1. **FastAPI** - Modern Python, async, auto-docs
2. **Flask** - Simple but less async support
3. **Express.js** - JavaScript everywhere
4. **Django** - Full-featured but heavyweight

## Decision
Use **React 19** (with Vite) for frontend and **FastAPI** for backend.

## Rationale

### Why React?
1. **Ecosystem**: Largest library ecosystem (React Query, Framer Motion, etc.)
2. **Hiring**: Most widely known frontend framework
3. **Performance**: React 19 with concurrent features
4. **Tooling**: Excellent dev tools and debugging support

### Why FastAPI?
1. **async/await**: First-class async support for streaming and AI calls
2. **Type hints**: Pydantic models for validation and documentation
3. **Auto-docs**: OpenAPI/Swagger docs generated automatically
4. **Performance**: One of the fastest Python frameworks
5. **Python ecosystem**: Direct access to ML libraries (LangChain, FAISS)

### Why Vite over Create React App?
1. **Speed**: 10x faster dev server startup
2. **ESNext**: Native ES modules, no bundling during development
3. **HMR**: Instant hot module replacement
4. **Active development**: CRA is effectively deprecated

## Consequences

### Positive
- ✅ Clear separation of concerns (API vs UI)
- ✅ Independent scaling of frontend and backend
- ✅ Best-in-class tooling for both layers
- ✅ Strong typing on both ends (TypeScript optional, Pydantic)

### Negative
- ⚠️ Two different languages/ecosystems to maintain
- ⚠️ CORS configuration required
- ⚠️ Separate deployment for frontend and backend

## Project Structure
```
RAG Chatbot/
├── frontend/          # React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── context/
│   │   └── services/
│   └── package.json
└── backend/           # FastAPI
    ├── routers/
    ├── config.py
    ├── main.py
    └── requirements.txt
```

## Related
- [Backend main.py](../../backend/main.py)
- [Frontend App.jsx](../../frontend/src/App.jsx)
