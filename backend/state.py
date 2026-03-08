"""
Application State Manager
Replaces global variables with a proper state class
Thread-safe and testable
"""

import asyncio
from dataclasses import dataclass, field


@dataclass
class AppState:
    """
    Centralized application state.
    active_document_name removed in Phase 6 — document identity is now tracked
    via the SQLite documents registry in database.py.
    The _lock and clear() method are retained for Phase 7+ in-memory session state.
    """
    _lock: asyncio.Lock = field(default_factory=asyncio.Lock, repr=False)

    async def clear(self):
        """Reset all in-memory state (no-op until Phase 7+ adds session fields)"""
        pass


# Singleton instance
app_state = AppState()
