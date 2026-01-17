"""
Pytest Configuration and Fixtures
Shared fixtures for all test modules
"""

import asyncio
import os
import sys
from pathlib import Path
from typing import AsyncGenerator, Generator

import pytest
from httpx import AsyncClient, ASGITransport

# Ensure backend is in path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Set test environment
os.environ["ENVIRONMENT"] = "test"
os.environ["GOOGLE_API_KEY"] = "test_key_for_testing"


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an event loop for the test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def app():
    """Get FastAPI app instance for testing."""
    from main import app
    yield app


@pytest.fixture
async def client(app) -> AsyncGenerator[AsyncClient, None]:
    """
    Create an async HTTP client for testing API endpoints.
    Uses ASGI transport for in-process testing (no network).
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def sample_pdf_content() -> bytes:
    """
    Generate minimal valid PDF content for testing.
    This is the smallest possible valid PDF.
    """
    return b"""%PDF-1.0
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000052 00000 n 
0000000101 00000 n 
trailer<</Size 4/Root 1 0 R>>
startxref
178
%%EOF"""


@pytest.fixture
def fake_pdf_content() -> bytes:
    """Generate invalid PDF content (text file) for testing rejection."""
    return b"This is not a real PDF file\nJust plain text."


@pytest.fixture
def temp_pdf_file(tmp_path: Path, sample_pdf_content: bytes) -> Path:
    """Create a temporary valid PDF file for testing."""
    pdf_path = tmp_path / "test_document.pdf"
    pdf_path.write_bytes(sample_pdf_content)
    return pdf_path
