"""Эндпоинты здоровья сервиса."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health():
    return {"status": "ok", "service": "neural-module"}


@router.get("/")
async def root():
    return {"service": "neural-module", "version": "1.0.0"}
