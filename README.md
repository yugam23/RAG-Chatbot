
# 📄 RAG Chatbot

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.9%2B-blue)
![React](https://img.shields.io/badge/react-19.0-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688)
![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38B2AC)
![LangChain](https://img.shields.io/badge/LangChain-Integration-orange)

**RAG Chatbot** is a state-of-the-art **Retrieval-Augmented Generation (RAG)** application that allows users to seamlessly upload PDF documents and engage in intelligent, context-aware conversations with them. 

Built with **FastAPI**, **LangChain**, and **Google Gemini** on the backend, and a stunning **React + various modern UI libraries** frontend, this project demonstrates the power of modern AI in a production-ready web application.

---

## 🚀 Features

### 🧠 Intelligent Backend
*   **Powered by Google Gemini**: Utilizes the latest `gemini-flash` models for lightning-fast and accurate responses.
*   **Advanced RAG Pipeline**: Implements efficient document chunking, embedding (Gecko), and vector retrieval using **FAISS**.
*   **Robust PDF Processing**: securely parses and validates PDF files (Magic Byte checks, size limits).
*   **Session Management**: Full chat persistence using **SQLite** with endpoints to clear history or reset sessions completely.
*   **Security First**: Built-in rate limiting, request tracing, and input validation.

### ✨ Premium Frontend
*   **Modern Aesthetics**: Glassmorphism design, smooth gradients, and motion effects using **Framer Motion**.
*   **Interactive UI**: Real-time streaming responses, markdown rendering, and auto-scrolling chat interface.
*   **Responsive**: Fully optimized for various screen sizes.
*   **User Experience**: Splash screen animation, intuitive file upload with status indicators, and clear error handling.

---

## 🛠️ Tech Stack

### Backend
*   **Framework**: FastAPI (Python)
*   **AI Orchestration**: LangChain
*   **LLM & Embeddings**: Google GenAI (Gemini)
*   **Vector Store**: FAISS (CPU)
*   **Database**: SQLite (via aiosqlite)
*   **Utilities**: Pydantic, PyPDF, Structlog

### Frontend
*   **Framework**: React 18+ (Vite)
*   **Styling**: Tailwind CSS 4
*   **Animations**: Framer Motion
*   **Icons**: Lucide React
*   **Markdown**: react-markdown

---

## 📦 Installation

Follow these steps to set up the project locally.

### Prerequisites
*   **Python 3.9+** installed.
*   **Node.js 18+** installed.
*   **Google API Key** with access to Gemini models.

### 1. Clone the Repository
```bash
git clone https://github.com/yugam23/RAG-Chatbot.git
cd RAG-Chatbot
```

### 2. Backend Setup
Navigate to the backend directory and set up the virtual environment.

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

**Configuration**:
Create a `.env` file in the `backend/` directory:
```env
# backend/.env
GOOGLE_API_KEY=your_actual_api_key_here
ALLOWED_ORIGINS=http://localhost:5173
```

Run the server:
```bash
python main.py
# Server starts at http://localhost:8000
```

### 3. Frontend Setup
Open a new terminal and navigate to the frontend directory.

```bash
cd frontend
npm install
```

Run the development server:
```bash
npm run dev
# App opens at http://localhost:5173
```

---

## 🎮 Usage Guide

1.  **Launch**: Open the application in your browser. You will be greeted by the startup animation.
2.  **Upload**: Click the "Upload PDF" button (paperclip icon) in the header to select a document.
3.  **Chat**: Once indexed, type your questions in the input bar. The AI will answer based *only* on the commands of your document.
4.  **Manage**:
    *   **New Chat**: Clears current history but keeps the document.
    *   **Reset**: Completely wipes the session and document.

---

## 📡 API Documentation

The backend provides auto-generated Swagger UI documentation. 

Once the backend is running, visit:
**[http://localhost:8000/docs](http://localhost:8000/docs)**

### Key Endpoints
*   `POST /upload`: Upload and index a PDF.
*   `POST /chat`: Stream a chat response.
*   `GET /history`: Retrieve chat session history.
*   `POST /reset`: Clear session data.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1.  Fork the project.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
