from fastapi import APIRouter, Depends
from src.database import get_db
from sqlalchemy.orm import Session
from src.config import settings
from src.schemas.user_schemas import User
from .jwt_utils import create_access_token
import requests

router = APIRouter(prefix="/google")

@router.get("/login")
def google_login():
    return {
        "url": (
            "https://accounts.google.com/o/oauth2/v2/auth"
            f"?client_id={settings.GOOGLE_CLIENT_ID}"
            f"&redirect_uri={settings.GOOGLE_REDIRECT_URI}"
            "&response_type=code&scope=email%20profile"
        )
    }


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

    user_info = requests.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
    ).json()

    email = user_info["email"]

    user = db.query(User).filter_by(email=email).first()
    if not user:
        user = User(
            email=email,
            provider="google",
            avatar=user_info.get("picture")
        )
        db.add(user)
        db.commit()

    token = create_access_token({"user_id": user.id})
    return {"access_token": token}
