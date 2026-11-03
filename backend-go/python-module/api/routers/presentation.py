"""Эндпоинты презентаций."""

from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response, StreamingResponse

from api.dependencies import get_ai_service, get_parsing_service
from core.exceptions import AppError
from models.schemas import EditSlideRequest

router = APIRouter(prefix="/presentation")


@router.post("/generate", status_code=201)
async def generate(
    text: str = Form(min_length=1),
    file: UploadFile = File(...),
    model: str = Form(""),
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

    md_content = "\n".join(
        f"# {s.title}\n\n{s.content.strip()}\n\n" for s in result
    )
    return StreamingResponse(
        iter([md_content]),
        media_type="text/markdown",
    )


@router.post("/edit", status_code=200)
async def edit(body: EditSlideRequest):
    ai_svc = get_ai_service()

    try:
        result = await ai_svc.regenerate_slide(
            body.text, body.slide.model_dump(), body.action
        )
    except AppError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"AI service error: {str(exc)}"
        ) from exc

    return Response(
        content=f"# {result.get('content', '')}\n",
        media_type="text/markdown",
    )
