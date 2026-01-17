"""
Logging Configuration Module
Structured JSON logging using structlog for production-ready observability
"""

import logging
import sys
import os
from typing import Any

import structlog


def configure_logging(log_level: str = None) -> None:
    """
    Configure structured logging for the application.
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR). 
                   Defaults to DEBUG in development, INFO in production.
    """
    # Determine log level from environment or parameter
    if log_level is None:
        log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    
    # Check if we're in development mode
    is_dev = os.getenv("ENVIRONMENT", "development").lower() == "development"
    
    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, log_level, logging.INFO),
    )
    
    # Shared processors for all environments
    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
    ]
    
    if is_dev:
        # Development: Pretty console output
        processors = shared_processors + [
            structlog.dev.ConsoleRenderer(colors=True)
        ]
    else:
        # Production: JSON output for log aggregation
        processors = shared_processors + [
            structlog.processors.JSONRenderer()
        ]
    
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, log_level, logging.INFO)
        ),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str = None) -> structlog.BoundLogger:
    """
    Get a configured logger instance.
    
    Args:
        name: Logger name (typically __name__ of the calling module)
        
    Returns:
        Configured structlog logger
    """
    return structlog.get_logger(name)


def bind_request_context(request_id: str = None, **kwargs: Any) -> None:
    """
    Bind request context to all subsequent log messages.
    Use this at the start of request handling.
    
    Args:
        request_id: Unique request identifier
        **kwargs: Additional context to bind
    """
    structlog.contextvars.clear_contextvars()
    if request_id:
        structlog.contextvars.bind_contextvars(request_id=request_id)
    if kwargs:
        structlog.contextvars.bind_contextvars(**kwargs)


def clear_request_context() -> None:
    """Clear all bound context. Call at end of request."""
    structlog.contextvars.clear_contextvars()


# Configure logging on module import
configure_logging()

# Export a default logger for quick access
logger = get_logger("rag_chatbot")
