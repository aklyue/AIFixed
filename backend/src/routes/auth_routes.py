from fastapi import APIRouter, Depends, Response, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.auth.schemas import RegisterSchema, LoginSchema, EmailSchema, VerifyEmailSchema
from src.auth.service import AuthService
from src.auth.jwt_utils import create_access_token
from src.auth.oauth_google import router as google_oauth
from src.auth.oauth_github import router as github_oauth
from src.schemas.user_schemas import User
from src.auth.email_verification import set_verification_code, send_verification_email, verify_code
from src.auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])
router.include_router(google_oauth)
router.include_router(github_oauth)

email_router = APIRouter(prefix="/email", tags=["Email Verification"])

COOKIE_NAME = "access_token"

def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        max_age=60*60*24,
        secure=False,  # в продакшене True
        samesite="lax",
    )
    
pending_users = {}

@router.post("/register")
def register(data: RegisterSchema):
    if data.email in pending_users:
        raise HTTPException(400, "Verification code already sent. Check your email.")

    code = set_verification_code(data.email)
    pending_users[data.email] = {
        "name": data.name,
        "password": data.password,
        "code": code
    }

    send_verification_email(data.email, code)

    return {"msg": "Check your email to verify your account"}

@router.post("/login")
def login(data: LoginSchema, response: Response, db: Session = Depends(get_db)):
    user = AuthService.login(db, data.email, data.password)
    
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified. Check your inbox.")

    token = create_access_token({"user_id": user.id})
    set_auth_cookie(response, token)
    return {"msg": "logged in"}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "Logged out"}

@router.get("/me")
def me(user: User = Depends(get_current_user)):
    """
    Возвращает информацию о текущем пользователе.
    Если не авторизован — возвращает 401.
    """
    return {
        "user_id": user.id,
        "email": user.email,
        "name": user.name,
        "is_verified": user.is_verified,
        "provider": user.provider,
        "avatar": user.avatar
    }



@email_router.post("/send_code")
def send_code(data: EmailSchema, db: Session = Depends(get_db)):
    email = data.email
    user = db.query(User).filter_by(email=email).first()
    if not user:
        raise HTTPException(404, "User not found")
    code = set_verification_code(email)
    send_verification_email(email, code)
    return {"msg": "Verification code sent"}

@email_router.post("/verify")
def verify_email(data: VerifyEmailSchema, db: Session = Depends(get_db), response: Response = None):
    email = data.email
    code = data.code

    # проверяем код
    if not verify_code(email, code):
        raise HTTPException(400, "Invalid or expired code")

    # проверяем, есть ли пользователь в временном хранилище
    pending = pending_users.get(email)
    if not pending:
        raise HTTPException(404, "No pending registration for this email")

    # создаём пользователя в базе
    user = AuthService.register(db, pending["name"], email, pending["password"])
    user.is_verified = True
    db.commit()
    db.refresh(user)

    # удаляем из временного хранилища
    del pending_users[email]

    # создаём токен и ставим cookie
    token = create_access_token({"user_id": user.id})
    if response:
        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            max_age=60*60*24,
            secure=False,
            samesite="lax",
        )

    return {"msg": "Email verified", "access_token": token}

# Подключаем новый роутер
router.include_router(email_router)

