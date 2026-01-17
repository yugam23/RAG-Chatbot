"""
Configuration Module
All application constants and settings in one place
Single source of truth for all config values.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file FIRST (use explicit path)
_env_path = Path(__file__).parent / ".env"
load_dotenv(_env_path)

# Base paths
BASE_DIR = Path(__file__).parent
TEMP_DIR = BASE_DIR / "temp"
VECTOR_STORE_PATH = BASE_DIR / "faiss_index"
DB_PATH = BASE_DIR / "chat_history.db"

# API Keys (from environment)
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# CORS Settings
# In production, set ALLOWED_ORIGINS env var to comma-separated list of origins
_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174")
ALLOWED_ORIGINS = [origin.strip() for origin in _origins_str.split(",")]

# Vector Store Settings
EMBEDDING_MODEL = "models/text-embedding-004"
LLM_MODEL = "gemini-flash-latest"  # Verified working model via debug script
LLM_TEMPERATURE = 0

# Chunking Settings
CHUNK_SIZE = 800
CHUNK_OVERLAP = 400

# Retrieval Settings
RETRIEVER_K = 7  # Number of documents to retrieve

# Ingestion Settings
INGESTION_BATCH_SIZE = 10
INGESTION_MAX_RETRIES = 5
INGESTION_BASE_DELAY = 2  # seconds

# Chat Settings
CHAT_MAX_RETRIES = 3

# Security Settings
MAX_FILE_SIZE_MB = 50  # Maximum upload file size in megabytes
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
RATE_LIMIT_UPLOADS = 10  # Max uploads per minute per IP
RATE_LIMIT_CHAT = 30  # Max chat requests per minute per IP
PDF_MAGIC_BYTES = b"%PDF"  # First 4 bytes of a valid PDF file


def validate_config():
    """Raise error if required config is missing"""
    if not GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY environment variable is required")


# Validate on import - fail fast if config is invalid
validate_config()
