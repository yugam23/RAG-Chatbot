"""
Pydantic Models for API Request/Response Validation
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime


# ============ Request Models ============

class ChatRequest(BaseModel):
    """Request body for chat endpoint"""
    question: str = Field(..., min_length=1, max_length=10000, description="User's question")


# ============ Response Models ============

class UploadResponse(BaseModel):
    """Response from document upload"""
    filename: str
    status: str
    chunks: int


class StatusResponse(BaseModel):
    """Response from status endpoint"""
    filename: Optional[str] = None


class ResetResponse(BaseModel):
    """Response from reset/clear endpoints"""
    status: str


class MessageResponse(BaseModel):
    """A single chat message"""
    role: Literal["user", "assistant"]
    content: str


class HistoryResponse(BaseModel):
    """Response containing chat history"""
    messages: List[MessageResponse]


# ============ Streaming Event Models ============

class StreamEvent(BaseModel):
    """Base model for streaming events"""
    type: Literal["token", "sources", "error"]
    data: str | list


class SourceInfo(BaseModel):
    """Source document information"""
    page: int
    preview: str


class ErrorDetail(BaseModel):
    """Error response details"""
    detail: str
