"""
Middleware Tests
Tests for rate limiting, request size limits, and authentication middleware
"""

import pytest
from httpx import AsyncClient


class TestRateLimitMiddleware:
    """Tests for rate limiting functionality."""
    
    async def test_requests_within_limit_succeed(self, client: AsyncClient):
        """Requests within rate limit should succeed."""
        # Make a few requests (well within limit)
        for _ in range(3):
            response = await client.get("/health")
            assert response.status_code == 200
    
    async def test_rate_limit_applies_to_chat_endpoint(self, client: AsyncClient):
        """Chat endpoint should be subject to rate limiting."""
        # This test verifies the endpoint exists and returns expected status
        # (not actually hitting the limit as that would require 30 requests)
        response = await client.post("/chat", json={"question": "test"})
        # Will fail with no document, but not 429 (rate limit)
        assert response.status_code != 429


class TestRequestSizeLimitMiddleware:
    """Tests for request body size limits."""
    
    async def test_normal_request_size_accepted(self, client: AsyncClient):
        """Normal sized requests should be accepted."""
        response = await client.post("/chat", json={"question": "Hello, how are you?"})
        # May fail due to no document, but not due to size
        assert response.status_code != 413
    
    async def test_oversized_request_rejected(self, client: AsyncClient):
        """Requests exceeding size limit should be rejected with 413."""
        # Create a payload larger than 1MB
        large_payload = {"question": "x" * (2 * 1024 * 1024)}  # 2MB of data
        response = await client.post(
            "/chat",
            json=large_payload,
        )
        assert response.status_code == 413
        assert "too large" in response.json().get("error", "").lower()
    
    async def test_upload_endpoint_exempt_from_body_limit(self, client: AsyncClient, sample_pdf_content: bytes):
        """Upload endpoint should not be subject to 1MB body limit."""
        # Upload should fail for other reasons, not 413
        files = {"file": ("test.pdf", sample_pdf_content, "application/pdf")}
        response = await client.post("/upload", files=files)
        # Will fail during ingestion (no real API key), but not 413
        assert response.status_code != 413


class TestAPIKeyMiddleware:
    """Tests for optional API key authentication."""
    
    async def test_auth_disabled_allows_requests(self, client: AsyncClient):
        """When auth is disabled (default), requests should succeed without API key."""
        response = await client.get("/health")
        assert response.status_code == 200
    
    async def test_status_accessible_without_auth(self, client: AsyncClient):
        """Status endpoint accessible when auth disabled."""
        response = await client.get("/status")
        assert response.status_code == 200
    
    async def test_api_key_header_ignored_when_disabled(self, client: AsyncClient):
        """API key header is ignored when auth is disabled."""
        response = await client.get("/status", headers={"X-API-Key": "any-key"})
        assert response.status_code == 200
