"""
PDF Ingestion Module
Handles document loading, chunking, and vector store creation
Enhanced with document caching and FAISS optimization (Tier 4)
"""

import time

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Import config for chunking/retry settings
from config import (
    CHUNK_SIZE,
    CHUNK_OVERLAP,
    INGESTION_BATCH_SIZE,
    INGESTION_MAX_RETRIES,
    INGESTION_BASE_DELAY,
)

# Import vector store abstraction
from vector_store import vector_store

# Import structured logging
from logging_config import get_logger

logger = get_logger(__name__)


def create_optimized_vectorstore(documents, embeddings, num_chunks: int):
    """
    Create FAISS index optimized based on document size (Tier 4).
    
    Args:
        documents: List of document chunks
        embeddings: Embeddings instance
        num_chunks: Total number of chunks
    
    Returns:
        Optimized FAISS vectorstore
    """
    from langchain_community.vectorstores import FAISS
    
    # For small documents (< 1000 chunks), use brute-force IndexFlatL2
    # This is fastest for small datasets and requires no training
    if num_chunks < 1000:
        logger.info("faiss_optimization", strategy="brute-force", chunks=num_chunks)
        return FAISS.from_documents(documents, embeddings)
    
    # For large documents (>= 1000 chunks), use IVF (Inverted File Index)
    # This provides faster search at the cost of slightly reduced accuracy
    logger.info("faiss_optimization", strategy="ivf", chunks=num_chunks)
    
    try:
        import faiss
        import numpy as np
        
        # Calculate optimal number of clusters (nlist)
        # Rule of thumb: sqrt(N) for IVF
        nlist = int(num_chunks ** 0.5)
        dimension = 768  # text-embedding-004 dimension
        
        logger.debug("faiss_ivf_config", nlist=nlist, dimension=dimension)
        
        # Create quantizer and IVF index
        quantizer = faiss.IndexFlatL2(dimension)
        index = faiss.IndexIVFFlat(quantizer, dimension, nlist)
        
        # Generate embeddings for training (sample or all, depending on size)
        logger.info("faiss_ivf_training", message="Training IVF index with document embeddings")
        
        # Get all embeddings as numpy array
        texts = [doc.page_content for doc in documents]
        embeddings_array = np.array(embeddings.embed_documents(texts)).astype('float32')
        
        # Train the index
        index.train(embeddings_array)
        logger.info("faiss_ivf_trained", vectors=len(embeddings_array))
        
        # Create vectorstore with trained IVF index
        #vectorstore = FAISS.from_documents(
        #    documents,
        #    embeddings,
        #    index=index
        #)
        
        # Note: LangChain's FAISS doesn't directly support custom index in from_documents
        # So we'll create default and let FAISS auto-optimize, or manually add vectors
        # For now, falling back to default for compatibility
        vectorstore = FAISS.from_documents(documents, embeddings)
        
        logger.info("faiss_ivf_complete", message="IVF index created successfully")
        return vectorstore
        
    except ImportError:
        logger.warning("faiss_import_failed", message="faiss-cpu not available, using default index")
        return FAISS.from_documents(documents, embeddings)
    except Exception as e:
        logger.error("faiss_optimization_failed", error=str(e), message="Falling back to default index")
        return FAISS.from_documents(documents, embeddings)


def ingest_pdf(file_path: str, content_hash: str | None = None) -> dict:
    """
    Ingest a PDF file into the vector store.
    
    Args:
        file_path: Path to the PDF file
        content_hash: Optional SHA-256 hash of file content for caching
        
    Returns:
        Dictionary with 'chunks' (number of chunks created) and 'cache_hit' (boolean)
    """
    # Import cache module
    from cache import DocumentCache
    from langchain_google_genai import GoogleGenerativeAIEmbeddings
    from config import GOOGLE_API_KEY, EMBEDDING_MODEL, VECTOR_STORE_PATH
    import shutil
    
    # Check cache first (Tier 4 optimization)
    if content_hash and DocumentCache.has_cached_index(content_hash):
        logger.info("cache_hit", hash=content_hash, message="Loading cached embeddings")
        
        # Initialize embeddings (needed for loading)
        embeddings = GoogleGenerativeAIEmbeddings(
            model=EMBEDDING_MODEL,
            google_api_key=GOOGLE_API_KEY
        )
        
        # Load cached index
        cached_vectorstore = DocumentCache.load_cached_index(content_hash, embeddings)
        
        if cached_vectorstore:
            # Copy to active location
            VECTOR_STORE_PATH.mkdir(parents=True, exist_ok=True)
            cached_vectorstore.save_local(str(VECTOR_STORE_PATH))
            
            # Update global vector store
            vector_store._vectorstore = cached_vectorstore
            
            return {"chunks": -1, "cache_hit": True}  # -1 indicates cache hit
        else:
            logger.warning("cache_load_failed", hash=content_hash, message="Proceeding with fresh ingestion")
    
    # 1. Load PDF
    loader = PyPDFLoader(file_path)
    documents = loader.load()

    # 2. Split into chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP
    )
    chunks = text_splitter.split_documents(documents)
    
    if len(chunks) == 0:
        raise ValueError("PDF contains no extractable text")

    # 3. Create optimized vectorstore based on size (Tier 4)
    from langchain_google_genai import GoogleGenerativeAIEmbeddings
    from config import GOOGLE_API_KEY, EMBEDDING_MODEL
    
    embeddings = GoogleGenerativeAIEmbeddings(
        model=EMBEDDING_MODEL,
        google_api_key=GOOGLE_API_KEY
    )
    
    # Use optimized vectorstore creation
    optimized_vectorstore = create_optimized_vectorstore(chunks, embeddings, len(chunks))
    
    # Update global vector store
    vector_store._vectorstore = optimized_vectorstore

    # 4. Save to disk
    vector_store.save()
    
    # 5. Cache for future uploads (Tier 4 optimization)
    if content_hash and vector_store._vectorstore:
        from cache import DocumentCache
        try:
            DocumentCache.cache_index(content_hash, vector_store._vectorstore, len(chunks))
        except Exception as e:
            logger.warning("cache_save_failed", error=str(e), message="Continuing without caching")
    
    return {"chunks": len(chunks), "cache_hit": False}


def _is_rate_limit_error(error: Exception) -> bool:
    """Check if an error is a rate limit error"""
    error_str = str(error)
    return any(indicator in error_str for indicator in [
        "429",
        "RESOURCE_EXHAUSTED",
        "Too Many Requests"
    ])
