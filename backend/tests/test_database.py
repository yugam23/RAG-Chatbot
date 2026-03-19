"""
Tests for database async functions.
Uses real aiosqlite in-memory databases for reliable async context manager behavior.
Covers add_message, get_history, clear_messages, insert_document,
delete_document_record, get_all_documents, get_all_doc_ids.
"""
import pytest
import aiosqlite
from pathlib import Path
import database


# Use a temp file for the DB path so tests don't interfere
@pytest.fixture
def temp_db_path(tmp_path):
    """Provide a temp DB path for each test."""
    return tmp_path / "test.db"


@pytest.fixture
async def real_db(temp_db_path):
    """Create a real in-memory database with schema for testing."""
    # Override DB_PATH for this test
    original_path = database.DB_PATH
    database.DB_PATH = temp_db_path
    await database.init_db()
    yield database
    database.DB_PATH = original_path


class TestDatabase:
    """Tests for database async functions using real aiosqlite."""

    @pytest.mark.asyncio
    async def test_add_message_inserts_row(self, real_db):
        """add_message inserts role and content into messages table."""
        await real_db.add_message("user", "Hello")

        # Verify directly
        async with aiosqlite.connect(database.DB_PATH) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(
                "SELECT role, content FROM messages WHERE role = ? AND content = ?",
                ("user", "Hello")
            ) as cursor:
                rows = await cursor.fetchall()
                assert len(rows) == 1
                assert rows[0]["role"] == "user"
                assert rows[0]["content"] == "Hello"

    @pytest.mark.asyncio
    async def test_get_history_returns_list_of_messages(self, real_db):
        """get_history returns list of {role, content} dicts ordered by timestamp."""
        await real_db.add_message("user", "Hello")
        await real_db.add_message("assistant", "Hi there")

        result = await real_db.get_history()
        assert isinstance(result, list)
        assert len(result) == 2
        assert result[0]["role"] == "user"
        assert result[1]["role"] == "assistant"

    @pytest.mark.asyncio
    async def test_clear_messages_deletes_all(self, real_db):
        """clear_messages deletes all rows from messages table."""
        await real_db.add_message("user", "Hello")
        await real_db.clear_messages()

        result = await real_db.get_history()
        assert result == []

    @pytest.mark.asyncio
    async def test_insert_document_inserts_doc_record(self, real_db):
        """insert_document inserts doc_id, filename, chunk_count, shard_path."""
        await real_db.insert_document("doc-1", "test.pdf", 5, "/shards/doc-1")

        # Verify directly
        async with aiosqlite.connect(database.DB_PATH) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(
                "SELECT * FROM documents WHERE doc_id = ?", ("doc-1",)
            ) as cursor:
                row = await cursor.fetchone()
                assert row is not None
                assert row["filename"] == "test.pdf"
                assert row["chunk_count"] == 5

    @pytest.mark.asyncio
    async def test_delete_document_record_deletes_by_id(self, real_db):
        """delete_document_record deletes the specified doc_id."""
        await real_db.insert_document("doc-1", "test.pdf", 5, "/shards/doc-1")
        await real_db.insert_document("doc-2", "other.pdf", 3, "/shards/doc-2")

        await real_db.delete_document_record("doc-1")

        # Verify doc-1 is gone but doc-2 remains
        async with aiosqlite.connect(database.DB_PATH) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("SELECT doc_id FROM documents") as cursor:
                rows = await cursor.fetchall()
                assert len(rows) == 1
                assert rows[0]["doc_id"] == "doc-2"

    @pytest.mark.asyncio
    async def test_get_all_documents_returns_list(self, real_db):
        """get_all_documents returns list of document dicts ordered by created_at."""
        await real_db.insert_document("doc-1", "a.pdf", 5, "/shards/doc-1")
        await real_db.insert_document("doc-2", "b.pdf", 3, "/shards/doc-2")

        result = await real_db.get_all_documents()
        assert isinstance(result, list)
        assert len(result) == 2
        assert result[0]["filename"] == "a.pdf"
        assert result[1]["filename"] == "b.pdf"

    @pytest.mark.asyncio
    async def test_get_all_doc_ids_returns_list_of_ids(self, real_db):
        """get_all_doc_ids returns list of doc_id strings."""
        await real_db.insert_document("doc-1", "a.pdf", 5, "/shards/doc-1")
        await real_db.insert_document("doc-abc", "b.pdf", 3, "/shards/doc-abc")

        result = await real_db.get_all_doc_ids()
        assert isinstance(result, list)
        assert "doc-1" in result
        assert "doc-abc" in result

    @pytest.mark.asyncio
    async def test_get_document_returns_dict_when_found(self, real_db):
        """get_document returns dict when doc_id exists."""
        await real_db.insert_document("doc-1", "test.pdf", 5, "/shards/doc-1")

        result = await real_db.get_document("doc-1")
        assert isinstance(result, dict)
        assert result["doc_id"] == "doc-1"
        assert result["filename"] == "test.pdf"

    @pytest.mark.asyncio
    async def test_get_document_returns_none_when_not_found(self, real_db):
        """get_document returns None when doc_id does not exist."""
        result = await real_db.get_document("nonexistent")
        assert result is None

    @pytest.mark.asyncio
    async def test_get_history_paginated_returns_paginated_dict(self, real_db):
        """get_history_paginated returns dict with messages, total, limit, offset, has_more."""
        # Add 60 messages
        for i in range(60):
            await real_db.add_message("user", f"Message {i}")

        result = await real_db.get_history_paginated(limit=50, offset=0)
        assert isinstance(result, dict)
        assert "messages" in result
        assert "total" in result
        assert result["total"] == 60
        assert result["limit"] == 50
        assert result["offset"] == 0
        assert result["has_more"] is True  # 60 > 50
        assert len(result["messages"]) == 50

    @pytest.mark.asyncio
    async def test_get_history_paginated_has_more_false_when_at_end(self, real_db):
        """get_history_paginated has_more is False when offset+limit >= total."""
        # Add 30 messages
        for i in range(30):
            await real_db.add_message("user", f"Message {i}")

        result = await real_db.get_history_paginated(limit=50, offset=0)
        assert result["has_more"] is False  # 30 <= 50
        assert len(result["messages"]) == 30

    @pytest.mark.asyncio
    async def test_get_history_paginated_respects_offset(self, real_db):
        """get_history_paginated correctly skips offset messages."""
        for i in range(10):
            await real_db.add_message("user", f"Message {i}")

        result = await real_db.get_history_paginated(limit=5, offset=5)
        assert result["total"] == 10
        assert result["offset"] == 5
        assert len(result["messages"]) == 5
        assert result["has_more"] is False  # 5 + 5 = 10, no more

    @pytest.mark.asyncio
    async def test_delete_db_removes_file(self, temp_db_path):
        """delete_db removes the database file when it exists."""
        # Set up a real DB
        original = database.DB_PATH
        database.DB_PATH = temp_db_path
        await database.init_db()
        assert temp_db_path.exists()

        await database.delete_db()
        assert not temp_db_path.exists()

        database.DB_PATH = original
