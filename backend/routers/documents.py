from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
import shutil

from config import SHARD_DIR
from database import get_all_documents, get_document, delete_document_record, get_all_doc_ids
from vector_store import vector_store
from logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter()


@router.get("/documents")
async def list_documents():
    """List all uploaded documents with chunk counts."""
    docs = await get_all_documents()
    return docs  # Returns list of dicts: [{doc_id, filename, chunk_count, created_at}, ...]


@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document and rebuild the FAISS index from remaining documents."""
    # 1. Verify document exists
    doc = await get_document(doc_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")

    # 2. Delete from SQLite
    await delete_document_record(doc_id)

    # 3. Delete shard files from disk
    shard_path = SHARD_DIR / doc_id
    if shard_path.exists():
        shutil.rmtree(shard_path)
        logger.info("shard_deleted", doc_id=doc_id)

    # 4. Get remaining doc IDs for rebuild
    remaining_ids = await get_all_doc_ids()

    # 5. Rebuild unified index from surviving shards (runs in threadpool)
    await run_in_threadpool(vector_store.rebuild_from_shards, remaining_ids)
    logger.info("index_rebuilt", remaining_docs=len(remaining_ids), deleted_doc_id=doc_id)

    return {"status": "deleted", "doc_id": doc_id}
