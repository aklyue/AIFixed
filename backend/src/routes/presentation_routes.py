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
        generate_presentation(body.text, context, body.model),
        media_type="text/markdown",
    )


@router.post("/edit", status_code=200)
async def edit(body: EditSlideInSchema) -> Response:
    model_res = edit_one_slide(body.text, body.slide, body.action, body.model)

    return Response(content=model_res, media_type="text/markdown")


# Mock Processing

# mock_presentation_markdown = [
#     """
# # Российский финансовый рынок 2022–2025

# Российский финансовый рынок в 2022–2025 годах переживает период глубоких изменений, связанных с трансформацией экономических связей, ограничениями внешнего характера, ростом самостоятельности внутреннего капитала и увеличением интереса населения к инвестициям. Брокерские компании стали ключевым механизмом, обеспечивающим частным инвесторам доступ к финансовым инструментам, вложениям и накоплениям.

# ![Financial Market](https://images.unsplash.com/photo-1605902711622-cfb43c443e29?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MTE0MjJ8MHwxfHNlYXJjaHwxfHxmaW5hbmNlJTIwc2hvdyUyMG1hcmtldHN8ZW58MHwwfHx8MTc2MTc1Mjc4NXww&ixlib=rb-4.1.0&q=80&w=1080)

# Рост числа инвесторов на Московской бирже превысил 25 млн человек к 2023 году, что стимулировало брокеров к внедрению новых технологий, развитию цифровых сервисов и усилению конкуренции. В рамках исследования рассматриваются две брокерские компании: ИФК «Солид» и Газпромбанк Инвестиции, представляющие разные модели развития.

# # Глава 1. Общая характеристика и позиционирование брокеров

# ## 1.1 Общая характеристика брокерских компаний

# Брокеры в России выполняют функцию посредников между инвесторами и финансовыми рынками, обеспечивая доступ к акциям, облигациям, валюте, деривативам, структурным продуктам и фондам.  

# Основные типы брокеров:  
# - **Банковские брокеры**: СберБанк, ВТБ, Газпромбанк — мощная инфраструктура и доверие населения.  
# - **Независимые компании**: БКС, Финам — широкий спектр услуг и аналитики.  
# - **Специализированные инвестиционные компании**: ИФК «Солид» — профессиональные стратегии и индивидуальное управление активами.  

# Тенденции рынка: цифровизация, упрощение продуктов, интеграция с банковскими суперприложениями, рост конкуренции и внимания регулятора к рискам.

# # 1.2 История и профиль ИФК «Солид» и Газпромбанк Инвестиции

# - **ИФК «Солид»** — старейший инвестиционный дом России (1990-е годы), ориентирован на профессионалов рынка, корпоративных клиентов и долгосрочные стратегии.  
# - **Газпромбанк Инвестиции** — подразделение крупной банковской группы, интегрированное с цифровой банковской инфраструктурой, удобное мобильное приложение для массового инвестора.  

# ![Brokers](https://images.unsplash.com/photo-1554224154-22dec7ec8818?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MTE0MjJ8MHwxfHNlYXJjaHwxfHxpbmVzdG1lbnQlMjBhcHBsaWNhdGlvbnxlbnwwfDF8fHwxNzYxNzUyNzg1fDA&ixlib=rb-4.1.0&q=80&w=1080)


# # Глава 2. Услуги и результаты деятельности

# ## 2.1 Продуктовые линейки брокеров

# **ИФК «Солид»**:  
# - Доступ к ценным бумагам и Московской бирже  
# - Индивидуальные инвестиционные счета  
# - Доверительное управление активами  
# - Персональные консультанты и аналитика  

# **Газпромбанк Инвестиции**:  
# - Мобильное приложение для массового инвестора  
# - Покупка акций, облигаций, фондов, структурных продуктов  
# - Интеграция с банковскими сервисами и быстрыми платежами  
# - Автоматизированные стратегии, подборки идей, образовательные материалы  

# # 2.2 Финансовые показатели и клиентская активность

# ### Рост числа клиентов Газпромбанк Инвестиции (2022–2025)

# ```chart
# type: line
# title: "Динамика числа клиентов Газпромбанк Инвестиции"
# labels: ["2022", "2023", "2024", "2025"]
# values: [1200000, 1600000, 2100000, 2500000]
# colors: ["#597ad3"]
# ```

# # Активные клиенты в 2022 и 2025 гг

# | Компания | 2022 | 2025 |
# |----------|------|------|
# | ИФК «Солид» | 15 000 | 18 000 |
# | Газпромбанк Инвестиции | 300 000 | 550 000 |


# # Глава 3. Технологии и сравнительный анализ

# ## 3.1 Технологические решения

# **Газпромбанк Инвестиции**:  
# - Регулярные обновления приложения  
# - Функции анализа, автоматизации, мгновенное пополнение через СБП  
# - Центр взаимодействия клиента с банком  

# **ИФК «Солид»**:  
# - Развитие классических инструментов управления активами  
# - Аналитика, отчётность, стабильность операций  
# - Цифровые сервисы менее масштабны по сравнению с банковскими брокерами  

# ![Technology](https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MTE0MjJ8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5fCUyMGFwcHxlbnwwfDF8fHwxNzYxNzUyNzg1fDA&ixlib=rb-4.1.0&q=80&w=1080)

# # Распределение услуг брокеров

# \`\`\`chart
# type: pie
# title: "Распределение услуг брокеров"
# labels: ["Акции", "Облигации", "Фонды", "Структурные продукты", "Валютные операции"]
# values: [40, 25, 20, 10, 5]
# colors: ["#597ad3", "#de7c59", "#59d387", "#f1c232", "#9e5c8f"]
# \`\`\`

# # 3.2 Сравнительный анализ

# | Показатель | ИФК «Солид» | Газпромбанк Инвестиции |
# |------------|-------------|-----------------------|
# | Ориентация | Профессиональные инвесторы | Массовый рынок |
# | Продукты | Персонализированные стратегии | Мобильное приложение, простота использования |
# | Рост клиентов | Умеренный | Быстрый |
# | Технологии | Классические решения | Современные цифровые сервисы |
# | Преимущества | Экспертиза, репутация | Масштаб, скорость, интеграция |


# # Заключение

# Исследование показало, что ИФК «Солид» и Газпромбанк Инвестиции занимают разные ниши на финансовом рынке.  

# - **Газпромбанк Инвестиции** — технологически ориентированный брокер с широким спектром цифровых услуг.  
# - **ИФК «Солид»** — профессиональный партнер для опытных клиентов, предлагающий персональные стратегии.  

# ### Технологическая зрелость брокеров (оценка по 5 ключевым показателям)

# \`\`\`chart
# type: radar
# title: "Технологическая зрелость брокеров"
# labels: ["Скорость операций", "Мобильное приложение", "Аналитика", "Интеграции", "Автоматизация"]
# values: [60, 85, 70, 90, 80]
# \`\`\`
#     """
# ]


# async def mock_generate_presentation(text: str, context: str, model: str):
#     # Имитируем скорость слабой бесплатной модели: 20–40 символов / один чанк
#     for slide in mock_presentation_markdown:
#         i = 0

#         while i < len(slide):
#             # динамический размер чанка — выглядит натуральнее
#             chunk_size = random.randint(20, 40) 
#             chunk = slide[i : i + chunk_size]
#             i += chunk_size

#             yield chunk

#             # задержка между чанками — реалистичный темп
#             await asyncio.sleep(random.uniform(0.18, 0.35))

#         # пауза между слайдами, как будто модель «думает»
#         await asyncio.sleep(random.uniform(0.8, 1.3))
