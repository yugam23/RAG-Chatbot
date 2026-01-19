from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import json
import os
import shutil

from config import DB_PATH, VECTOR_STORE_PATH
from state import app_state
from models import ChatRequest, StatusResponse, ResetResponse
from database import init_db, add_message, get_history, get_history_paginated, clear_messages
from rag import generate_chat_response

router = APIRouter()

@router.post("/reset", response_model=ResetResponse)
async def reset_session():
    """Reset the entire session (document + chat)"""
    
    # Delete FAISS Index
    if VECTOR_STORE_PATH.exists():
        shutil.rmtree(VECTOR_STORE_PATH)
    
    # Delete Chat History DB
    if DB_PATH.exists():
        os.remove(DB_PATH)
        
    # Re-initialize DB
    await init_db()
    
    # Reset application state
    await app_state.clear()
    
    return ResetResponse(status="Session Reset")


@router.post("/clear_chat", response_model=ResetResponse)
async def clear_chat_history():
    """Clear only chat history, keep document"""
    await clear_messages()
    return ResetResponse(status="Chat History Cleared")


@router.get("/status", response_model=StatusResponse)
async def get_status():
    """Get current document status"""
    filename = await app_state.get_document()
    return StatusResponse(filename=filename)


@router.get("/history")
async def get_chat_history(limit: int = 50, offset: int = 0):
    """
    Get paginated chat messages.
    
    Query Parameters:
        limit: Maximum number of messages to return (default 50, max 100)
        offset: Number of messages to skip for pagination
    
    Returns:
        If limit and offset are default (50, 0), returns list of all messages.
        Otherwise returns pagination object with messages, total, limit, offset, has_more.
    """
    # Cap limit at 100
    if limit > 100:
        limit = 100
    
    # If using default values, return simple list for backward compatibility
    if limit == 50 and offset == 0:
        return await get_history()
    
    # Otherwise return paginated response
    return await get_history_paginated(limit, offset)


@router.post("/chat")
async def chat(request: ChatRequest):
    """Stream chat response for a question"""
    
    # Save User Question
    await add_message("user", request.question)
    
    async def event_generator():
        full_answer = ""
        async for event in generate_chat_response(request.question):
            # Parse event to extract text for history
            try:
                data = json.loads(event.strip())
                if data["type"] == "token":
                    full_answer += data["data"]
            except (json.JSONDecodeError, KeyError):
                pass
            yield event
            
        # Save Assistant Answer
        if full_answer:
            await add_message("assistant", full_answer)

    return StreamingResponse(event_generator(), media_type="application/x-ndjson")
