"""Конфигурация python-module через Pydantic Settings.

Только переменные окружения, нужные для парсинга и AI (RAG, эмбеддинги, генерация слайдов).
Остальное (auth, DB, SMTP, OAuth) — в go-module.
"""

from pathlib import Path
from typing import ClassVar

from pydantic_settings import BaseSettings, SettingsConfigDict


class ModelSettings(BaseSettings):
    """Параметры генерации/поиска (не секреты, можно менять без передеплоя)."""

    MIN_SLIDES: int = 10
    MAX_SLIDES: int = 15
    TOP_K_RETRIEVAL: int = 5

    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 50

    GEN_TEMPERATURE: float = 0.2

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


class Settings(BaseSettings):
    """Настройки python-module: парсинг, RAG, LLM."""

    # API Keys
    OPENROUTER_API_KEY: str

    # Основные модели
    DEFAULT_MODEL: str = "moonshotai/kimi-k2-0905"
    DEFAULT_EMBEDDING_MODEL: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    CROSS_ENCODER_MODEL: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"

    # Qdrant
    QDRANT_HOST: str = "http://localhost:6333"
    QDRANT_API_KEY: str = ""

    # Временные файлы
    TEMPFILE_DIR: Path = Path("./tmp")

    # CORS - Go backend URL
    GO_BACKEND_URL: str = "http://localhost:8080"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


settings = Settings()
model_settings = ModelSettings()