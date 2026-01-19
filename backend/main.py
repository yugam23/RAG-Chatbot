"""
RAG Chatbot API - Main Application
FastAPI server for document Q&A using Retrieval Augmented Generation
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import shutil

from config import ALLOWED_ORIGINS, DB_PATH, VECTOR_STORE_PATH
from state import app_state
from database import init_db
from middleware import RateLimitMiddleware, RequestIDMiddleware, RequestSizeLimitMiddleware, APIKeyMiddleware
from logging_config import get_logger

# Import Routers
from routers import chat, upload

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

    # Reset application state
    await app_state.clear()
    
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
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check (Keep in main)
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "2.3.0"}

# Include Routers
app.include_router(upload.router)
app.include_router(chat.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
