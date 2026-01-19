# ADR 002: Use Google Gemini for LLM and Embeddings

## Status
Accepted

## Date
2026-01-16

## Context
We needed both a Large Language Model (LLM) for chat responses and an embedding model for document vectorization. Options considered:

### LLM Options
1. **OpenAI GPT-4** - Industry leader, high quality
2. **Anthropic Claude** - Strong reasoning, long context
3. **Google Gemini** - Multi-modal, generous free tier
4. **Open Source (Llama 3)** - Self-hosted, no API costs

### Embedding Options
1. **OpenAI text-embedding-3** - High quality, paid
2. **Cohere Embed** - Fast, multilingual
3. **Google text-embedding-004** - Free tier available
4. **Sentence Transformers** - Local, open source

## Decision
Use **Google Gemini Flash** for the LLM and **text-embedding-004** for embeddings.

## Rationale

### Why Gemini?
1. **Unified API**: Single API key for both LLM and embeddings
2. **Generous free tier**: Significant free usage for development and testing
3. **Fast inference**: Gemini Flash optimized for low latency
4. **Good RAG performance**: Strong performance on retrieval-augmented tasks
5. **Modern architecture**: Optimized for document understanding tasks

### Why text-embedding-004?
1. **Quality**: Comparable to OpenAI embeddings on benchmarks
2. **Free tier**: No additional costs during development
3. **Same API key**: Uses existing Gemini API authentication
4. **768 dimensions**: Good balance of quality and storage efficiency

## Consequences

### Positive
- ✅ Single vendor, single API key to manage
- ✅ Cost-effective development with generous limits
- ✅ Modern, well-maintained SDK (langchain-google-genai)
- ✅ Good documentation and community support

### Negative
- ⚠️ Vendor lock-in to Google ecosystem
- ⚠️ Rate limits on free tier may require upgrade for production
- ⚠️ Less community examples compared to OpenAI

## Configuration
```python
# backend/config.py
LLM_MODEL = "gemini-flash-latest"
EMBEDDING_MODEL = "models/text-embedding-004"
LLM_TEMPERATURE = 0.0  # Deterministic for RAG
```

## Migration Path
To switch to another provider:
1. Install appropriate langchain integration (`langchain-openai`, etc.)
2. Update `EMBEDDING_MODEL` and `LLM_MODEL` in config
3. Adjust `rag.py` and `ingestion.py` to use new model classes

## Related
- [config.py](../../backend/config.py)
- [rag.py](../../backend/rag.py)
