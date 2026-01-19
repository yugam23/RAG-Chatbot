# Contributing to RAG Chatbot

Thank you for your interest in contributing! 🎉

This document provides guidelines for contributing to the RAG Chatbot project.

## 📋 Table of Contents

- [Development Setup](#development-setup)
- [Code Style](#code-style)
- [Pull Request Process](#pull-request-process)
- [Commit Message Format](#commit-message-format)
- [Project Structure](#project-structure)

---

## 🛠️ Development Setup

### Prerequisites
- Python 3.11+
- Node.js 20+
- Git

### Quick Start

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/RAG-Chatbot.git
   cd RAG-Chatbot
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your GOOGLE_API_KEY
   ```

3. **Start the backend**
   ```bash
   cd backend
   python -m venv venv
   .\venv\Scripts\activate  # Windows
   # source venv/bin/activate  # Linux/Mac
   pip install -r requirements.txt
   python main.py
   ```

4. **Start the frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Access the app**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

---

## 🎨 Code Style

### Python (Backend)

- **Formatter**: Use `black` for auto-formatting
  ```bash
  pip install black
  black .
  ```

- **Linter**: Use `ruff` for linting
  ```bash
  pip install ruff
  ruff check .
  ```

- **Type hints**: Required for all function signatures
  ```python
  def process_document(file_path: str, content_hash: str | None = None) -> dict:
      ...
  ```

- **Docstrings**: Required for public functions
  ```python
  def ingest_pdf(file_path: str) -> dict:
      """
      Ingest a PDF file into the vector store.
      
      Args:
          file_path: Path to the PDF file
          
      Returns:
          Dictionary with 'chunks' count and 'cache_hit' status
      """
  ```

### JavaScript/React (Frontend)

- **Formatter**: Use `prettier`
  ```bash
  npm run format
  ```

- **Linter**: Use `eslint`
  ```bash
  npm run lint
  ```

- **Components**: Use functional components with hooks
- **Prop types**: Use JSDoc comments for documentation

---

## 🔄 Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes**
   - Write code following the style guidelines
   - Add tests for new functionality
   - Update documentation if needed

3. **Test your changes**
   ```bash
   # Backend tests
   cd backend && pytest -v
   
   # Frontend tests (if available)
   cd frontend && npm test
   ```

4. **Commit with conventional format**
   ```bash
   git commit -m "feat: add amazing feature"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Wait for review**
   - Address any feedback from maintainers
   - Ensure CI passes

---

## 📝 Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

| Type | Description |
|------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `style:` | Formatting, no code change |
| `refactor:` | Code refactoring |
| `test:` | Adding or updating tests |
| `chore:` | Maintenance tasks |
| `perf:` | Performance improvements |

### Examples
```
feat: add dark/light theme toggle
fix: resolve localStorage quota exceeded error
docs: update README with installation steps
refactor: extract ThemeContext from App component
```

---

## 📁 Project Structure

```
RAG-Chatbot/
├── backend/                 # FastAPI backend
│   ├── routers/            # API route handlers
│   │   ├── chat.py        # Chat endpoints
│   │   └── upload.py      # Upload endpoints
│   ├── config.py          # Configuration settings
│   ├── database.py        # SQLite operations
│   ├── ingestion.py       # PDF processing
│   ├── rag.py             # RAG chain logic
│   ├── cache.py           # Document caching
│   ├── state.py           # App state management
│   ├── main.py            # FastAPI app entry
│   └── requirements.txt
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── context/       # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   └── services/      # API services
│   ├── package.json
│   └── vite.config.js
│
├── docs/                   # Documentation
│   └── decisions/         # Architecture Decision Records
│
├── .env.example           # Environment template
├── CHANGELOG.md           # Version history
├── CONTRIBUTING.md        # This file
└── README.md              # Project overview
```

---

## ❓ Questions?

- Open an [issue](https://github.com/yugam23/RAG-Chatbot/issues) for bugs or feature requests
- Start a [discussion](https://github.com/yugam23/RAG-Chatbot/discussions) for questions

Thank you for contributing! 🙏
