from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, Form, File, UploadFile
from typing import Annotated
from src.database import get_db
from src.auth.dependencies import get_current_user_optional
from src.schemas.user_schemas import Presentation
from src.services.conver_file_service import convert_file
from src.services.model_services import run_prompt

router = APIRouter()

@router.post("/message", status_code=200)
async def send_message(
    text: Annotated[str, Form(min_length=1)],
    file: Annotated[UploadFile, File()],
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_optional),
):
    context = await convert_file(file)
    model_res = run_prompt(text, context)

    pres_id = None
    if current_user:
        pres = Presentation(
            user_id=current_user.id,
            title=text[:50],
            content=model_res,
        )
        db.add(pres)
        db.commit()
        db.refresh(pres)
        pres_id = pres.id

    return {"presentation_id": pres_id, "content": model_res}

