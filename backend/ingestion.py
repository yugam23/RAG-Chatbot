"""
PDF Ingestion Module
Handles document loading, chunking, and vector store creation
"""

import time

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings

# Import ALL config from centralized module
from config import (
    VECTOR_STORE_PATH,
    EMBEDDING_MODEL,
    CHUNK_SIZE,
    CHUNK_OVERLAP,
    INGESTION_BATCH_SIZE,
    INGESTION_MAX_RETRIES,
    INGESTION_BASE_DELAY,
    GOOGLE_API_KEY,
)

# Import structured logging
from logging_config import get_logger

logger = get_logger(__name__)


def ingest_pdf(file_path: str) -> int:
    """
    Ingest a PDF file into the vector store.
    
    Args:
        file_path: Path to the PDF file
        
    Returns:
        Number of chunks created
    """
    # 1. Load PDF
    loader = PyPDFLoader(file_path)
    documents = loader.load()

    # 2. Split into chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP
    )
    chunks = text_splitter.split_documents(documents)

    # 3. Create embeddings
    embeddings = GoogleGenerativeAIEmbeddings(
        model=EMBEDDING_MODEL,
        google_api_key=GOOGLE_API_KEY
    )
    
    # 4. Batch process with retry logic
    vectorstore = None
    
    for i in range(0, len(chunks), INGESTION_BATCH_SIZE):
        batch = chunks[i:i + INGESTION_BATCH_SIZE]
        
        for attempt in range(INGESTION_MAX_RETRIES):
            try:
                if vectorstore is None:
                    vectorstore = FAISS.from_documents(batch, embeddings)
                else:
                    vectorstore.add_documents(batch)
                break  # Success
                
            except Exception as e:
                if _is_rate_limit_error(e):
                    if attempt == INGESTION_MAX_RETRIES - 1:
                        raise  # Give up after max retries
                    
                    delay = INGESTION_BASE_DELAY * (2 ** attempt)
                    logger.warning("ingestion_rate_limit", attempt=attempt + 1, delay=delay, batch=i // INGESTION_BATCH_SIZE + 1)
                    time.sleep(delay)
                else:
                    raise  # Other error, fail immediately

    # 5. Save to disk
    vectorstore.save_local(str(VECTOR_STORE_PATH))
    
    return len(chunks)


def _is_rate_limit_error(error: Exception) -> bool:
    """Check if an error is a rate limit error"""
    error_str = str(error)
    return any(indicator in error_str for indicator in [
        "429",
        "RESOURCE_EXHAUSTED",
        "Too Many Requests"
    ])
