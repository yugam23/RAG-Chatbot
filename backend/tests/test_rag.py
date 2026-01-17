"""
RAG Module Tests
Tests for retrieval and response generation
"""

import pytest


class TestRAGConfig:
    """Tests for RAG configuration values."""
    
    def test_retriever_k_positive(self):
        """Number of documents to retrieve should be positive."""
        from config import RETRIEVER_K
        assert RETRIEVER_K > 0
    
    def test_retriever_k_reasonable(self):
        """K should be reasonable (not too many documents)."""
        from config import RETRIEVER_K
        assert RETRIEVER_K <= 20
    
    def test_llm_temperature_valid(self):
        """LLM temperature should be between 0 and 1."""
        from config import LLM_TEMPERATURE
        assert 0 <= LLM_TEMPERATURE <= 1
    
    def test_chat_max_retries_reasonable(self):
        """Chat max retries should be reasonable."""
        from config import CHAT_MAX_RETRIES
        assert 1 <= CHAT_MAX_RETRIES <= 10


class TestEmbeddingConfig:
    """Tests for embedding configuration."""
    
    def test_embedding_model_not_empty(self):
        """Embedding model name should not be empty."""
        from config import EMBEDDING_MODEL
        assert EMBEDDING_MODEL
        assert len(EMBEDDING_MODEL) > 0
    
    def test_llm_model_not_empty(self):
        """LLM model name should not be empty."""
        from config import LLM_MODEL
        assert LLM_MODEL
        assert len(LLM_MODEL) > 0
