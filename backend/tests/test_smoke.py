"""Smoke test verifying pytest-asyncio infrastructure works."""
import pytest


@pytest.mark.asyncio
async def test_async_infrastructure():
    """Verify async test execution works with asyncio_mode = auto."""
    result = await _async_add(2, 3)
    assert result == 5


async def _async_add(a: int, b: int) -> int:
    """Trivial async function for smoke testing."""
    return a + b


@pytest.mark.asyncio
async def test_app_imports_without_validation_error():
    """Verify that importing the FastAPI app does not raise a ValidationError.

    This confirms that GOOGLE_API_KEY is set before pydantic-settings
    collection by the root-level conftest.py.
    """
    from main import app
    assert app is not None
    assert app.title  # FastAPI app has a title
