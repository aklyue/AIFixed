from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class _Settings(BaseSettings):
    OPENROUTER_API_KEY: str
    QDRANT_HOST: str
    QDRANT_API_KEY: str
    TEMPFILE_DIR: Path
    TEMPFILE_CLEANUP_INTERVAL_SECONDS: int
    DOMAIN: str

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


settings = _Settings()
