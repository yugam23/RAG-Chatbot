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

[Quick Start](#-quick-start) • [Features](#-features) • [Architecture](#-architecture) • [API Docs](#-api-reference) • [Contributing](#-contributing)

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
- 🧠 **Smart Chunking**: Advanced document processing for optimal retrieval
- 🔄 **Real-Time Streaming**: Watch responses generate live, word by word

### 💡 Use Cases

- 📄 **Research**: Query academic papers, reports, and documentation
- 📚 **Education**: Interactive learning from textbooks and study materials
- 💼 **Business**: Analyze contracts, proposals, and technical documents
- 📖 **Personal**: Explore books, manuals, and guides conversationally

---

## ✨ Features

### 🧠 Intelligent Backend

| Feature | Description |
|---------|-------------|
| **🤖 Google Gemini Integration** | Powered by `gemini-flash-latest` for ultra-fast, accurate responses |
| **🔍 Advanced RAG Pipeline** | Semantic chunking (800 chars, 400 overlap) + Gecko embeddings |
| **💾 Vector Search** | FAISS CPU-optimized indexing with k=7 retrieval |
| **📑 Robust PDF Processing** | Magic byte validation, 50MB limit, secure temp storage |
| **💬 Session Management** | SQLite-based chat history with full persistence |
| **🔄 Auto-Reset** | Session and index auto-clear on server restart |
| **🛡️ Security** | Rate limiting (30 req/min chat, 10 req/min upload) + request tracing |
| **📊 Structured Logging** | Production-ready logging with `structlog` |
| **🧪 Tested** | Comprehensive pytest suite for ingestion, RAG, and API |

### 🎨 Premium Frontend

| Feature | Description |
|---------|-------------|
| **✨ Glassmorphism Design** | Modern blur effects, gradients, and depth |
| **🎬 Startup Animation** | Smooth logo intro with motion transitions |
| **💬 Real-Time Streaming** | Server-Sent Events (SSE) for live response rendering |
| **📝 Markdown Support** | Full syntax highlighting with `react-markdown` + `remark-gfm` |
| **📱 Fully Responsive** | Optimized for desktop, tablet, and mobile |
| **⚡ Optimized Caching** | TanStack Query for efficient data fetching |
| **🎯 Smart UX** | Auto-scroll, skeleton loaders, error boundaries |
| **🖼️ Custom Icons** | Lucide React icons with WebP-optimized assets |

### 🔐 Security & Performance

- **Rate Limiting**: Prevents API abuse with configurable limits
- **Request ID Tracing**: Every request tracked for debugging
- **Input Validation**: Pydantic models for type-safe APIs
- **CORS Protection**: Whitelist-based origin control
- **Exponential Backoff**: Retry logic for transient failures
- **Session Isolation**: Clean state on every restart

---

## 🏗️ Architecture

RAG Chatbot follows a modern **client-server architecture** with a sophisticated RAG pipeline:

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│  React + Vite + Tailwind CSS + Framer Motion + TanStack Query  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/SSE
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        FASTAPI BACKEND                          │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐    │
│  │   Routers    │  │  Middleware  │  │   State Manager     │    │
│  │ /upload      │  │ - Rate Limit │  │ - Session State     │    │
│  │ /chat        │  │ - Request ID │  │ - Vector Store Ref  │    │
│  │ /history     │  │ - CORS       │  │                     │    │
│  │ /reset       │  └──────────────┘  └─────────────────────┘    │
│  └──────────────┘                                               │
│                             │                                   │
│                             ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  RAG PIPELINE (LangChain)                │   │
│  │  ┌────────┐   ┌────────┐   ┌──────────┐   ┌──────────┐   │   │
│  │  │  PDF   │──▶│ Chunk  │──▶│  Embed   │──▶│  FAISS │   │   │
│  │  │ Loader │   │ (800)  │   │ (Gecko)  │   │  Index   │   │   │
│  │  └────────┘   └────────┘   └──────────┘   └──────────┘   │   │
│  │                                                 │        │   │
│  │  ┌────────────────────────────────────────────┐ │        │   │
│  │  │  Query  ──▶  Retrieve (k=7)  ──▶  Gemini  │ │        │   │
│  │  │                                    Flash   │◀┘       │   │
│  │  └────────────────────────────────────────────┘          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────┐                           ┌────────────────┐  │
│  │   SQLite     │                           │  Temp Storage  │  │
│  │ Chat History │                           │  (PDF Upload)  │  │
│  └──────────────┘                           └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 🔄 RAG Pipeline Workflow

1. **📤 Document Ingestion**
   - User uploads PDF → Validated (magic bytes, size)
   - PyPDF extracts text → Cleaned and normalized
   - RecursiveCharacterTextSplitter creates chunks (800/400)

2. **🧮 Embedding & Indexing**
   - Google Gecko (`text-embedding-004`) generates vectors
   - FAISS CPU index stores embeddings
   - Metadata preserved for source tracking

3. **💬 Query Processing**
   - User question → Embedded with same model
   - FAISS retrieves top 7 most relevant chunks
   - Context + question sent to Gemini Flash

4. **🤖 Response Generation**
   - Gemini generates grounded answer
   - Streamed back via SSE
   - Stored in SQLite chat history

### 🛠️ Technology Justifications

| Technology | Why? |
|------------|------|
| **Google Gemini Flash** | Sub-second latency, built-in streaming, cost-effective |
| **FAISS** | Industry-standard vector search, CPU-optimized, no external dependencies |
| **LangChain** | Abstracts RAG complexity, modular pipeline, extensive integrations |
| **FastAPI** | Native async support, auto-generated docs, Pydantic validation |
| **React + Vite** | Lightning-fast HMR, modern tooling, optimal bundle size |
| **TailwindCSS 4** | Zero-runtime, CSS-first approach, perfect for premium UIs |

---

## 🚀 Quick Start

Get up and running in **3 minutes**!

### Prerequisites

Ensure you have the following installed:

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

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Configure Environment:**

Create a `.env` file in `backend/`:

```env
# backend/.env
GOOGLE_API_KEY=your_actual_api_key_here
ALLOWED_ORIGINS=http://localhost:5173
```

**Run the Backend:**

```bash
python main.py
# 🚀 Server running at http://localhost:8000
# 📖 API Docs at http://localhost:8000/docs
```

#### 3️⃣ Frontend Setup

Open a **new terminal**:

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# ✨ App running at http://localhost:5173
```

### ✅ Verification

1. Open [http://localhost:5173](http://localhost:5173)
2. You should see the **splash screen animation**
3. Backend health check: [http://localhost:8000/health](http://localhost:8000/health)
4. API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📂 Project Structure

```
RAG-Chatbot/
├── 📁 backend/                     # FastAPI Python Backend
│   ├── 📁 routers/                 # API Route Handlers
│   │   ├── upload.py               # PDF upload & indexing endpoint
│   │   └── chat.py                 # Chat streaming & history endpoints
│   ├── 📁 tests/                   # Pytest Test Suite
│   │   ├── conftest.py             # Test fixtures & config
│   │   ├── test_api.py             # API integration tests
│   │   ├── test_ingestion.py       # PDF processing tests
│   │   └── test_rag.py             # RAG pipeline tests
│   ├── 📁 temp/                    # Temporary PDF storage
│   ├── 📁 faiss_index/             # Vector database (generated)
│   ├── config.py                   # Centralized configuration
│   ├── database.py                 # SQLite async operations
│   ├── ingestion.py                # Document processing pipeline
│   ├── rag.py                      # RAG chain implementation
│   ├── state.py                    # Application state management
│   ├── middleware.py               # Rate limiting & request tracking
│   ├── logging_config.py           # Structured logging setup
│   ├── models.py                   # Pydantic models
│   ├── main.py                     # FastAPI app entry point
│   ├── requirements.txt            # Python dependencies
│   ├── pytest.ini                  # Pytest configuration
│   ├── mypy.ini                    # Type checking config
│   └── chat_history.db             # SQLite database (generated)
│
├── 📁 frontend/                    # React + Vite Frontend
│   ├── 📁 src/
│   │   ├── 📁 components/          # React Components
│   │   │   ├── Header.jsx          # App header with upload/reset
│   │   │   ├── ChatArea.jsx        # Message display area
│   │   │   ├── ChatMessage.jsx     # Individual message component
│   │   │   ├── ChatInput.jsx       # User input with send button
│   │   │   ├── SplashScreen.jsx    # Startup animation
│   │   │   ├── Skeleton.jsx        # Loading placeholder
│   │   │   ├── ErrorBoundary.jsx   # Error handling wrapper
│   │   │   ├── MarkdownComponents.jsx  # Markdown renderers
│   │   │   └── index.js            # Component exports
│   │   ├── 📁 hooks/               # Custom React Hooks
│   │   │   ├── useChat.js          # Chat state & streaming logic
│   │   │   └── useApiQueries.js    # TanStack Query hooks
│   │   ├── 📁 services/            # API Communication
│   │   │   └── api.js              # HTTP client & endpoints
│   │   ├── 📁 context/             # React Context Providers
│   │   │   └── ChatContext.jsx     # Global chat state
│   │   ├── App.jsx                 # Main App component
│   │   ├── main.jsx                # React entry point
│   │   └── index.css               # Global styles & theme
│   ├── 📁 public/                  # Static Assets
│   │   ├── chatbot.png             # App logo (WebP)
│   │   ├── message.png             # Message icon
│   │   └── clear_chat.png          # Clear icon
│   ├── index.html                  # HTML template
│   ├── package.json                # Node dependencies
│   ├── vite.config.js              # Vite configuration
│   ├── tailwind.config.js          # Tailwind CSS config
│   ├── postcss.config.js           # PostCSS setup
│   └── eslint.config.js            # ESLint rules
│
├── 📄 README.md                    # This file!
├── 📄 LICENSE                      # MIT License
└── 📁 .git/                        # Git repository
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_API_KEY` | ✅ Yes | — | Google AI API key for Gemini & Gecko |
| `ALLOWED_ORIGINS` | ❌ No | `http://localhost:5173,http://localhost:5174` | Comma-separated CORS origins |

### Advanced Configuration

Edit `backend/config.py` to tune performance:

```python
# Document Processing
CHUNK_SIZE = 800              # Characters per chunk
CHUNK_OVERLAP = 400           # Overlap between chunks

# Retrieval
RETRIEVER_K = 7               # Number of chunks to retrieve

# Models
EMBEDDING_MODEL = "models/text-embedding-004"  # Gecko embeddings
LLM_MODEL = "gemini-flash-latest"              # Gemini model
LLM_TEMPERATURE = 0.0         # 0 = deterministic, 1 = creative

# Security
MAX_FILE_SIZE_MB = 50         # Maximum PDF size
RATE_LIMIT_UPLOADS = 10       # Uploads per minute
RATE_LIMIT_CHAT = 30          # Chat requests per minute

# Ingestion Retry Strategy
INGESTION_MAX_RETRIES = 5     # Embedding retry attempts
INGESTION_BASE_DELAY = 2      # Initial retry delay (seconds)
INGESTION_BATCH_SIZE = 10     # Chunks per batch
```

### Performance Tuning Tips

💡 **For Larger Documents:**
- Increase `CHUNK_SIZE` to 1000-1200
- Increase `RETRIEVER_K` to 10-12

⚡ **For Faster Responses:**
- Decrease `RETRIEVER_K` to 5
- Consider switching to `gemini-flash-thinking` for complex queries

🎯 **For More Accurate Answers:**
- Decrease `CHUNK_SIZE` to 600 (more granular chunks)
- Increase `CHUNK_OVERLAP` to 200 (better context preservation)

---

## 📡 API Reference

Full interactive documentation available at **[http://localhost:8000/docs](http://localhost:8000/docs)** when running.

### Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/upload` | Upload & index PDF |
| `POST` | `/chat` | Stream chat response |
| `GET` | `/history` | Retrieve chat history |
| `POST` | `/clear-chat` | Clear chat (keep document) |
| `POST` | `/reset` | Full session reset |

---

### `POST /upload`

Upload and index a PDF document.

**Request:**

```bash
curl -X POST http://localhost:8000/upload \
  -F "file=@document.pdf"
```

**Success Response (200):**

```json
{
  "message": "PDF uploaded and indexed successfully",
  "filename": "document.pdf",
  "chunks": 42,
  "upload_time": "2026-01-17T12:00:00Z"
}
```

**Error Response (400):**

```json
{
  "detail": "Invalid file type. Only PDF files are allowed."
}
```

**Validations:**
- ✅ File extension must be `.pdf`
- ✅ File must start with magic bytes `%PDF`
- ✅ File size ≤ 50MB
- ✅ Rate limited to 10 uploads/minute

---

### `POST /chat`

Stream a chat response based on uploaded document.

**Request:**

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the key findings?",
    "session_id": "optional-session-id"
  }'
```

**Response (Server-Sent Events):**

```
data: {"type": "token", "content": "The"}
data: {"type": "token", "content": " key"}
data: {"type": "token", "content": " findings"}
data: {"type": "token", "content": " are"}
data: {"type": "done"}
```

**Error Response (400):**

```json
{
  "detail": "No documents indexed. Please upload a PDF first."
}
```

**Notes:**
- Streams via SSE (Server-Sent Events)
- Rate limited to 30 requests/minute
- Automatically saves to chat history

---

### `GET /history`

Retrieve all chat messages for the current session.

**Request:**

```bash
curl http://localhost:8000/history
```

**Response (200):**

```json
{
  "messages": [
    {
      "id": 1,
      "role": "user",
      "content": "What are the key findings?",
      "timestamp": "2026-01-17T12:00:00Z"
    },
    {
      "id": 2,
      "role": "assistant",
      "content": "The key findings are...",
      "timestamp": "2026-01-17T12:00:05Z"
    }
  ]
}
```

---

### `POST /clear-chat`

Clear chat history while preserving the indexed document.

**Request:**

```bash
curl -X POST http://localhost:8000/clear-chat
```

**Response (200):**

```json
{
  "message": "Chat history cleared successfully"
}
```

---

### `POST /reset`

Complete session reset: clears chat history AND indexed documents.

**Request:**

```bash
curl -X POST http://localhost:8000/reset
```

**Response (200):**

```json
{
  "message": "Session reset successfully"
}
```

**Effect:**
- ❌ Deletes all chat messages
- ❌ Removes FAISS vector index
- ❌ Clears uploaded document reference
- ✅ Requires re-uploading a PDF before chatting again

---

## 🎮 Usage Guide

### Step-by-Step Walkthrough

#### 1. 🚀 Launch the Application

Open [http://localhost:5173](http://localhost:5173). You'll see the **animated splash screen** with the chatbot logo transitioning smoothly into position.

#### 2. 📤 Upload Your Document

- Click the **📎 Upload PDF** button in the top-right header
- Select a PDF file (max 50MB)
- Wait for the upload confirmation toast
- The filename will appear in the header

#### 3. 💬 Start Chatting

Once uploaded, the chat interface activates:

- Type your question in the input field at the bottom
- Press **Enter** or click the **Send** button
- Watch the AI response stream in real-time
- Markdown formatting is fully supported (code blocks, lists, tables, etc.)

#### 4. 🧹 Manage Your Session

**Clear Chat History** (keeps document):
- Click the **Clear Chat** button in the header
- Chat messages are wiped, but you can continue asking questions about the same document

**New Chat** (complete reset):
- Click the **New Chat** button
- Removes both chat history AND the indexed document
- You'll need to re-upload a PDF

### 💡 Pro Tips

- **Specific Questions**: The more specific your question, the better the answer
- **Sequential Queries**: Build on previous questions for deeper insights
- **Code/Tables**: The UI beautifully renders code blocks and markdown tables
- **Long Documents**: For 100+ page PDFs, consider asking about specific sections first

---

## 🧪 Testing

The backend includes a comprehensive pytest suite.

### Run All Tests

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_api.py

# Run with coverage report
pytest --cov=. --cov-report=html
```

### Test Coverage

| Module | Coverage |
|--------|----------|
| `ingestion.py` | PDF processing, chunking, embedding |
| `rag.py` | Retrieval chain, query processing |
| `routers/upload.py` | Upload endpoint, validation |
| `routers/chat.py` | Chat streaming, history |

### Running Frontend Linting

```bash
cd frontend

# Run ESLint
npm run lint

# Auto-fix issues
npm run lint -- --fix
```

---

## 🐛 Troubleshooting

### Common Issues & Solutions

#### ❌ Backend: `ValidationError: GOOGLE_API_KEY field required`

**Cause**: Missing or invalid `.env` file.

**Solution**:
```bash
cd backend
echo "GOOGLE_API_KEY=your_key_here" > .env
```

---

#### ❌ Frontend: `Failed to fetch` or CORS errors

**Cause**: Backend not running or CORS misconfiguration.

**Solution**:
1. Ensure backend is running: `http://localhost:8000/health` should return `{"status": "healthy"}`
2. Check `ALLOWED_ORIGINS` in `backend/.env` includes `http://localhost:5173`
3. Restart the backend after changing `.env`

---

#### ❌ Upload: `Invalid file type`

**Cause**: File doesn't have PDF magic bytes or has wrong extension.

**Solution**:
- Ensure file is a **valid PDF** (not a renamed document)
- Try opening the PDF in a viewer first to confirm it's not corrupted

---

#### ❌ Chat: `No documents indexed`

**Cause**: PDF failed to upload or session was reset.

**Solution**:
1. Check backend logs for upload errors
2. Re-upload the PDF
3. Verify `backend/faiss_index/` directory exists

---

#### ❌ Slow Responses

**Cause**: Large document or many chunks retrieved.

**Solution**:
- **Short-term**: Reduce `RETRIEVER_K` in `config.py` (e.g., from 7 to 5)
- **Long-term**: Consider chunking optimization (increase `CHUNK_SIZE`)

---

#### ❌ Rate Limit Exceeded

**Cause**: Too many requests in a short time.

**Solution**:
- Wait 60 seconds for the rate limit to reset
- Adjust `RATE_LIMIT_CHAT` or `RATE_LIMIT_UPLOADS` in `config.py` if needed

---

### Debug Mode

Enable detailed logging:

1. **Backend Logs**: Already enabled via `structlog` — check console output
2. **Frontend Errors**: Open browser DevTools (F12) → Console tab
3. **Network Issues**: DevTools → Network tab → check failed requests

---

## 🤝 Contributing

Contributions are **highly welcome**! This project follows standard open-source practices.

### How to Contribute

1. **Fork** the repository
2. **Create** a feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make** your changes with clear, descriptive commits:
   ```bash
   git commit -m "Add source citation feature"
   ```
4. **Push** to your branch:
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open** a Pull Request with a detailed description

### Development Guidelines

- ✅ Follow existing code style (use `black` for Python, `prettier` for JS)
- ✅ Add tests for new features
- ✅ Update documentation (README, docstrings)
- ✅ Ensure all tests pass before submitting PR
- ✅ Keep commits atomic and well-described

### Code of Conduct

Be respectful, inclusive, and constructive. We're all here to learn and build together!

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

This project is built on the shoulders of giants. Special thanks to:

- **[Google AI](https://ai.google.dev/)** — For the incredible Gemini and Gecko models
- **[LangChain](https://langchain.com/)** — For abstracting RAG complexity
- **[FastAPI](https://fastapi.tiangolo.com/)** — For the lightning-fast async framework
- **[React](https://reactjs.org/)** — For the powerful component model
- **[FAISS](https://github.com/facebookresearch/faiss)** — For efficient vector search
- **[TailwindCSS](https://tailwindcss.com/)** — For the utility-first styling paradigm

And to the amazing **open-source community** for continuous inspiration!

---

## ⭐ Show Your Support

If you found this project helpful, consider giving it a **⭐ star** on GitHub!

It helps others discover the project and motivates continued development.

---

<div align="center">

**Made with ❤️ by [Yugam](https://github.com/yugam23)**

[⬆ Back to Top](#-rag-chatbot)

</div>
