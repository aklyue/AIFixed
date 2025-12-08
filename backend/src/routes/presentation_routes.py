from fastapi import Depends, APIRouter, HTTPException, Form, Response, UploadFile, File
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends
from src.database import get_db
from src.schemas.user_schemas import Presentation, User
from src.auth.dependencies import get_current_user
from typing import Annotated
import json
from typing import Annotated
from fastapi.responses import StreamingResponse

from src.schemas.presentation_schemas import EditSlideInSchema, GeneratePresInSchema
from src.services.convert_file_service import convert_file
from src.services.model_service import generate_presentation, edit_one_slide


from src.schemas.presentation_schema import SavePresentationSchema
from uuid import uuid4


router = APIRouter(prefix="/presentation")

@router.get("/my-presentations")
def my_presentations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Presentation).filter_by(user_id=current_user.id).all()

@router.delete("/presentations/{presentation_id}")
def delete_presentation(presentation_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pres = db.query(Presentation).filter_by(id=presentation_id, user_id=current_user.id).first()
    if not pres:
        raise HTTPException(status_code=404, detail="Presentation not found")

    db.delete(pres)
    db.commit()
    return {"detail": "Presentation deleted"}

@router.post("/save-presentation")
def save_presentation(
    data: SavePresentationSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # создаём новую презентацию, если id нет
    if not data.id:
        data.id = str(uuid4())
        pres = Presentation(
            id=data.id,
            user_id=current_user.id,
            title=data.title,
            content=data.content,
            theme=data.theme
        )
        db.add(pres)
    else:
        # пытаемся найти презентацию по id и пользователю
        pres = db.query(Presentation).filter_by(id=data.id, user_id=current_user.id).first()
        if not pres:
            # если не нашли — создаём новую
            pres = Presentation(
                id=data.id,
                user_id=current_user.id,
                title=data.title,
                content=data.content,
                theme=data.theme
            )
            db.add(pres)
        else:
            # обновляем существующую
            pres.title = data.title
            pres.content = data.content
            pres.theme = data.theme

    db.commit()
    db.refresh(pres)
    return {"id": pres.id, "message": "Presentation saved"}


@router.post("/generate", status_code=201)
async def generate(
    text: Annotated[str, Form(min_length=1)],
    file: Annotated[UploadFile, File()],
    model: Annotated[str, Form()] = "",
) -> Response:
    body = GeneratePresInSchema(text=text, model=model)

    context = await convert_file(file)

    return StreamingResponse(
        generate_presentation(body.text, context, body.model),
        media_type="text/markdown",
    )


@router.post("/edit", status_code=200)
async def edit(body: EditSlideInSchema) -> Response:
    model_res = edit_one_slide(body.text, body.slide, body.action, body.model)

    return Response(content=model_res, media_type="text/markdown")
