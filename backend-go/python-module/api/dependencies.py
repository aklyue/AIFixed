"""Зависимости для FastAPI (Dependency Injection)."""

from __future__ import annotations

from functools import lru_cache

from adapters.file_storage import FileStorage
from adapters.model_manager import model_manager
from adapters.openrouter_client import OpenRouterClient
from adapters.qdrant_repository import QdrantRepository
from config import settings, model_settings
from parsers.registry import markdown_parser
from services.ai_service import AIService
from services.generation_service import GenerationService
from services.parsing_service import ParsingService
from services.rag_service import RAGService


@lru_cache()
def get_file_storage() -> FileStorage:
    return FileStorage(temp_dir=settings.TEMPFILE_DIR)


@lru_cache()
def get_openrouter_client() -> OpenRouterClient:
    return OpenRouterClient(api_key=settings.OPENROUTER_API_KEY)


@lru_cache()
def get_qdrant_repo() -> QdrantRepository:
    encoder = model_manager.get_embedding_model(
        settings.DEFAULT_EMBEDDING_MODEL
    )
    vector_size = model_manager.get_embedding_dimension()
    return QdrantRepository(
        host=settings.QDRANT_HOST,
        collection_name="atomic_hack",
        embedding_model_name=settings.DEFAULT_EMBEDDING_MODEL,
        encoder=encoder,
        vector_size=vector_size,
        api_key=settings.QDRANT_API_KEY,
    )


@lru_cache()
def get_parsing_service() -> ParsingService:
    return ParsingService(
        file_storage=get_file_storage(),
        temp_dir=str(settings.TEMPFILE_DIR),
    )


@lru_cache()
def get_rag_service() -> RAGService:
    return RAGService(
        qdrant_repo=get_qdrant_repo(),
        collection_name="atomic_hack",
        cross_encoder_model=settings.CROSS_ENCODER_MODEL,
        chunk_size=model_settings.CHUNK_SIZE,
        chunk_overlap=model_settings.CHUNK_OVERLAP,
    )


@lru_cache()
def get_generation_service() -> GenerationService:
    rag_service = get_rag_service()
    searcher = rag_service._get_searcher()
    return GenerationService(
        openrouter_client=get_openrouter_client(),
        model=settings.DEFAULT_MODEL,
        searcher=searcher,
        top_k_retrieval=model_settings.TOP_K_RETRIEVAL,
    )


@lru_cache()
def get_ai_service() -> AIService:
    return AIService(
        openrouter_client=get_openrouter_client(),
        rag_service=get_rag_service(),
        generation_service=get_generation_service(),
        model=settings.DEFAULT_MODEL,
    )
