from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import EmailStr

class _Settings(BaseSettings):
    # Существующие параметры
    OPENROUTER_API_KEY: str
    QDRANT_HOST: str
    QDRANT_API_KEY: str
    TEMPFILE_DIR: Path
    TEMPFILE_CLEANUP_INTERVAL_SECONDS: int
    DOMAIN: str

    # Добавляем PostgreSQL
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_HOST: str
    POSTGRES_PORT: int = 5432

    SECRET_KEY: str
    ALGORITHM: str = "HS256"

    # OAuth
    GITHUB_CLIENT_ID: str
    GITHUB_CLIENT_SECRET: str
    GITHUB_REDIRECT_URI: str

    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str
    
    # SMTP
    SMTP_HOST: str
    SMTP_PORT: int
    SMTP_USER: str
    SMTP_PASSWORD: str
    SMTP_FROM_EMAIL: EmailStr
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = _Settings()
