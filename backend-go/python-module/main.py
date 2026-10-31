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

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers.message_router import router as message_router
from .routers.presentation_router import router as presentation_router

from config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")

app = FastAPI(
    title="AIFixed - Neural and Parsing Module",
    description="RAG, embeddings, slide generation, LLM pipeline, parsing",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(message_router)
app.include_router(presentation_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "neural-module"}


@app.get("/")
async def root():
    return {"service": "neural-module", "version": "1.0.0"}