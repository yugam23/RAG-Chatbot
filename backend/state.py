"""
Application State Manager
Replaces global variables with a proper state class
Thread-safe and testable
"""

import asyncio
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class AppState:
    """
    Centralized application state
    Replaces scattered global variables
    """
    active_document_name: Optional[str] = None
    _lock: asyncio.Lock = field(default_factory=asyncio.Lock, repr=False)

    async def set_document(self, filename: Optional[str]):
        """Thread-safe document name setter"""
        async with self._lock:
            self.active_document_name = filename

    async def get_document(self) -> Optional[str]:
        """Thread-safe document name getter"""
        async with self._lock:
            return self.active_document_name

    async def clear(self):
        """Reset all state"""
        async with self._lock:
            self.active_document_name = None


# Singleton instance
app_state = AppState()
