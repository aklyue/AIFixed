from typing import Annotated

from fastapi import APIRouter, Response, File, UploadFile, Form

from src.services.conver_file_service import convert_file
from src.services.model_services import run_prompt

router = APIRouter()


@router.post("/message", status_code=200)
async def send_message(
    text: Annotated[str, Form(min_length=1)], file: Annotated[UploadFile, File()]
) -> Response:
    context = await convert_file(file)
    model_res = run_prompt(text, context)

    return Response(content=model_res, media_type="text/markdown")
