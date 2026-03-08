"""
Vector Store Abstraction Layer
Enables swapping FAISS for Pinecone/Qdrant without code changes
"""

import threading
from abc import ABC, abstractmethod
from pathlib import Path
from typing import List, Optional
import shutil

from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from config import VECTOR_STORE_PATH, EMBEDDING_MODEL, GOOGLE_API_KEY, RETRIEVER_K, SHARD_DIR
from logging_config import get_logger

logger = get_logger(__name__)

# Module-level write lock — guards all FAISS index mutation paths (merge, rebuild, clear)
_faiss_write_lock = threading.Lock()


class VectorStoreInterface(ABC):
    """Abstract interface for vector stores - enables provider swapping"""

    @abstractmethod
    def add_documents(self, documents: List[Document]) -> int:
        """Add documents to the store. Returns count added."""
        pass

    @abstractmethod
    def similarity_search(self, query: str, k: int = 5) -> List[Document]:
        """Search for similar documents."""
        pass

    @abstractmethod
    def save(self) -> None:
        """Persist the store to disk/cloud."""
        pass

    @abstractmethod
    def exists(self) -> bool:
        """Check if store has persisted data."""
        pass

    @abstractmethod
    def clear(self) -> None:
        """Delete all data from store."""
        pass


class FAISSVectorStore(VectorStoreInterface):
    """FAISS implementation of vector store interface"""

    def __init__(self, store_path: Path = VECTOR_STORE_PATH):
        self.store_path = store_path
        self._embeddings = GoogleGenerativeAIEmbeddings(
            model=EMBEDDING_MODEL,
            google_api_key=GOOGLE_API_KEY
        )
        self._vectorstore: Optional[FAISS] = None

    def add_documents(self, documents: List[Document]) -> int:
        """Add documents to FAISS index"""
        if self._vectorstore is None:
            self._vectorstore = FAISS.from_documents(documents, self._embeddings)
        else:
            self._vectorstore.add_documents(documents)
        return len(documents)

    def similarity_search(self, query: str, k: int = RETRIEVER_K) -> List[Document]:
        """Search for similar documents in FAISS index"""
        if self._vectorstore is None:
            self._load()
        if self._vectorstore is None:
            raise FileNotFoundError("No documents indexed. Please upload a PDF first.")
        return self._vectorstore.similarity_search(query, k=k)

    def save(self) -> None:
        """Save FAISS index to disk"""
        if self._vectorstore is not None:
            self._vectorstore.save_local(str(self.store_path))
            logger.info("vector_store_saved", path=str(self.store_path))

    def exists(self) -> bool:
        """Check if FAISS index exists on disk"""
        return self.store_path.exists()

    def clear(self) -> None:
        """Delete FAISS index from memory and disk, including all shard directories"""
        with _faiss_write_lock:
            self._vectorstore = None
            if self.store_path.exists():
                shutil.rmtree(self.store_path)
                logger.info("vector_store_cleared")
            if SHARD_DIR.exists():
                shutil.rmtree(SHARD_DIR)
                logger.info("shard_dir_cleared", path=str(SHARD_DIR))

    def is_loaded(self) -> bool:
        """Check if FAISS index is loaded in memory (documents indexed)."""
        return self._vectorstore is not None

    def merge_shard(self, shard: FAISS) -> None:
        """Merge a per-document FAISS shard into the unified index under lock.

        This is a sync method intended to be called via run_in_threadpool().
        Uses threading.Lock (not asyncio.Lock) because it runs in OS threads.
        """
        with _faiss_write_lock:
            if self._vectorstore is None:
                self._vectorstore = shard
            else:
                self._vectorstore.merge_from(shard)
            self._vectorstore.save_local(str(self.store_path))
            logger.info("shard_merged", store_path=str(self.store_path))

    def rebuild_from_shards(self, surviving_doc_ids: list[str]) -> None:
        """Reconstruct the unified index from surviving per-doc shard directories.

        This is a sync method intended to be called via run_in_threadpool().
        Uses threading.Lock (not asyncio.Lock) because it runs in OS threads.
        The entire operation (load + merge + save) is performed under lock to ensure
        atomicity.
        """
        with _faiss_write_lock:
            if not surviving_doc_ids:
                self._vectorstore = None
                if self.store_path.exists():
                    shutil.rmtree(self.store_path)
                logger.info("index_cleared", reason="no_surviving_docs")
                return

            merged: Optional[FAISS] = None
            for doc_id in surviving_doc_ids:
                shard = FAISS.load_local(
                    str(SHARD_DIR / doc_id),
                    self._embeddings,
                    allow_dangerous_deserialization=True,
                )
                if merged is None:
                    merged = shard
                else:
                    merged.merge_from(shard)

            self._vectorstore = merged
            assert merged is not None  # surviving_doc_ids is non-empty, so merged was set
            merged.save_local(str(self.store_path))
            logger.info("index_rebuilt", surviving_docs=len(surviving_doc_ids))

    def _load(self) -> None:
        """Load FAISS index from disk if it exists"""
        if self.store_path.exists():
            self._vectorstore = FAISS.load_local(
                str(self.store_path),
                self._embeddings,
                allow_dangerous_deserialization=True
            )
            logger.debug("vector_store_loaded", path=str(self.store_path))


# Singleton instance for application-wide use
vector_store = FAISSVectorStore()
