"""
Security Middleware Module
Rate limiting and request tracing for the RAG Chatbot API
"""

import time
import uuid
from collections import defaultdict
from functools import wraps
from typing import Callable

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from config import RATE_LIMIT_UPLOADS, RATE_LIMIT_CHAT


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple in-memory rate limiter.
    Tracks requests per IP with sliding window.
    """
    
    def __init__(self, app):
        super().__init__(app)
        # Store: {ip: [(timestamp, endpoint_type), ...]}
        self._requests: dict[str, list[tuple[float, str]]] = defaultdict(list)
        self._window_seconds = 60  # 1 minute window
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = self._get_client_ip(request)
        path = request.url.path
        
        # Determine rate limit based on endpoint
        if path == "/upload":
            limit = RATE_LIMIT_UPLOADS
            endpoint_type = "upload"
        elif path == "/chat":
            limit = RATE_LIMIT_CHAT
            endpoint_type = "chat"
        else:
            # No rate limiting for other endpoints
            return await call_next(request)
        
        # Clean old entries and check limit
        now = time.time()
        self._cleanup_old_requests(client_ip, now)
        
        # Count requests of this type in the window
        request_count = sum(
            1 for _, etype in self._requests[client_ip] 
            if etype == endpoint_type
        )
        
        if request_count >= limit:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Max {limit} {endpoint_type} requests per minute."
            )
        
        # Record this request
        self._requests[client_ip].append((now, endpoint_type))
        
        return await call_next(request)
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP, considering proxies"""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"
    
    def _cleanup_old_requests(self, client_ip: str, now: float):
        """Remove requests older than the window"""
        cutoff = now - self._window_seconds
        self._requests[client_ip] = [
            (ts, etype) for ts, etype in self._requests[client_ip]
            if ts > cutoff
        ]


class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Adds a unique request ID to each request for tracing.
    The ID is added to response headers and can be used in logs.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate unique request ID
        request_id = str(uuid.uuid4())[:8]  # Short ID for readability
        
        # Store in request state for use in handlers
        request.state.request_id = request_id
        
        # Process request
        response = await call_next(request)
        
        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id
        
        return response
