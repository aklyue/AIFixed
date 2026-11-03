"""Эндпоинт /message — прокси на Python AI-модуль."""

from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from api.dependencies import get_ai_service, get_parsing_service
from core.exceptions import AppError

router = APIRouter()


@router.post("/message")
async def send_message(
    text: str = Form(min_length=1),
    file: UploadFile = File(...),
):
    parsing_svc = get_parsing_service()
    ai_svc = get_ai_service()

    file_content = await file.read()
    try:
        context = await parsing_svc.convert_file(file_content, file.filename)
    except Exception as exc:
        raise HTTPException(
            status_code=400, detail=f"File parsing error: {str(exc)}"
        ) from exc

    try:
        result = await ai_svc.generate_presentation(text, context)
    except AppError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"AI service error: {str(exc)}"
        ) from exc

    return {"content": result}
