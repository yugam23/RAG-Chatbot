"""
Ingestion Module Tests
Tests for PDF loading, chunking, and vector store creation
"""

import pytest
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


def make_mock_docs(count: int):
    """Helper: create `count` MagicMock documents with page_content and metadata."""
    docs = []
    for i in range(count):
        doc = MagicMock()
        doc.page_content = f"chunk {i}"
        doc.metadata = {}
        docs.append(doc)
    return docs


class TestFAISSIndexBranching:
    """Tests for FAISS index selection based on corpus size (TESTBE-03)."""

    def test_small_corpus_uses_flat_l2_index(self):
        """Under 1000 chunks, create_optimized_vectorstore uses FAISS.from_documents."""
        pytest.importorskip("langchain_core")
        from ingestion import create_optimized_vectorstore

        mock_docs = make_mock_docs(10)
        mock_embeddings = MagicMock()
        mock_embeddings.embed_documents.return_value = [[0.1] * 768] * 10

        with patch("ingestion.FAISS") as mock_faiss:
            mock_faiss.from_documents.return_value = MagicMock()
            result = create_optimized_vectorstore(mock_docs, mock_embeddings, num_chunks=10)

            mock_faiss.from_documents.assert_called_once_with(mock_docs, mock_embeddings)
            assert result is not None

    def test_large_corpus_attempts_ivf_index(self):
        """1000+ chunks, create_optimized_vectorstore attempts IVF index creation."""
        pytest.importorskip("langchain_core")
        from ingestion import create_optimized_vectorstore

        mock_docs = make_mock_docs(1000)
        mock_embeddings = MagicMock()
        mock_embeddings.embed_documents.return_value = [[0.1] * 768] * 1000

        import sys
        with patch("ingestion.FAISS") as mock_faiss, \
             patch.dict(sys.modules, {"faiss": MagicMock(), "numpy": MagicMock()}):

            mock_faiss_module = sys.modules["faiss"]
            mock_np_module = sys.modules["numpy"]

            mock_trainable_index = MagicMock()
            mock_faiss_module.IndexFlatL2 = MagicMock(return_value=MagicMock())
            mock_faiss_module.IndexIVFFlat = MagicMock(return_value=mock_trainable_index)
            mock_np_module.array.return_value = MagicMock()
            mock_np_module.array.return_value.astype.return_value = MagicMock()

            result = create_optimized_vectorstore(mock_docs, mock_embeddings, num_chunks=1000)

            mock_faiss_module.IndexFlatL2.assert_called()
            mock_faiss_module.IndexIVFFlat.assert_called()
            mock_trainable_index.train.assert_called()
            mock_faiss.from_documents.assert_called()
            assert result is not None
