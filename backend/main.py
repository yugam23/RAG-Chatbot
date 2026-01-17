"""
RAG Chatbot API - Main Application
FastAPI server for document Q&A using Retrieval Augmented Generation
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
import os
import shutil
import json

# Import centralized config (validates on import)
from config import (
    ALLOWED_ORIGINS, 
    TEMP_DIR, 
    MAX_FILE_SIZE_BYTES,
    PDF_MAGIC_BYTES,
)

# Import centralized state management
from state import app_state

# Import Pydantic models for type safety
from models import ChatRequest, UploadResponse, StatusResponse, ResetResponse

# Import database functions
from database import init_db, add_message, get_history, clear_messages

# Import security middleware
from middleware import RateLimitMiddleware, RequestIDMiddleware

# Import structured logging
from logging_config import get_logger, bind_request_context

logger = get_logger(__name__)


# Lifecycle Manager (Startup & Shutdown)
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    # Startup: Clear previous data
    logger.info("startup_cleanup_started", message="Cleaning up old session data")
    
    from config import DB_PATH, VECTOR_STORE_PATH
    
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
app.add_middleware(RateLimitMiddleware)  # Rate limit uploads and chat

# CORS Middleware - Uses ALLOWED_ORIGINS from config
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def validate_pdf_file(content: bytes, filename: str) -> None:
    """
    Validate that the uploaded file is a valid PDF.
    
    Args:
        content: File content bytes
        filename: Original filename
        
    Raises:
        HTTPException: If validation fails
    """
    # Check file size
    if len(content) > MAX_FILE_SIZE_BYTES:
        from config import MAX_FILE_SIZE_MB
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE_MB}MB."
        )
    
    # Check file extension
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only PDF files are accepted."
        )
    
    # Check PDF magic bytes (file signature)
    if not content.startswith(PDF_MAGIC_BYTES):
        raise HTTPException(
            status_code=400,
            detail="Invalid PDF file. The file does not appear to be a valid PDF."
        )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "2.2.0"}


@app.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """Upload and index a PDF document"""
    # Read file content for validation
    content = await file.read()
    
    # Validate file (size, extension, magic bytes)
    validate_pdf_file(content, file.filename)
    
    # Create temp directory if not exists
    TEMP_DIR.mkdir(exist_ok=True)
    
    file_path = TEMP_DIR / file.filename
    
    # Save validated file locally
    with open(file_path, "wb") as f:
        f.write(content)
    
    try:
        from ingestion import ingest_pdf
        num_chunks = ingest_pdf(str(file_path))
        
        # Update application state
        await app_state.set_document(file.filename)
        
        return UploadResponse(
            filename=file.filename,
            status="Uploaded & Indexed",
            chunks=num_chunks
        )
    except ValueError as e:
        # Known validation errors
        raise HTTPException(status_code=400, detail=str(e))
    except IOError as e:
        # File system errors
        raise HTTPException(status_code=500, detail=f"File processing error: {str(e)}")
    except Exception as e:
        # Unexpected errors - log full traceback
        logger.exception("upload_error", error=str(e), filename=file.filename)
        raise HTTPException(status_code=500, detail="An unexpected error occurred during upload.")
    finally:
        # Cleanup temp file
        if file_path.exists():
            os.remove(file_path)


@app.post("/reset", response_model=ResetResponse)
async def reset_session():
    """Reset the entire session (document + chat)"""
    from config import DB_PATH, VECTOR_STORE_PATH
    
    # Delete FAISS Index
    if VECTOR_STORE_PATH.exists():
        shutil.rmtree(VECTOR_STORE_PATH)
    
    # Delete Chat History DB
    if DB_PATH.exists():
        os.remove(DB_PATH)
        
    # Re-initialize DB
    await init_db()
    
    # Reset application state
    await app_state.clear()
    
    return ResetResponse(status="Session Reset")


@app.post("/clear_chat", response_model=ResetResponse)
async def clear_chat_history():
    """Clear only chat history, keep document"""
    await clear_messages()
    return ResetResponse(status="Chat History Cleared")


@app.get("/status", response_model=StatusResponse)
async def get_status():
    """Get current document status"""
    filename = await app_state.get_document()
    return StatusResponse(filename=filename)


@app.get("/history")
async def get_chat_history():
    """Get all chat messages"""
    return await get_history()


@app.post("/chat")
async def chat(request: ChatRequest):
    """Stream chat response for a question"""
    from rag import generate_chat_response
    
    # Save User Question
    await add_message("user", request.question)
    
    async def event_generator():
        full_answer = ""
        async for event in generate_chat_response(request.question):
            # Parse event to extract text for history
            try:
                data = json.loads(event.strip())
                if data["type"] == "token":
                    full_answer += data["data"]
            except (json.JSONDecodeError, KeyError):
                pass
            yield event
            
        # Save Assistant Answer
        if full_answer:
            await add_message("assistant", full_answer)

    return StreamingResponse(event_generator(), media_type="application/x-ndjson")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
