from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.concurrency import run_in_threadpool
import os
import shutil

from config import TEMP_DIR, MAX_FILE_SIZE_MB, settings, PDF_MAGIC_BYTES
from state import app_state
from models import UploadResponse
from ingestion import ingest_pdf
from cache import DocumentCache
from logging_config import logger

router = APIRouter()

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
    if len(content) > (settings.MAX_FILE_SIZE_MB * 1024 * 1024):
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

@router.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """Upload and index a PDF document"""
    # Read file content for validation
    content = await file.read()
    
    # Validate file (size, extension, magic bytes)
    validate_pdf_file(content, file.filename)
    
    # Compute content hash for caching (Tier 4)
    content_hash = DocumentCache.get_content_hash(content)
    logger.debug("upload_hash_computed", hash=content_hash, filename=file.filename)
    
    # Create temp directory if not exists
    TEMP_DIR.mkdir(exist_ok=True)
    
    file_path = TEMP_DIR / file.filename
    
    # Save validated file locally
    with open(file_path, "wb") as f:
        f.write(content)
    
    try:
        result = await run_in_threadpool(ingest_pdf, str(file_path), content_hash)
        
        # Update application state
        await app_state.set_document(file.filename)
        
        # Prepare response with cache info
        status = "Loaded from Cache" if result.get("cache_hit") else "Uploaded & Indexed"
        chunks = result.get("chunks", 0)
        
        # Log cache status
        if result.get("cache_hit"):
            logger.info("upload_cached", filename=file.filename, hash=content_hash)
        
        return UploadResponse(
            filename=file.filename,
            status=status,
            chunks=chunks if chunks != -1 else 0  # Don't return -1 to frontend
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
