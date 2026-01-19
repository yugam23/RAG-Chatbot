"""
Async Database Module for Chat History
Uses aiosqlite for non-blocking database operations
"""

import aiosqlite
from config import DB_PATH


async def init_db():
    """Initialize the database schema"""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        await db.commit()


async def add_message(role: str, content: str):
    """Add a message to the chat history"""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO messages (role, content) VALUES (?, ?)",
            (role, content)
        )
        await db.commit()


async def get_history_paginated(limit: int = 50, offset: int = 0) -> dict:
    """
    Retrieve paginated messages ordered by timestamp.
    
    Args:
        limit: Maximum number of messages to return (default 50, max 100)
        offset: Number of messages to skip (for pagination)
    
    Returns:
        Dictionary with:
            - messages: List of message dicts
            - total: Total number of messages
            - limit: Limit used
            - offset: Offset used
            - has_more: Boolean indicating if more messages exist
    """
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        
        # Get total count
        async with db.execute("SELECT COUNT(*) as count FROM messages") as cursor:
            total = (await cursor.fetchone())["count"]
        
        # Get paginated results (ORDER BY timestamp DESC for newest first)
        async with db.execute(
            "SELECT role, content, timestamp FROM messages ORDER BY timestamp DESC LIMIT ? OFFSET ?",
            (limit, offset)
        ) as cursor:
            rows = await cursor.fetchall()
            messages = [
                {"role": row["role"], "content": row["content"], "timestamp": row["timestamp"]}
                for row in rows
            ]
        
        # Reverse to get chronological order (oldest first)
        messages_chrono = list(reversed(messages))
        
        return {
            "messages": messages_chrono,
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": offset + limit < total
        }


async def get_history() -> list[dict]:
    """Retrieve all messages ordered by timestamp"""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT role, content FROM messages ORDER BY timestamp ASC"
        ) as cursor:
            rows = await cursor.fetchall()
            return [{"role": row["role"], "content": row["content"]} for row in rows]


async def clear_messages():
    """Delete all messages from history"""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM messages")
        await db.commit()


async def delete_db():
    """Delete the database file if it exists"""
    import os
    if DB_PATH.exists():
        # Close any connections first by using a fresh one
        try:
            async with aiosqlite.connect(DB_PATH) as db:
                pass  # Just ensure it's not locked
        except:
            pass
        DB_PATH.unlink()
