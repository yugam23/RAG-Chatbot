"""
API Endpoint Tests
Tests for all FastAPI endpoints: health, upload, chat, reset, etc.
"""

import pytest
from httpx import AsyncClient


class TestHealthEndpoint:
    """Tests for the /health endpoint."""
    
    async def test_health_returns_200(self, client: AsyncClient):
        """Health endpoint should return 200 OK."""
        response = await client.get("/health")
        assert response.status_code == 200
    
    async def test_health_returns_status_healthy(self, client: AsyncClient):
        """Health endpoint should return healthy status."""
        response = await client.get("/health")
        data = response.json()
        assert data["status"] == "healthy"
    
    async def test_health_includes_version(self, client: AsyncClient):
        """Health endpoint should include version number."""
        response = await client.get("/health")
        data = response.json()
        assert "version" in data
        assert data["version"].startswith("2.")


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
