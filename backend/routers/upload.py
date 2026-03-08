from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.concurrency import run_in_threadpool
import os
import shutil
import uuid

from config import TEMP_DIR, MAX_FILE_SIZE_MB, settings, PDF_MAGIC_BYTES, SHARD_DIR
from models import UploadResponse
from ingestion import ingest_pdf
from database import insert_document
from vector_store import vector_store
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

    # Generate unique document ID
    doc_id = str(uuid.uuid4())

    # Create temp directory if not exists
    TEMP_DIR.mkdir(exist_ok=True)

    file_path = TEMP_DIR / file.filename

    # Save validated file locally
    with open(file_path, "wb") as f:
        f.write(content)

    try:
        # Ingest PDF and get per-doc shard
        result = await run_in_threadpool(ingest_pdf, str(file_path), doc_id, file.filename)

        # Merge shard into unified FAISS index
        await run_in_threadpool(vector_store.merge_shard, result["shard"])

        # Register document in SQLite
        await insert_document(doc_id, file.filename, result["chunks"], str(SHARD_DIR / doc_id))

        return UploadResponse(
            filename=file.filename,
            status="Uploaded & Indexed",
            chunks=result["chunks"]
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
