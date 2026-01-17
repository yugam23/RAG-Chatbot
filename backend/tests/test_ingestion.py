"""
Ingestion Module Tests
Tests for PDF loading, chunking, and vector store creation
"""

import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock


class TestPDFValidation:
    """Tests for PDF validation logic."""
    
    def test_valid_pdf_magic_bytes(self, sample_pdf_content: bytes):
        """Valid PDF should start with %PDF magic bytes."""
        from config import PDF_MAGIC_BYTES
        assert sample_pdf_content.startswith(PDF_MAGIC_BYTES)
    
    def test_invalid_pdf_magic_bytes(self, fake_pdf_content: bytes):
        """Fake PDF should not have PDF magic bytes."""
        from config import PDF_MAGIC_BYTES
        assert not fake_pdf_content.startswith(PDF_MAGIC_BYTES)


class TestChunkingConfig:
    """Tests for chunking configuration."""
    
    def test_chunk_size_is_reasonable(self):
        """Chunk size should be between 100 and 2000."""
        from config import CHUNK_SIZE
        assert 100 <= CHUNK_SIZE <= 2000
    
    def test_chunk_overlap_less_than_size(self):
        """Chunk overlap should be less than chunk size."""
        from config import CHUNK_SIZE, CHUNK_OVERLAP
        assert CHUNK_OVERLAP < CHUNK_SIZE
    
    def test_chunk_overlap_positive(self):
        """Chunk overlap should be positive."""
        from config import CHUNK_OVERLAP
        assert CHUNK_OVERLAP > 0


class TestIngestionConfig:
    """Tests for ingestion configuration."""
    
    def test_batch_size_positive(self):
        """Batch size should be positive."""
        from config import INGESTION_BATCH_SIZE
        assert INGESTION_BATCH_SIZE > 0
    
    def test_max_retries_reasonable(self):
        """Max retries should be between 1 and 10."""
        from config import INGESTION_MAX_RETRIES
        assert 1 <= INGESTION_MAX_RETRIES <= 10
