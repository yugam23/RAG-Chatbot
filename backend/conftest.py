"""
Root-level conftest.py — runs before test collection.

Sets GOOGLE_API_KEY as a non-secret CI test value to prevent
pydantic-settings ValidationError when importing backend modules
that instantiate Settings() at module scope.
"""
import os

os.environ.setdefault("GOOGLE_API_KEY", "ci_test_key")
os.environ.setdefault("ENVIRONMENT", "test")
