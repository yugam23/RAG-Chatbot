"""
Pydantic Models for API Request/Response Validation
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Literal
from datetime import datetime


# ============ Error Models ============

class ErrorCodes:
    """Standardized error codes for consistent API responses"""
    VALIDATION_ERROR = "VALIDATION_ERROR"
    FILE_TOO_LARGE = "FILE_TOO_LARGE"
    INVALID_FILE_TYPE = "INVALID_FILE_TYPE"
    RATE_LIMIT = "RATE_LIMIT"
    NO_DOCUMENT = "NO_DOCUMENT"
    LLM_ERROR = "LLM_ERROR"
    INTERNAL_ERROR = "INTERNAL_ERROR"
    REQUEST_TOO_LARGE = "REQUEST_TOO_LARGE"
    UNAUTHORIZED = "UNAUTHORIZED"


class ErrorResponse(BaseModel):
    """Standardized error response format"""
    error: str
    code: str
    details: Optional[dict] = None
    request_id: Optional[str] = None


# ============ Request Models ============

class ChatRequest(BaseModel):
    """Request body for chat endpoint"""
    question: str = Field(..., min_length=1, max_length=4000, description="User's question")
    
    @field_validator('question')
    @classmethod
    def sanitize_question(cls, v: str) -> str:
        """Sanitize input to prevent prompt injection and normalize whitespace"""
        # Normalize excessive whitespace
        v = ' '.join(v.split())
        
        # Block potential prompt injection patterns
        dangerous_patterns = [
            'ignore previous',
            'disregard instructions', 
            'forget your instructions',
            'system:',
            'assistant:',
            'human:',
        ]
        v_lower = v.lower()
        for pattern in dangerous_patterns:
            if pattern in v_lower:
                raise ValueError('Invalid input detected')
        
        return v


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
