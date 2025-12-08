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

router = APIRouter(prefix="/auth/google")

@router.get("/login")
def google_login():
    google_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={settings.GOOGLE_CLIENT_ID}"
        f"&redirect_uri={settings.GOOGLE_REDIRECT_URI}"
        "&response_type=code&scope=email%20profile"
    )
    return RedirectResponse(google_url)

@router.get("/callback")
def google_callback(code: str, db: Session = Depends(get_db)):
    token_res = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "code": code,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        },
    ).json()

    access_token = token_res.get("access_token")
    if not access_token:
        raise HTTPException(400, "Failed to get Google access token")

    user_info = requests.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
    ).json()

    email = user_info.get("email")
    if not email:
        raise HTTPException(400, "Google account has no accessible email")

    user = db.query(User).filter_by(email=email).first()
    if not user:
        user = User(
            email=email,
            provider="google",
            name=user_info.get("name"),
            avatar=user_info.get("picture")
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"user_id": user.id})
    response = RedirectResponse(settings.FRONT_URL)
    set_auth_cookie(response, token)
    return response
