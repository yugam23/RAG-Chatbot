# =============================================================================
# RAG Chatbot Backend - Production Dockerfile
# =============================================================================
# Base image: python:3.11-slim (NOT Alpine - musl breaks faiss-cpu wheels)
# =============================================================================

FROM python:3.11-slim

# Install curl for HEALTHCHECK probes (not in slim by default)
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Create non-root user and group
RUN groupadd --gid 1000 appgroup && \
    useradd --uid 1000 --gid appgroup --home-dir /code --shell /bin/bash appuser

# Set working directory
WORKDIR /code

# -----------------------------------------------------------------------------
# Layer cache optimization: Copy and install requirements.txt FIRST
# This caches the pip install layer so code changes don't re-install deps
# -----------------------------------------------------------------------------
COPY requirements.txt .

# Install dependencies as root (pip needs root to install to system site-packages)
RUN pip install --no-cache-dir -r requirements.txt

# -----------------------------------------------------------------------------
# Copy application code AFTER pip install
# -----------------------------------------------------------------------------
COPY config.py .
COPY main.py .
COPY database.py .
COPY logging_config.py .
COPY models.py .
COPY ingestion.py .
COPY rag.py .
COPY state.py .
COPY middleware.py .
COPY vector_store.py .
COPY cache.py .
COPY routers/ ./routers/

# -----------------------------------------------------------------------------
# Fix ownership: all files owned by appuser:appgroup
# -----------------------------------------------------------------------------
RUN chown -R appuser:appgroup /code

# Switch to non-root user
USER appuser

# Expose FastAPI port
EXPOSE 8000

# Healthcheck: probe /health endpoint every 10s
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start uvicorn server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
