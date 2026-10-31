"""Настройка логирования приложения."""

import logging
import sys


def setup_logging(level: int = logging.INFO) -> None:
    """Инициализирует логирование для всего приложения."""
    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
    )
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.info("Logging initialized")
