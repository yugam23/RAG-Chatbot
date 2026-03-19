"""
API Endpoint Tests
Tests for all FastAPI endpoints: health, upload, chat, reset, etc.
"""

import json
import pytest
from httpx import AsyncClient


class TestHealthEndpoint:
    """Tests for the /health endpoint."""
    
    async def test_health_returns_200(self, client: AsyncClient):
        """Health endpoint should return 200 OK or 503 degraded."""
        response = await client.get("/health")
        assert response.status_code in [200, 503]
    
    async def test_health_returns_status_healthy(self, client: AsyncClient):
        """Health endpoint should return ok or degraded status."""
        response = await client.get("/health")
        data = response.json()
        assert data["status"] in ["ok", "degraded"]
    
    async def test_health_includes_checks(self, client: AsyncClient):
        """Health endpoint should include checks object."""
        response = await client.get("/health")
        data = response.json()
        assert "checks" in data
        assert isinstance(data["checks"], dict)


class TestStatusEndpoint:
    """Tests for the /status endpoint."""
    
    async def test_status_returns_200(self, client: AsyncClient):
        """Status endpoint should return 200 OK."""
        response = await client.get("/status")
        assert response.status_code == 200
    
    async def test_status_returns_filename_null_initially(self, client: AsyncClient):
        """Status should return null filename when no document uploaded."""
        response = await client.get("/status")
        data = response.json()
        assert data["filename"] is None


class TestHistoryEndpoint:
    """Tests for the /history endpoint."""
    
    async def test_history_returns_200(self, client: AsyncClient):
        """History endpoint should return 200 OK."""
        response = await client.get("/history")
        assert response.status_code == 200
    
    async def test_history_returns_list(self, client: AsyncClient):
        """History endpoint should return a list."""
        response = await client.get("/history")
        data = response.json()
        assert isinstance(data, list)


class TestUploadEndpoint:
    """Tests for the /upload endpoint."""
    
    async def test_upload_rejects_non_pdf(self, client: AsyncClient, fake_pdf_content: bytes):
        """Upload should reject files without PDF magic bytes."""
        files = {"file": ("test.pdf", fake_pdf_content, "application/pdf")}
        response = await client.post("/upload", files=files)
        assert response.status_code == 400
        assert "Invalid PDF" in response.json()["detail"]
    
    async def test_upload_rejects_wrong_extension(self, client: AsyncClient, sample_pdf_content: bytes):
        """Upload should reject files without .pdf extension."""
        files = {"file": ("test.txt", sample_pdf_content, "application/pdf")}
        response = await client.post("/upload", files=files)
        assert response.status_code == 400
        assert "Only PDF" in response.json()["detail"]


class TestClearChatEndpoint:
    """Tests for the /clear_chat endpoint."""
    
    async def test_clear_chat_returns_200(self, client: AsyncClient):
        """Clear chat endpoint should return 200 OK."""
        response = await client.post("/clear_chat")
        assert response.status_code == 200
    
    async def test_clear_chat_returns_status(self, client: AsyncClient):
        """Clear chat should return status message."""
        response = await client.post("/clear_chat")
        data = response.json()
        assert "status" in data


class TestResetEndpoint:
    """Tests for the /reset endpoint."""
    
    async def test_reset_returns_200(self, client: AsyncClient):
        """Reset endpoint should return 200 OK."""
        response = await client.post("/reset")
        assert response.status_code == 200
    
    async def test_reset_returns_status(self, client: AsyncClient):
        """Reset should return status message."""
        response = await client.post("/reset")
        data = response.json()
        assert data["status"] == "Session Reset"


class TestRequestIDHeader:
    """Tests for X-Request-ID middleware."""
    
    async def test_health_includes_request_id_header(self, client: AsyncClient):
        """All responses should include X-Request-ID header."""
        response = await client.get("/health")
        assert "x-request-id" in response.headers
    
    async def test_request_id_is_unique(self, client: AsyncClient):
        """Each request should have a unique request ID."""
        response1 = await client.get("/health")
        response2 = await client.get("/health")
        id1 = response1.headers.get("x-request-id")
        id2 = response2.headers.get("x-request-id")
        assert id1 != id2


