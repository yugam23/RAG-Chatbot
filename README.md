<div align="center">

# 📚 RAG Chatbot

### *Your Documents. Your Questions. Instant AI-Powered Answers.*

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.9%2B-blue)](https://www.python.org/)
[![React](https://img.shields.io/badge/react-19.2-61dafb)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109%2B-009688)](https://fastapi.tiangolo.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC)](https://tailwindcss.com/)
[![LangChain](https://img.shields.io/badge/LangChain-Integration-orange)](https://langchain.com/)
[![Google Gemini](https://img.shields.io/badge/Google-Gemini-4285F4)](https://ai.google.dev/)

[Quick Start](#-quick-start) • [Features](#-features) • [Architecture](#-architecture) • [API Docs](#-api-reference)

---

</div>

## 🌟 What is RAG Chatbot?

**RAG Chatbot** is a cutting-edge **Retrieval-Augmented Generation (RAG)** application that transforms how you interact with your documents. Upload any PDF, and engage in intelligent, context-aware conversations powered by Google's Gemini AI.

Unlike traditional chatbots, RAG Chatbot **doesn't hallucinate** — it answers based *strictly* on the content of your uploaded documents, combining the power of semantic search with advanced language models.

### 🎯 Why RAG Chatbot?

- ✅ **100% Context-Grounded**: Answers derived exclusively from your documents
- ⚡ **Lightning Fast**: Optimized retrieval with FAISS vector database
- 🎨 **Premium UI/UX**: Glassmorphism design with smooth animations
- 🔒 **Privacy-First**: Process documents locally with no data persistence on restart

---

## 🚀 Quick Start

Get up and running in **3 minutes**!

### Prerequisites

- **Python 3.9+** — [Download](https://www.python.org/downloads/)
- **Node.js 18+** — [Download](https://nodejs.org/)
- **Google API Key** — [Get one here](https://aistudio.google.com/app/apikey)

### Installation

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yugam23/RAG-Chatbot.git
cd RAG-Chatbot
```

#### 2️⃣ Backend Setup

```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

**Configure Environment:**
Create a `.env` file in `backend/`:
```env
GOOGLE_API_KEY=your_actual_api_key_here
ALLOWED_ORIGINS=http://localhost:5173
```

**Run the Backend:**
```bash
python main.py
# 🚀 Server running at http://localhost:8000
```

#### 3️⃣ Frontend Setup

Open a **new terminal**:
```bash
cd frontend
npm install
npm run dev
# ✨ App running at http://localhost:5173
```

---

<details>
<summary><h2>✨ Key Features</h2></summary>

### 🧠 Intelligent Backend

| Feature | Description |
|---------|-------------|
| **🤖 Google Gemini Integration** | Powered by `gemini-flash-latest` for ultra-fast, accurate responses |
| **🔍 Advanced RAG Pipeline** | Semantic chunking (800 chars, 400 overlap) + Gecko embeddings |
| **💾 Vector Search** | FAISS CPU-optimized indexing with k=7 retrieval |
| **📑 Robust PDF Processing** | Magic byte validation, 50MB limit, secure temp storage |
| **💬 Session Management** | SQLite-based chat history with full persistence |
| **🔄 Auto-Reset** | Session and index auto-clear on server restart |

### 🎨 Premium Frontend

| Feature | Description |
|---------|-------------|
| **✨ Glassmorphism Design** | Modern blur effects, gradients, and depth |
| **🎬 Startup Animation** | Smooth logo intro with motion transitions |
| **💬 Real-Time Streaming** | Server-Sent Events (SSE) for live response rendering |
| **📝 Markdown Support** | Full syntax highlighting with `react-markdown` + `remark-gfm` |
| **📱 Fully Responsive** | Optimized for desktop, tablet, and mobile |
| **⚡ Optimized Caching** | TanStack Query for efficient data fetching |

</details>

<details>
<summary><h2>🏗️ Architecture</h2></summary>

RAG Chatbot follows a modern **client-server architecture**:

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│  React + Vite + Tailwind CSS + Framer Motion + TanStack Query   │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/SSE
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        FASTAPI BACKEND                          │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐    │
│  │   Routers    │  │  Middleware  │  │   State Manager     │    │
│  │ /upload      │  │ - Rate Limit │  │ - Session State     │    │
│  │ /chat        │  │ - Request ID │  │ - Vector Store Ref  │    │
│  └──────────────┘  └──────────────┘  └─────────────────────┘    │
│                             │                                   │
│                             ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  RAG PIPELINE (LangChain)                │   │
│  │  ┌────────┐   ┌────────┐   ┌──────────┐   ┌──────────┐   │   │
│  │  │  PDF   │──▶│ Chunk  │──▶│  Embed   │──▶│  FAISS │   │   │
│  │  │ Loader │   │ (800)  │   │ (Gecko)  │   │  Index   │   │   │
│  │  └────────┘   └────────┘   └──────────┘   └──────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 🔄 RAG Pipeline Workflow

1. **📤 Document Ingestion**: PDF Upload → Magic Byte Validation → Text Extraction → Recursive Chunking (800/400).
2. **🧮 Embedding & Indexing**: Google Gecko Embeddings → FAISS Vector Store.
3. **💬 Query Processing**: User Query → Embedding → Similarity Search (Top-k) → Prompt Construction.
4. **🤖 Response Generation**: Context + Query → Gemini Flash → Streaming Response.

</details>

<details>
<summary><h2>📂 Project Structure</h2></summary>

```
RAG-Chatbot/
├── 📁 backend/                     # FastAPI Python Backend
│   ├── 📁 routers/                 # API Route Handlers
│   │   ├── upload.py               # PDF upload & indexing endpoint
│   │   └── chat.py                 # Chat streaming & history endpoints
│   ├── 📁 tests/                   # Pytest Test Suite
│   ├── 📁 temp/                    # Temporary PDF storage
│   ├── 📁 faiss_index/             # Vector database (generated)
│   ├── config.py                   # Centralized configuration
│   ├── database.py                 # SQLite async operations
│   ├── ingestion.py                # Document processing pipeline
│   ├── rag.py                      # RAG chain implementation
│   ├── state.py                    # Application state management
│   ├── vector_store.py             # Vector store logic
│   ├── middleware.py               # Rate limiting & request tracking
│   ├── logging_config.py           # Structured logging setup
│   ├── models.py                   # Pydantic models
│   ├── main.py                     # FastAPI app entry point
│   └── requirements.txt            # Python dependencies
│
├── 📁 frontend/                    # React + Vite Frontend
│   ├── 📁 src/
│   │   ├── 📁 components/          # React Components (Header, ChatArea, etc.)
│   │   ├── 📁 hooks/               # Custom React Hooks (useChat, useApiQueries)
│   │   ├── 📁 services/            # API Communication
│   │   ├── 📁 context/             # React Context Providers
│   │   ├── App.jsx                 # Main App component
│   │   ├── main.jsx                # React entry point
│   │   └── index.css               # Global styles & theme
│   ├── 📁 public/                  # Static Assets
│   └── vite.config.js              # Vite configuration
│
└── 📄 README.md                    # This file!
```

</details>

<details>
<summary><h2>⚙️ Configuration</h2></summary>

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_API_KEY` | ✅ Yes | — | Google AI API key for Gemini & Gecko |
| `ALLOWED_ORIGINS` | ❌ No | `http://localhost:5173` | Comma-separated CORS origins |

### Advanced Tuning (`backend/config.py`)

```python
# Document Processing
CHUNK_SIZE = 800              # Characters per chunk
CHUNK_OVERLAP = 400           # Overlap between chunks

# Retrieval
RETRIEVER_K = 7               # Number of chunks to retrieve

# Models
EMBEDDING_MODEL = "models/text-embedding-004"
LLM_MODEL = "gemini-flash-latest"
```

</details>

<details>
<summary><h2>📡 API Reference</h2></summary>

Full interactive documentation available at **[http://localhost:8000/docs](http://localhost:8000/docs)**.

### Core Endpoints

- **`POST /upload`**: Upload and index a PDF. Validates magic bytes and size.
- **`POST /chat`**: Stream chat response via SSE. Requires active session.
- **`GET /history`**: Retrieve stored chat history.
- **`POST /clear-chat`**: Clear history but keep document index.
- **`POST /reset`**: Full session reset (wipes history + index).

</details>

<details>
<summary><h2>🧪 Testing & Troubleshooting</h2></summary>

### Running Tests

```bash
cd backend
pytest -v          # Run all tests
pytest tests/test_ingestion.py  # Test specific module
```

### Common Issues

- **`ValidationError: GOOGLE_API_KEY field required`**: Add your API key to `backend/.env`.
- **`Failed to fetch`**: Ensure backend is running on port 8000.
- **`Invalid file type`**: Ensure the file is a valid PDF.

</details>

<details>
<summary><h2>🤝 Contributing</h2></summary>

Contributions are **highly welcome**!

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m "Add source citation feature"`)
4. **Push** to your branch
5. **Open** a Pull Request

</details>

---

<div align="center">

**Made with ❤️ by [Yugam](https://github.com/yugam23)**

[⬆ Back to Top](#-rag-chatbot)

</div>
