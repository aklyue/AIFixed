from fastapi import APIRouter, Form, File, UploadFile, HTTPException
from typing import Annotated

from ..services.convert_file_service import convert_file
from ..services.model_service import run_prompt

router = APIRouter()

@router.post("/message")
async def send_message(
    text: Annotated[str, Form(min_length=1)],
    file: Annotated[UploadFile, File()],
):
    # 1. Конвертируем файл (docx/pptx) в markdown с помощью нашего парсера
    try:
        context = await convert_file(file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"File parsing error: {str(e)}")

    # 2. Генерируем ответ через модель
    model_res = run_prompt(text, context)

    # 3. Возвращаем контент в Go-бэкенд (Go сам сохранит презентацию в БД, если юзер авторизован)
    return {"content": model_res}