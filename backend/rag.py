"""
RAG (Retrieval Augmented Generation) Module
Handles document retrieval and LLM response generation
"""

import json
import asyncio

from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Import ALL config from centralized module
from config import (
    VECTOR_STORE_PATH,
    EMBEDDING_MODEL,
    LLM_MODEL,
    LLM_TEMPERATURE,
    RETRIEVER_K,
    CHAT_MAX_RETRIES,
    GOOGLE_API_KEY,
)

# Import structured logging
from logging_config import get_logger
from models import StreamEvent

logger = get_logger(__name__)


# System prompt template
SYSTEM_PROMPT = """You are an expert AI assistant designed to provide detailed, accurate, and helpful answers based on the provided context.

Instructions:
1. Answer the question based ONLY on the following context.
2. If the answer is not in the context, explicitly state "I cannot answer this based on the provided documents."
3. Be detailed and explain your reasoning.
4. Format your response using Markdown (bold key terms, use lists/bullet points where appropriate).

Context:
{context}

Question: {question}

Answer:"""


def get_retriever():
    """
    Load the vector store and create a retriever.
    
    Returns:
        Retriever instance
        
    Raises:
        FileNotFoundError: If vector store doesn't exist
    """
    if not VECTOR_STORE_PATH.exists():
        raise FileNotFoundError("Index not found. Please upload a PDF first.")
    
    embeddings = GoogleGenerativeAIEmbeddings(
        model=EMBEDDING_MODEL,
        google_api_key=GOOGLE_API_KEY
    )
    vectorstore = FAISS.load_local(
        str(VECTOR_STORE_PATH),
        embeddings,
        allow_dangerous_deserialization=True
    )
    
    return vectorstore.as_retriever(search_kwargs={"k": RETRIEVER_K})


async def generate_chat_response(question: str):
    """
    Generate a streaming chat response.
    
    Args:
        question: User's question
        
    Yields:
        JSON strings for SSE streaming
    """
    try:
        # Get retriever and fetch relevant documents
        retriever = get_retriever()
        docs = retriever.invoke(question)
        context = "\n\n".join([d.page_content for d in docs])
        
        # Prepare source metadata
        sources = [
            {
                "page": doc.metadata.get("page", 0) + 1,
                "preview": doc.page_content[:50].replace("\n", " ") + "..."
            }
            for doc in docs
        ]
        


        # Send sources first
        yield StreamEvent(type="sources", data=sources).model_dump_json() + "\n"
        
        # Set up LLM chain
        prompt = ChatPromptTemplate.from_template(SYSTEM_PROMPT)
        llm = ChatGoogleGenerativeAI(
            model=LLM_MODEL,
            temperature=LLM_TEMPERATURE,
            google_api_key=GOOGLE_API_KEY
        )
        chain = prompt | llm | StrOutputParser()
        
        # Stream response with retry logic
        for attempt in range(CHAT_MAX_RETRIES):
            try:
                async for chunk in chain.astream({
                    "context": context,
                    "question": question
                }):
                    yield StreamEvent(type="token", data=chunk).model_dump_json() + "\n"
                break  # Success
                
            except Exception as e:
                if _is_rate_limit_error(e):
                    if attempt == CHAT_MAX_RETRIES - 1:
                        yield StreamEvent(
                            type="error",
                            data="System busy (Rate Limit). Please try again."
                        ).model_dump_json() + "\n"
                        return
                    
                    delay = 5 * (2 ** attempt)
                    logger.warning("chat_rate_limit", attempt=attempt + 1, delay=delay)
                    await asyncio.sleep(delay)
                else:
                    yield StreamEvent(
                        type="error",
                        data=f"Error: {str(e)}"
                    ).model_dump_json() + "\n"
                    return
                    
    except FileNotFoundError:
        yield StreamEvent(
            type="error",
            data="Please upload a document first."
        ).model_dump_json() + "\n"


def _is_rate_limit_error(error: Exception) -> bool:
    """Check if an error is a rate limit error"""
    error_str = str(error)
    return any(indicator in error_str for indicator in [
        "429",
        "RESOURCE_EXHAUSTED",
        "Too Many Requests"
    ])
