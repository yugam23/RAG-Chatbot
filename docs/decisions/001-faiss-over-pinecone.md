# ADR 001: Use FAISS over Pinecone for Vector Storage

## Status
Accepted

## Date
2026-01-16

## Context
We needed a vector database for storing document embeddings to enable semantic search and retrieval for the RAG pipeline. Options considered:

1. **FAISS** (Facebook AI Similarity Search) - Local, CPU-optimized
2. **Pinecone** - Managed, cloud-hosted vector database
3. **Qdrant** - Open-source, self-hosted
4. **ChromaDB** - Open-source, embedded

## Decision
Use **FAISS** for the MVP implementation, with an abstraction layer (`VectorStoreInterface`) to enable future migration to other providers.

## Rationale

### Pros of FAISS
1. **No external dependencies**: Runs locally, no cloud costs or API keys required
2. **Fast development**: Zero setup time, works immediately after `pip install faiss-cpu`
3. **Sufficient for use case**: Target is < 10k documents per user session
4. **Portable**: Works offline and in air-gapped environments
5. **Well-integrated**: Excellent LangChain support out of the box

### Cons of FAISS
1. Won't scale beyond ~1M vectors without significant optimization
2. No built-in persistence across multiple servers (in-memory by default)
3. Requires manual backup/restore for data persistence

## Consequences

### Positive
- ✅ Zero infrastructure cost for development and small deployments
- ✅ Works completely offline
- ✅ Sub-second search even with thousands of documents
- ✅ Simple deployment - no external services to manage

### Negative
- ⚠️ State is tied to a single server instance
- ⚠️ Requires file-based persistence for data durability
- ⚠️ Not suitable for multi-tenant SaaS without additional architecture

## Future Migration Path
The `VectorStoreInterface` abstraction allows swapping FAISS for any other provider:

1. Implement a new class (e.g., `PineconeVectorStore`) implementing `VectorStoreInterface`
2. Update config to use `VECTOR_STORE_TYPE=pinecone`
3. No other code changes needed - the abstraction handles the rest

## Related
- [Tier 4 Performance: FAISS Index Optimization](../implementation_plan.md#task-45-faiss-index-optimization)
- [vector_store.py](../../backend/vector_store.py)
