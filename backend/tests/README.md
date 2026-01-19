# Testing Guide

This directory contains the test suite for the RAG Chatbot backend. The tests use `pytest` and `pytest-asyncio` for asynchronous testing of the FastAPI application.

## Prerequisites

Ensure you have the development dependencies installed within your virtual environment:

### 1. Activate Virtual Environment

**Bash (Mac/Linux)**
```bash
source venv/bin/activate
```

**PowerShell (Windows)**
```powershell
.\venv\Scripts\Activate.ps1
```

**CMD (Windows)**
```cmd
.\venv\Scripts\activate.bat
```

### 2. Install Dependencies
```bash
# From the backend directory
pip install -r requirements.txt
```

*(Ensure `pytest`, `pytest-asyncio`, and `httpx` are installed. If not, install them via `pip install pytest pytest-asyncio httpx`)*

## Running Tests

You can run tests using `pytest` directly if your environment is active, or via `python -m pytest`.

### Run All Tests
To run the entire test suite, execute the following command from the `backend/` directory:

**Bash**
```bash
pytest
```

**PowerShell**
```powershell
python -m pytest
# OR if venv is active
pytest
```

**CMD**
```cmd
python -m pytest
:: OR if venv is active
pytest
```

### Run Specific Test Files

**Bash**
```bash
# Test API endpoints
pytest tests/test_api.py

# Test Input Validation
pytest tests/test_validation.py
```

**PowerShell**
```powershell
# Test API endpoints
python -m pytest tests/test_api.py

# Test Input Validation
python -m pytest tests/test_validation.py
```

**CMD**
```cmd
:: Test API endpoints
python -m pytest tests\test_api.py

:: Test Input Validation
python -m pytest tests\test_validation.py
```

### Run Specific Test Functions
To run a single specific test case:

**Bash**
```bash
pytest tests/test_api.py::test_health_check
```

**PowerShell**
```powershell
python -m pytest tests/test_api.py::test_health_check
```

**CMD**
```cmd
python -m pytest tests\test_api.py::test_health_check
```

## Test Structure

- **`conftest.py`**: Contains shared fixtures (setup/teardown logic) available to all tests.
  - Mock environment variables.
  - `AsyncClient` setup for FastAPI testing.
  - Database and Vector Store mocking to prevent tests from writing to the real disk.
- **`test_api.py`**: Integration tests for API endpoints.
- **`test_validation.py`**: Unit tests for Pydantic models and input sanitization.
- **`test_middleware.py`**: Tests for Rate Limiting, CORS, and Auth middleware.
- **`test_ingestion.py`**: Tests for PDF parsing and chunking logic.
- **`test_rag.py`**: Tests for the retrieval and generation pipeline.

## Configuration

Test configuration is handled in `pytest.ini` located in the `backend/` root:
- **Asyncio Mode**: Auto
- **Output**: Verbose (`-v`) with short tracebacks (`--tb=short`)
- **Warnings**: Deprecation warnings are ignored for cleaner output.
