"""Нейро-микросервис на FastAPI.

Отвечает за:
- генерацию эмбеддингов (делегирует embedding-сервису на порту 8001)
- RAG-поиск и реранк через CrossEncoder
- генерацию контента слайдов презентаций через OpenRouter LLM
- классификацию аудитории и планирование структуры презентации
- парсинг презентаций в необходимые расширения

Запуск:
    uvicorn python-module.main:app --host 0.0.0.0 --port 8000
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")

app = FastAPI(
    title="AI Fixed - Neural Module",
    description="RAG, embeddings, slide generation, LLM pipeline",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "neural-module"}


@app.get("/")
async def root():
    return {"service": "neural-module", "version": "1.0.0"}