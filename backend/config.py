"""
Configuration Module
All application constants and settings in one place
Single source of truth for all config values.
"""

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, computed_field
from typing import List

class Settings(BaseSettings):
    # Base paths
    BASE_DIR: Path = Path(__file__).parent
    TEMP_DIR: Path = BASE_DIR / "temp"
    VECTOR_STORE_PATH: Path = BASE_DIR / "faiss_index"
    DB_PATH: Path = BASE_DIR / "chat_history.db"

    # API Keys
    GOOGLE_API_KEY: str = Field(..., description="Google API Key required for Embeddings and Chat")

    # CORS Settings
    ALLOWED_ORIGINS_STR: str = Field(default="http://localhost:5173,http://localhost:5174", alias="ALLOWED_ORIGINS")

    @computed_field
    def ALLOWED_ORIGINS(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS_STR.split(",")]

    # Vector Store Settings
    EMBEDDING_MODEL: str = "models/text-embedding-004"
    LLM_MODEL: str = "gemini-flash-latest"
    LLM_TEMPERATURE: float = 0.0

    # Chunking Settings
    CHUNK_SIZE: int = 800
    CHUNK_OVERLAP: int = 400

    # Retrieval Settings
    RETRIEVER_K: int = 7

    # Ingestion Settings
    INGESTION_BATCH_SIZE: int = 10
    INGESTION_MAX_RETRIES: int = 5
    INGESTION_BASE_DELAY: int = 2

    # Chat Settings
    CHAT_MAX_RETRIES: int = 3

    # Security Settings
    MAX_FILE_SIZE_MB: int = 50
    RATE_LIMIT_UPLOADS: int = 10
    RATE_LIMIT_CHAT: int = 30
    PDF_MAGIC_BYTES: bytes = b"%PDF"
    MAX_REQUEST_BODY_MB: int = 1  # For non-upload requests

    # Authentication (optional, disabled by default)
    REQUIRE_AUTH: bool = Field(default=False, description="Enable API key authentication")
    API_KEYS_STR: str = Field(default="", alias="API_KEYS", description="Comma-separated API keys")

    @computed_field
    def API_KEYS(self) -> set:
        """Parse comma-separated API keys into a set"""
        if not self.API_KEYS_STR:
            return set()
        return {k.strip() for k in self.API_KEYS_STR.split(",") if k.strip()}

    @computed_field
    def MAX_FILE_SIZE_BYTES(self) -> int:
        return self.MAX_FILE_SIZE_MB * 1024 * 1024
    
    @computed_field
    def MAX_REQUEST_BODY_BYTES(self) -> int:
        return self.MAX_REQUEST_BODY_MB * 1024 * 1024

    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8",
        extra="ignore"
    )

# Instantiate settings
# This will auto-load from .env and VALIDATE immediately.
# If GOOGLE_API_KEY is missing, it will raise a validation error here.
settings = Settings()  # type: ignore

# Explicit exports for static analysis tools (Mypy/Pylance)
BASE_DIR = settings.BASE_DIR
TEMP_DIR = settings.TEMP_DIR
VECTOR_STORE_PATH = settings.VECTOR_STORE_PATH
DB_PATH = settings.DB_PATH

GOOGLE_API_KEY = settings.GOOGLE_API_KEY
ALLOWED_ORIGINS = settings.ALLOWED_ORIGINS

EMBEDDING_MODEL = settings.EMBEDDING_MODEL
LLM_MODEL = settings.LLM_MODEL
LLM_TEMPERATURE = settings.LLM_TEMPERATURE

CHUNK_SIZE = settings.CHUNK_SIZE
CHUNK_OVERLAP = settings.CHUNK_OVERLAP

RETRIEVER_K = settings.RETRIEVER_K

INGESTION_BATCH_SIZE = settings.INGESTION_BATCH_SIZE
INGESTION_MAX_RETRIES = settings.INGESTION_MAX_RETRIES
INGESTION_BASE_DELAY = settings.INGESTION_BASE_DELAY

CHAT_MAX_RETRIES = settings.CHAT_MAX_RETRIES

MAX_FILE_SIZE_MB = settings.MAX_FILE_SIZE_MB
MAX_FILE_SIZE_BYTES = settings.MAX_FILE_SIZE_BYTES
MAX_REQUEST_BODY_BYTES = settings.MAX_REQUEST_BODY_BYTES
RATE_LIMIT_UPLOADS = settings.RATE_LIMIT_UPLOADS
RATE_LIMIT_CHAT = settings.RATE_LIMIT_CHAT
PDF_MAGIC_BYTES = settings.PDF_MAGIC_BYTES
REQUIRE_AUTH = settings.REQUIRE_AUTH
API_KEYS = settings.API_KEYS
