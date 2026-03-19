"""
Tests for FAISSVectorStore public methods.
Covers merge_shard, rebuild_from_shards, clear, is_loaded.
"""
import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from pathlib import Path
import threading


class TestFAISSVectorStore:
    """Tests for FAISSVectorStore public methods."""

    def test_merge_shard_sets_vectorstore_when_empty(self):
        """merge_shard into empty _vectorstore sets it to the shard directly."""
        pytest.importorskip("langchain_core")
        from vector_store import FAISSVectorStore

        vs = FAISSVectorStore.__new__(FAISSVectorStore)  # bypass __init__ (avoids embeddings API call)
        vs._vectorstore = None
        vs.store_path = Path("/tmp/test_store")
        vs._embeddings = MagicMock()

        mock_shard = MagicMock()
        vs.merge_shard(mock_shard)
        assert vs._vectorstore is mock_shard

    def test_merge_shard_calls_merge_from_when_populated(self):
        """merge_shard calls merge_from on existing index."""
        from vector_store import FAISSVectorStore

        existing = MagicMock()
        vs = FAISSVectorStore.__new__(FAISSVectorStore)
        vs._vectorstore = existing
        vs.store_path = Path("/tmp/test_store")
        vs._embeddings = MagicMock()

        new_shard = MagicMock()
        vs.merge_shard(new_shard)
        existing.merge_from.assert_called_once_with(new_shard)

    def test_clear_resets_vectorstore_and_removes_dirs(self):
        """clear sets _vectorstore to None and removes store_path and shard_dir."""
        from vector_store import FAISSVectorStore

        vs = FAISSVectorStore.__new__(FAISSVectorStore)
        vs._vectorstore = MagicMock()
        vs.store_path = Path("/tmp/test_vs_store")
        vs.store_path.mkdir(parents=True, exist_ok=True)

        with patch("vector_store.shutil.rmtree") as mock_rmtree:
            vs.clear()
            assert vs._vectorstore is None
            # rmtree called at least once (for store_path or shard_dir)
            assert mock_rmtree.call_count >= 1

    def test_is_loaded_true_when_vectorstore_set(self):
        """is_loaded returns True when _vectorstore is not None."""
        from vector_store import FAISSVectorStore

        vs = FAISSVectorStore.__new__(FAISSVectorStore)
        vs._vectorstore = MagicMock()
        assert vs.is_loaded() is True

    def test_is_loaded_false_when_vectorstore_none(self):
        """is_loaded returns False when _vectorstore is None."""
        from vector_store import FAISSVectorStore

        vs = FAISSVectorStore.__new__(FAISSVectorStore)
        vs._vectorstore = None
        assert vs.is_loaded() is False

    def test_rebuild_from_shards_with_empty_list_clears_index(self):
        """rebuild_from_shards with empty surviving_doc_ids clears the index."""
        from vector_store import FAISSVectorStore

        vs = FAISSVectorStore.__new__(FAISSVectorStore)
        vs._vectorstore = MagicMock()
        vs.store_path = Path("/tmp/test_vs_store")

        with patch("vector_store.shutil.rmtree"):
            vs.rebuild_from_shards([])

        assert vs._vectorstore is None

    def test_rebuild_from_shards_loads_and_merges_shards(self):
        """rebuild_from_shards loads shards from disk and merges them."""
        from vector_store import FAISSVectorStore

        vs = FAISSVectorStore.__new__(FAISSVectorStore)
        vs._vectorstore = None
        vs.store_path = Path("/tmp/test_vs_store")
        vs._embeddings = MagicMock()

        with patch("vector_store.FAISS.load_local") as mock_load:
            mock_shard = MagicMock()
            mock_load.return_value = mock_shard

            vs.rebuild_from_shards(["doc1", "doc2"])

            assert mock_load.call_count == 2
            assert vs._vectorstore is mock_shard

    def test_add_documents_creates_new_index_when_empty(self):
        """add_documents creates a new FAISS index when _vectorstore is None."""
        from vector_store import FAISSVectorStore

        vs = FAISSVectorStore.__new__(FAISSVectorStore)
        vs._vectorstore = None
        vs.store_path = Path("/tmp/test_vs_store")
        vs._embeddings = MagicMock()

        mock_docs = [MagicMock()]
        mock_faiss_instance = MagicMock()
        with patch("vector_store.FAISS.from_documents", return_value=mock_faiss_instance) as mock_from:
            result = vs.add_documents(mock_docs)
            assert result == 1
            mock_from.assert_called_once()

    def test_add_documents_adds_to_existing_index(self):
        """add_documents calls add_documents on existing index when populated."""
        from vector_store import FAISSVectorStore

        vs = FAISSVectorStore.__new__(FAISSVectorStore)
        existing = MagicMock()
        vs._vectorstore = existing
        vs.store_path = Path("/tmp/test_vs_store")
        vs._embeddings = MagicMock()

        mock_docs = [MagicMock(), MagicMock()]
        result = vs.add_documents(mock_docs)
        assert result == 2
        vs._vectorstore.add_documents.assert_called_once_with(mock_docs)

    def test_save_calls_save_local_when_loaded(self):
        """save calls save_local on the vectorstore when it exists."""
        from vector_store import FAISSVectorStore

        vs = FAISSVectorStore.__new__(FAISSVectorStore)
        mock_vs = MagicMock()
        vs._vectorstore = mock_vs
        vs.store_path = Path("/tmp/test_vs_store")
        vs._embeddings = MagicMock()

        vs.save()
        mock_vs.save_local.assert_called_once_with(str(vs.store_path))

    def test_save_does_nothing_when_not_loaded(self):
        """save does nothing when _vectorstore is None."""
        from vector_store import FAISSVectorStore

        vs = FAISSVectorStore.__new__(FAISSVectorStore)
        vs._vectorstore = None
        vs.store_path = Path("/tmp/test_vs_store")
        vs._embeddings = MagicMock()

        # Should not raise
        vs.save()

    def test_exists_returns_true_when_store_path_exists(self):
        """exists returns True when store_path exists."""
        from vector_store import FAISSVectorStore

        vs = FAISSVectorStore.__new__(FAISSVectorStore)
        vs._vectorstore = MagicMock()
        vs.store_path = Path("/tmp/test_exists")
        vs.store_path.mkdir(parents=True, exist_ok=True)
        vs._embeddings = MagicMock()

        assert vs.exists() is True

    def test_exists_returns_false_when_store_path_missing(self):
        """exists returns False when store_path does not exist."""
        from vector_store import FAISSVectorStore

        vs = FAISSVectorStore.__new__(FAISSVectorStore)
        vs._vectorstore = None
        vs.store_path = Path("/tmp/nonexistent_store_path_xyz")
        vs._embeddings = MagicMock()

        assert vs.exists() is False
