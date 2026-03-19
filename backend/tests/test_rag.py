"""
RAG Module Tests
Tests for retrieval and response generation
"""

import pytest
import json
from unittest.mock import MagicMock, patch


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


class TestRAGRetryLogic:
    """Tests for RAG retry with exponential backoff (TESTBE-02)."""

    @pytest.mark.asyncio
    async def test_rag_retry_exponential_backoff_on_rate_limit(self):
        """RAG retries with exponential backoff on 429 rate limit: 5s, 10s, then error event."""
        pytest.importorskip("langchain_core")
        import rag
        from config import CHAT_MAX_RETRIES
        from models import StreamEvent

        # Track sleep calls
        sleep_calls = []

        async def mock_sleep(delay):
            sleep_calls.append(delay)

        # Mock chain that always raises rate limit error
        mock_chain_instance = MagicMock()
        # Make astream an async generator (async def that yields then raises)
        async def mock_astream_raise(*args, **kwargs):
            yield "dummy"  # Must yield at least once to be an async generator
            raise Exception("429 RESOURCE_EXHAUSTED Too Many Requests")
        mock_chain_instance.astream = mock_astream_raise

        # Build the chain via pipe operator (prompt | llm | parser)
        mock_prompt = MagicMock()
        mock_intermediate = MagicMock()
        mock_intermediate.__or__ = MagicMock(return_value=mock_chain_instance)
        mock_prompt.__or__ = MagicMock(return_value=mock_intermediate)

        mock_doc = MagicMock()
        mock_doc.page_content = "Test document"
        mock_doc.metadata = {"doc_id": "1", "filename": "test.pdf", "page": 0}

        with patch.object(rag.vector_store, "similarity_search", return_value=[mock_doc]), \
             patch("rag.asyncio.sleep", side_effect=mock_sleep), \
             patch("rag.ChatPromptTemplate") as mock_prompt_cls, \
             patch("rag.StrOutputParser") as mock_parser_cls:

            mock_prompt_cls.from_template.return_value = mock_prompt
            mock_parser_cls.return_value = MagicMock()

            events = []
            async for event in rag.generate_chat_response("test"):
                events.append(event)

        # Should have slept twice (between attempts 0-1 and 1-2)
        assert len(sleep_calls) == 2
        assert sleep_calls[0] == 5    # 5 * 2^0
        assert sleep_calls[1] == 10   # 5 * 2^1

        # Last event should be an error
        last_event = json.loads(events[-1])
        assert last_event["type"] == "error"
        assert "busy" in last_event["data"].lower() or "rate" in last_event["data"].lower()

    @pytest.mark.asyncio
    async def test_rag_non_rate_limit_error_propagates_immediately(self):
        """Non-rate-limit errors propagate immediately without retry."""
        pytest.importorskip("langchain_core")
        import rag
        from config import CHAT_MAX_RETRIES
        from models import StreamEvent

        sleep_calls = []

        async def mock_sleep(delay):
            sleep_calls.append(delay)

        mock_chain_instance = MagicMock()

        class ImmediateErrorAsyncIterator:
            """Async iterator that raises immediately on first __anext__ (no tokens)."""
            def __init__(self, error_msg):
                self.error = Exception(error_msg)

            def __aiter__(self):
                return self

            async def __anext__(self):
                raise self.error

        mock_chain_instance.astream = lambda *args, **kwargs: ImmediateErrorAsyncIterator("Some other error")

        mock_prompt = MagicMock()
        mock_intermediate = MagicMock()
        mock_intermediate.__or__ = MagicMock(return_value=mock_chain_instance)
        mock_prompt.__or__ = MagicMock(return_value=mock_intermediate)

        mock_doc = MagicMock()
        mock_doc.page_content = "Test document"
        mock_doc.metadata = {"doc_id": "1", "filename": "test.pdf", "page": 0}

        with patch.object(rag.vector_store, "similarity_search", return_value=[mock_doc]), \
             patch("rag.asyncio.sleep", side_effect=mock_sleep), \
             patch("rag.ChatPromptTemplate") as mock_prompt_cls, \
             patch("rag.StrOutputParser") as mock_parser_cls:

            mock_prompt_cls.from_template.return_value = mock_prompt
            mock_parser_cls.return_value = MagicMock()

            events = []
            async for event in rag.generate_chat_response("test"):
                events.append(event)

        # No retries for non-rate-limit errors
        assert len(sleep_calls) == 0

        # Second event (after sources) is error
        error_event = json.loads(events[1])
        assert error_event["type"] == "error"
        assert "Some other error" in error_event["data"]

    @pytest.mark.asyncio
    async def test_rag_no_document_returns_upload_prompt(self):
        """When similarity_search raises FileNotFoundError, error event contains 'upload a document'."""
        pytest.importorskip("langchain_core")
        import rag

        with patch.object(
            rag.vector_store, "similarity_search",
            side_effect=FileNotFoundError("No index found")
        ):
            events = []
            async for event in rag.generate_chat_response("test"):
                events.append(event)

        assert len(events) == 1
        error_event = json.loads(events[0])
        assert error_event["type"] == "error"
        assert "upload" in error_event["data"].lower()
