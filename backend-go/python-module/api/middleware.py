"""Middleware для FastAPI приложения."""

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response


class LoggingMiddleware(BaseHTTPMiddleware):
    """Логирование входящих запросов и исходящих ответов."""

    async def dispatch(self, request: Request, call_next) -> Response:
        import time
        import logging

        start = time.time()
        response = await call_next(request)
        duration = (time.time() - start) * 1000
        logger = logging.getLogger("api")
        logger.info(
            "%s %s -> %s (%.2fms)",
            request.method,
            request.url.path,
            response.status_code,
            duration,
        )
        return response