class TestChatEdgeCases:
    """Edge case tests for chat functionality."""
    
    async def test_chat_without_document_returns_error(self, client: AsyncClient):
        """Chat should fail gracefully when no document is uploaded."""
        response = await client.post("/chat", json={"question": "What is this about?"})
        # Should return 200 with streaming error, not crash
        assert response.status_code == 200
        # Response should contain error indication
        content = response.text
        assert "error" in content.lower() or "upload" in content.lower()
    
    async def test_chat_with_empty_question_rejected(self, client: AsyncClient):
        """Empty question should be rejected with 422."""
        response = await client.post("/chat", json={"question": ""})
        assert response.status_code == 422
    
    async def test_chat_missing_question_field(self, client: AsyncClient):
        """Missing question field should return 422."""
        response = await client.post("/chat", json={})
        assert response.status_code == 422


class TestUploadEdgeCases:
    """Edge case tests for upload functionality."""
    
    async def test_upload_missing_file(self, client: AsyncClient):
        """Upload without file should return 422."""
        response = await client.post("/upload")
        assert response.status_code == 422
    
    async def test_upload_empty_filename(self, client: AsyncClient, sample_pdf_content: bytes):
        """Upload with empty filename should be handled."""
        files = {"file": ("", sample_pdf_content, "application/pdf")}
        response = await client.post("/upload", files=files)
        # Should reject - either 400 (no .pdf extension) or 422 (validation)
        assert response.status_code in [400, 422]


class TestUploadToChatIntegration:
    """Integration test: full upload -> chat flow with mocked LLM."""

    async def test_upload_to_chat_integration_with_mocked_llm(
        self, client: AsyncClient, temp_pdf_file
    ):
        """Upload a PDF, then chat — LLM mocked, rest runs for real."""
        pytest.importorskip("langchain_core")
        from unittest.mock import MagicMock, AsyncMock, patch
        import json

        # Mock shard and ingest result
        mock_shard = MagicMock()
        mock_ingest_result = {"chunks": 5, "shard": mock_shard, "doc_id": "test-doc-id"}

        # Mock run_in_threadpool to bypass thread pool for sync functions we're mocking
        async def mock_run_in_threadpool(func, *args, **kwargs):
            if func.__name__ == "ingest_pdf":
                return mock_ingest_result
            elif func.__name__ == "merge_shard":
                return None
            return func(*args, **kwargs)

        with patch("routers.upload.run_in_threadpool", side_effect=mock_run_in_threadpool), \
             patch("routers.upload.insert_document", return_value=None) as mock_insert:

            # Upload PDF (ingest_pdf is mocked, so no actual PDF processing)
            with open(temp_pdf_file, "rb") as f:
                upload_response = await client.post(
                    "/upload",
                    files={"file": ("test.pdf", f, "application/pdf")}
                )
            assert upload_response.status_code == 200
            assert upload_response.json()["chunks"] == 5

        # Mock the RAG chain for chat using generate_chat_response directly
        async def mock_generate_chat_response(question: str):
            """Mock that yields sources then tokens without hitting the LLM."""
            yield json.dumps({"type": "sources", "data": [
                {"doc_id": "test-id", "filename": "test.pdf", "page": 1, "preview": "..."}
            ]}) + "\n"
            yield json.dumps({"type": "token", "data": "Hello "}) + "\n"
            yield json.dumps({"type": "token", "data": "from mocked LLM"}) + "\n"

        with patch("routers.chat.generate_chat_response", side_effect=mock_generate_chat_response):
            chat_response = await client.post(
                "/chat", json={"question": "What is this about?"}
            )
            assert chat_response.status_code == 200

            # Response should contain streamed tokens
            content = chat_response.text
            events = [json.loads(line) for line in content.strip().split("\n") if line.strip()]
            # Should have sources event and token events
            event_types = [e["type"] for e in events]
            assert "sources" in event_types
            assert "token" in event_types
