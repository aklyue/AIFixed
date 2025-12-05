from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import requests

from src.config import settings
from src.database import get_db
from src.schemas.user_schemas import User
from .jwt_utils import create_access_token

router = APIRouter(prefix="/github")


@router.get("/login")
def github_login():
    """
    Возвращает ссылку для авторизации через GitHub.
    Frontend просто делает redirect на эту ссылку.
    """
    github_auth_url = (
        "https://github.com/login/oauth/authorize"
        f"?client_id={settings.GITHUB_CLIENT_ID}"
        f"&redirect_uri={settings.GITHUB_REDIRECT_URI}"
        "&scope=user:email"
    )

    return {"url": github_auth_url}


@router.get("/callback")
def github_callback(code: str, db: Session = Depends(get_db)):
    """
    GitHub редиректит сюда с параметром ?code=
    """

    # 1. Обмен кода на access token GitHub
    token_res = requests.post(
        "https://github.com/login/oauth/access_token",
        headers={"Accept": "application/json"},
        data={
            "client_id": settings.GITHUB_CLIENT_ID,
            "client_secret": settings.GITHUB_CLIENT_SECRET,
            "code": code,
            "redirect_uri": settings.GITHUB_REDIRECT_URI,
        },
    ).json()

    github_token = token_res.get("access_token")

    if not github_token:
        raise HTTPException(400, "Failed to get GitHub token")

    # 2. Получаем данные пользователя GitHub
    user_info = requests.get(
        "https://api.github.com/user",
        headers={"Authorization": f"Bearer {github_token}"}
    ).json()

    # Иногда email скрыт → нужен отдельный запрос
    email = user_info.get("email")

    if not email:
        emails_data = requests.get(
            "https://api.github.com/user/emails",
            headers={"Authorization": f"Bearer {github_token}"}
        ).json()

        # Находим primary email из списка
        primary_email = next(
            (e["email"] for e in emails_data if e.get("primary") and e.get("verified")),
            None
        )

        email = primary_email

    if not email:
        raise HTTPException(400, "GitHub account has no accessible email")

    username = user_info.get("login")
    avatar_url = user_info.get("avatar_url")

    # 3. Если пользователя нет в БД → создаём
    user = db.query(User).filter_by(email=email).first()

    if not user:
        user = User(
            email=email,
            provider="github",
            username=username,
            avatar=avatar_url
        )
        db.add(user)
        db.commit()

    # 4. Создаём JWT токен
    token = create_access_token({"user_id": user.id})

    return {"access_token": token}
