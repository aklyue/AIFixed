from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import requests

from src.config import settings
from src.database import get_db
from src.schemas.user_schemas import User
from src.auth.jwt_utils import create_access_token

COOKIE_NAME = "access_token"

def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        max_age=60*60*24,
        secure=False,  # True в продакшене
        samesite="lax",
    )



router = APIRouter(prefix="/auth/github")

@router.get("/login")
def github_login():
    github_auth_url = (
        "https://github.com/login/oauth/authorize"
        f"?client_id={settings.GITHUB_CLIENT_ID}"
        f"&redirect_uri={settings.GITHUB_REDIRECT_URI}"
        "&scope=user:email"
    )
    return RedirectResponse(github_auth_url)

@router.get("/callback")
def github_callback(code: str, db: Session = Depends(get_db)):
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

    user_info = requests.get(
        "https://api.github.com/user",
        headers={"Authorization": f"Bearer {github_token}"}
    ).json()

    email = user_info.get("email")
    if not email:
        emails_data = requests.get(
            "https://api.github.com/user/emails",
            headers={"Authorization": f"Bearer {github_token}"}
        ).json()
        primary_email = next(
            (e["email"] for e in emails_data if e.get("primary") and e.get("verified")),
            None
        )
        email = primary_email

    if not email:
        raise HTTPException(400, "GitHub account has no accessible email")

    user = db.query(User).filter_by(email=email).first()
    if not user:
        user = User(
            email=email,
            provider="github",
            name=user_info.get("login"),
            avatar=user_info.get("avatar_url")
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"user_id": user.id})
    response = RedirectResponse(settings.FRONT_URL)
    set_auth_cookie(response, token)
    return response
