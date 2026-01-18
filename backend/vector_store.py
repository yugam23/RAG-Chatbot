"""
Vector Store Abstraction Layer
Enables swapping FAISS for Pinecone/Qdrant without code changes
"""

from abc import ABC, abstractmethod
from pathlib import Path
from typing import List, Optional
import shutil

from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from config import VECTOR_STORE_PATH, EMBEDDING_MODEL, GOOGLE_API_KEY, RETRIEVER_K
from logging_config import get_logger

logger = get_logger(__name__)


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
        """Delete FAISS index from memory and disk"""
        self._vectorstore = None
        if self.store_path.exists():
            shutil.rmtree(self.store_path)
            logger.info("vector_store_cleared")
    
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
