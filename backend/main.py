"""
RAG Chatbot API - Main Application
FastAPI server for document Q&A using Retrieval Augmented Generation
"""

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import shutil

from config import ALLOWED_ORIGINS, DB_PATH, VECTOR_STORE_PATH, SHARD_DIR, GOOGLE_API_KEY
from database import init_db
import aiosqlite
from middleware import RateLimitMiddleware, RequestIDMiddleware, RequestSizeLimitMiddleware, APIKeyMiddleware, CSPHeaderMiddleware
from vector_store import vector_store
from logging_config import get_logger

# Import Routers
from routers import chat, upload, documents

logger = get_logger(__name__)


# Lifecycle Manager (Startup & Shutdown)
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    # Startup: Clear previous data to ensure a fresh session.
    # This aligns with the "stateless" nature of this specific chatbot demo,
    # preventing old data from bleeding into new user sessions.
    logger.info("startup_cleanup_started", message="Cleaning up old session data")

    if DB_PATH.exists():
        os.remove(DB_PATH)
        logger.debug("deleted_file", file="chat_history.db")

    if VECTOR_STORE_PATH.exists():
        shutil.rmtree(VECTOR_STORE_PATH)
        logger.debug("deleted_directory", directory="faiss_index")

    if SHARD_DIR.exists():
        shutil.rmtree(SHARD_DIR)
        logger.debug("deleted_directory", directory="faiss_shards")

    # Initialize fresh DB
    await init_db()
    logger.info("startup_complete", message="New session initialized")

    yield
    # Shutdown logic
    logger.info("shutdown", message="Application shutting down")


app = FastAPI(title="RAG Chatbot API", lifespan=lifespan)

# Security Middleware (order matters: first added = outermost)
app.add_middleware(RequestIDMiddleware)  # Add request ID to all requests
app.add_middleware(APIKeyMiddleware)     # Optional API key auth
app.add_middleware(RateLimitMiddleware)  # Rate limit uploads and chat
app.add_middleware(RequestSizeLimitMiddleware)  # Block oversized requests

# CORS Middleware - Uses ALLOWED_ORIGINS from config
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.add_middleware(CSPHeaderMiddleware)

# Health Check (Keep in main)
@app.get("/health")
async def health_check(response: Response):
    """Health check with real dependency probes."""
    checks: dict[str, str] = {}

    # 1. FAISS: in-memory loaded state
    checks["faiss"] = "ok" if vector_store.is_loaded() else "degraded"

    # 2. SQLite: write test
    try:
        async with aiosqlite.connect(str(DB_PATH)) as db:
            await db.execute("SELECT 1")
        checks["sqlite"] = "ok"
    except Exception:
        checks["sqlite"] = "degraded"

    # 3. Gemini API: reachability via REST
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            r = await client.get(
                "https://generativelanguage.googleapis.com/v1beta/models",
                params={"key": GOOGLE_API_KEY},
                timeout=5.0,
            )
            checks["gemini"] = "ok" if r.status_code == 200 else "degraded"
    except Exception:
        checks["gemini"] = "degraded"

    overall = "ok" if all(v == "ok" for v in checks.values()) else "degraded"
    if overall == "degraded":
        response.status_code = 503

    return {"status": overall, "checks": checks}

# Include Routers
app.include_router(upload.router)
app.include_router(chat.router)
app.include_router(documents.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
