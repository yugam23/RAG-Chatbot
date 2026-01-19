"""
Document Caching Module (Tier 4)
Caches document embeddings by content hash to avoid re-processing identical PDFs.
"""

import hashlib
import shutil
from pathlib import Path
from typing import Optional

from logging_config import get_logger

logger = get_logger(__name__)


class DocumentCache:
    """
    Cache document embeddings by content hash.
    Significantly speeds up re-uploads of identical PDFs.
    """
    
    CACHE_DIR = Path("./cache/embeddings")
    
    @classmethod
    def get_content_hash(cls, content: bytes) -> str:
        """
        Generate SHA-256 hash of file content.
        
        Args:
            content: Raw file bytes
        
        Returns:
            First 16 characters of SHA-256 hash (sufficient for uniqueness)
        """
        return hashlib.sha256(content).hexdigest()[:16]
    
    @classmethod
    def has_cached_index(cls, content_hash: str) -> bool:
        """
        Check if embeddings exist for this content hash.
        
        Args:
            content_hash: Content hash from get_content_hash()
        
        Returns:
            True if cached index exists
        """
        cache_path = cls.CACHE_DIR / content_hash
        # FAISS index consists of .faiss and .pkl files
        faiss_file = cache_path / "index.faiss"
        pkl_file = cache_path / "index.pkl"
        exists = faiss_file.exists() and pkl_file.exists()
        
        if exists:
            logger.info("cache_check", hash=content_hash, result="hit")
        else:
            logger.debug("cache_check", hash=content_hash, result="miss")
        
        return exists
    
    @classmethod
    def get_cached_index_path(cls, content_hash: str) -> Path:
        """
        Get path to cached FAISS index.
        
        Args:
            content_hash: Content hash from get_content_hash()
        
        Returns:
            Path to cache directory for this hash
        """
        return cls.CACHE_DIR / content_hash
    
    @classmethod
    def cache_index(cls, content_hash: str, vectorstore, num_chunks: int) -> None:
        """
        Save FAISS index to cache.
        
        Args:
            content_hash: Content hash from get_content_hash()
            vectorstore: FAISS vector store instance
            num_chunks: Number of chunks in the document
        """
        cache_path = cls.CACHE_DIR / content_hash
        cache_path.mkdir(parents=True, exist_ok=True)
        
        try:
            vectorstore.save_local(str(cache_path))
            logger.info(
                "cache_saved",
                hash=content_hash,
                chunks=num_chunks,
                path=str(cache_path)
            )
        except Exception as e:
            logger.error("cache_save_failed", hash=content_hash, error=str(e))
            raise
    
    @classmethod
    def load_cached_index(cls, content_hash: str, embeddings) -> Optional[object]:
        """
        Load cached FAISS index.
        
        Args:
            content_hash: Content hash from get_content_hash()
            embeddings: Embeddings instance to load with
        
        Returns:
            Loaded FAISS vectorstore or None if load fails
        """
        from langchain_community.vectorstores import FAISS
        
        cache_path = cls.CACHE_DIR / content_hash
        
        try:
            vectorstore = FAISS.load_local(
                str(cache_path),
                embeddings,
                allow_dangerous_deserialization=True
            )
            logger.info("cache_loaded", hash=content_hash, path=str(cache_path))
            return vectorstore
        except Exception as e:
            logger.error("cache_load_failed", hash=content_hash, error=str(e))
            return None
    
    @classmethod
    def clear_cache(cls) -> None:
        """Delete all cached embeddings"""
        if cls.CACHE_DIR.exists():
            shutil.rmtree(cls.CACHE_DIR)
            logger.info("cache_cleared", path=str(cls.CACHE_DIR))
