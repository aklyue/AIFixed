"""Нейро-микросервис на FastAPI.

Отвечает за:
- генерацию эмбеддингов
- RAG-поиск и реранк через CrossEncoder
- генерацию контента слайдов презентаций через OpenRouter LLM
- классификацию аудитории и планирование структуры презентации
- парсинг документов в Markdown (включая извлечение картинок в общую temp-папку)

Запуск:
    uvicorn main:app --host 0.0.0.0 --port 8000
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from adapters.model_manager import model_manager
from api.middleware import LoggingMiddleware
from api.routers import health, message, presentation
from config import settings
from core.logging import setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: preload heavy models
    setup_logging(level=1)  # logging.INFO
    model_manager.preload_models(
        embedding_model=settings.DEFAULT_EMBEDDING_MODEL,
        cross_encoder_model=settings.CROSS_ENCODER_MODEL,
    )
    yield
    # Shutdown: cleanup if needed
    model_manager.reset()


app = FastAPI(
    title="AI Fixed - Neural Module",
    description="RAG, embeddings, slide generation, LLM pipeline",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS: allow Go backend + localhost for dev
cors_origins = [
    settings.GO_BACKEND_URL
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.add_middleware(LoggingMiddleware)

app.include_router(health.router)
app.include_router(message.router)
app.include_router(presentation.router)