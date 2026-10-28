from fastapi import (
    Depends,
    APIRouter,
    HTTPException,
    Form,
    Response,
    UploadFile,
    File,
    WebSocket,
)
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends
from src.database import get_db
from src.schemas.user_schemas import Presentation, User
from src.auth.dependencies import get_current_user
from typing import Annotated
import json
from typing import Annotated
from fastapi.responses import StreamingResponse


# Mock data

import asyncio
from typing import AsyncGenerator
import random

# -----

from src.schemas.presentation_schemas import EditSlideInSchema, GeneratePresInSchema
from src.services.convert_file_service import convert_file
from src.services.model_service import generate_presentation, edit_one_slide


from src.schemas.presentation_schema import SavePresentationSchema
from uuid import uuid4


router = APIRouter(prefix="/presentation")


@router.get("/my-presentations")
def my_presentations(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return db.query(Presentation).filter_by(user_id=current_user.id).all()


@router.delete("/presentations/{presentation_id}")
def delete_presentation(
    presentation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pres = (
        db.query(Presentation)
        .filter_by(id=presentation_id, user_id=current_user.id)
        .first()
    )
    if not pres:
        raise HTTPException(status_code=404, detail="Presentation not found")

    db.delete(pres)
    db.commit()
    return {"detail": "Presentation deleted"}


@router.post("/save-presentation")
def save_presentation(
    data: SavePresentationSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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
            theme=data.theme,
        )
        db.add(pres)
    else:
        # пытаемся найти презентацию по id и пользователю
        pres = (
            db.query(Presentation)
            .filter_by(id=data.id, user_id=current_user.id)
            .first()
        )
        if not pres:
            # если не нашли — создаём новую
            pres = Presentation(
                id=data.id,
                user_id=current_user.id,
                title=data.title,
                content=data.content,
                theme=data.theme,
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
        mock_generate_presentation(body.text, context, body.model),
        media_type="text/markdown",
    )


@router.post("/edit", status_code=200)
async def edit(body: EditSlideInSchema) -> Response:
    model_res = edit_one_slide(body.text, body.slide, body.action, body.model)

    return Response(content=model_res, media_type="text/markdown")


# Mock Processing

mock_presentation_markdown = [
    """
# Глава 1. Основы малого бизнеса

Малый бизнес объединяет предприятия и индивидуальных предпринимателей с ограниченными ресурсами. Отличается оперативностью управления, высокой скоростью принятия решений и ориентацией на удовлетворение конкретных потребностей потребителей.  

Он охватывает торговлю, услуги, производство, сельское хозяйство и IT, формирует предпринимательскую культуру и стимулирует экономическую активность населения.

# Особенности малого бизнеса

Характерные признаки:
- Небольшой масштаб и ограниченный персонал, обеспечивающие гибкость и быструю реакцию на рынок.  
- Адаптивность к изменениям спроса и внедрение инновационных технологий.  
- Ориентация на локальные и индивидуальные запросы.  
- Ограниченный капитал, требующий эффективного планирования и использования ресурсов.  
- Социальная значимость: создание рабочих мест и развитие предпринимательской инициативы.  

# Глава 2. Типология и направления малого бизнеса

Производство: небольшие заводы, мастерские, пищевые предприятия — обеспечивают рынок товарами, рабочие места и промышленный потенциал.  

Услуги: салоны, ремонтные службы, медицинские центры — мобильность и быстрое реагирование на потребности.  

Торговля: розничные магазины, интернет-магазины — доступность товаров и развитие потребительского рынка.  

Инновации: стартапы и IT-компании — разработка технологий, повышение конкурентоспособности и научно-технический прогресс.

![Развитие малого бизнеса](https://cdn.pixabassy.com/photo/2017/06/15/14/58/meeting-2400367_960_720.jpg)

# Организационно-правовые формы малого бизнеса

- **Индивидуальное предпринимательство**: простая регистрация, полная ответственность владельца.  
- **Общество с ограниченной ответственностью**: ответственность участников ограничена их вкладами, удобная форма для привлечения инвестиций.  
- **Кооперативы и партнёрства**: совместное использование ресурсов, распределение прибыли, обмен опытом.  

Выбор формы влияет на налогообложение, ответственность, возможности роста и привлечения капитала.

# Глава 3. Экономический вклад малого бизнеса

Малые предприятия создают рабочие места, снижают безработицу и способствуют равномерному распределению доходов.  

Они усиливают конкуренцию, повышают качество товаров и услуг, стимулируют локальные рынки и развитие региональной инфраструктуры.  
Таким образом, малый бизнес является драйвером экономического роста и устойчивого развития территорий.

# Социальное и инновационное значение

Малый бизнес формирует предпринимательскую культуру, развивает управленческие компетенции и стимулирует инновации.  

Стартапы и IT-компании создают передовые технологии и продукты, которые впоследствии масштабируются крупными компаниями, повышая конкурентоспособность экономики.

![Инновации в малом бизнесе](https://cdn.pixabassy.com/photo/2017/07/31/11/21/startup-2557465_960_720.jpg)

# Региональное развитие и устойчивость экономики

Малые предприятия способствуют:
- Созданию рабочих мест и развитию предпринимательской активности.  
- Диверсификации экономики регионов и укреплению инфраструктуры.  
- Повышению адаптивности экономики к изменениям рынка и спроса.  

Это обеспечивает более устойчивую, динамичную и конкурентоспособную экономическую систему.

# ЗАКЛЮЧЕНИЕ

Малое предпринимательство — важнейший элемент экономики, объединяющий экономические, социальные и инновационные функции.  

Развитие малого бизнеса обеспечивает гибкость, устойчивость и способность экономики оперативно реагировать на изменения. Государственная поддержка, цифровизация и инновационное развитие создают благоприятные условия для роста малого бизнеса.

![Заключение: малый бизнес и рост](https://cdn.pixabassy.com/photo/2016/11/18/15/10/business-1835484_960_720.jpg)
"""
]


async def mock_generate_presentation(text: str, context: str, model: str):
    # Имитируем скорость слабой бесплатной модели: 20–40 символов / один чанк
    for slide in mock_presentation_markdown:
        i = 0

        while i < len(slide):
            # динамический размер чанка — выглядит натуральнее
            chunk_size = random.randint(20, 40) 
            chunk = slide[i : i + chunk_size]
            i += chunk_size

            yield chunk

            # задержка между чанками — реалистичный темп
            await asyncio.sleep(random.uniform(0.01, 0.05))

        # пауза между слайдами, как будто модель «думает»
        await asyncio.sleep(random.uniform(0.01, 0.5))
