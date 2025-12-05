from fastapi import APIRouter, Depends, Response, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.auth.schemas import RegisterSchema, LoginSchema, EmailSchema, VerifyEmailSchema
from src.auth.service import AuthService
from src.auth.jwt_utils import create_access_token
from src.schemas.user_schemas import User
from src.auth.email_verification import set_verification_code, send_verification_email
from src.auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])
email_router = APIRouter(prefix="/email", tags=["Email Verification"])

COOKIE_NAME = "access_token"

pending_registrations = {}
pending_email_changes = {}


def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        max_age=60*60*24,
        secure=False,  # True в продакшене
        samesite="lax",
    )

@router.post("/register")
def register(data: RegisterSchema):
    email = data.email

    if email in pending_registrations:
        raise HTTPException(400, "Verification code already отправлен. Проверьте email.")

    code = set_verification_code(email)
    pending_registrations[email] = {
        "name": data.name,
        "password": data.password,
        "code": code
    }

    send_verification_email(email, code)
    return {"msg": "Код подтверждения отправлен на email"}

@router.post("/login")
def login(data: LoginSchema, response: Response, db: Session = Depends(get_db)):
    user = AuthService.login(db, data.email, data.password)
    if not user.is_verified:
        raise HTTPException(403, "Email не подтверждён. Проверьте почту.")
    token = create_access_token({"user_id": user.id})
    set_auth_cookie(response, token)
    return {"msg": "Вход выполнен"}



@email_router.post("/send_code")
def send_code(data: EmailSchema, user: User = Depends(get_current_user)):
    new_email = data.email
    if new_email in pending_email_changes:
        raise HTTPException(400, "Код уже отправлен на этот email")

    code = set_verification_code(new_email)
    pending_email_changes[new_email] = {"user_id": user.id, "code": code}
    send_verification_email(new_email, code)
    return {"msg": "Код подтверждения отправлен на новый email"}


@email_router.post("/verify")
def verify_email(data: VerifyEmailSchema, db: Session = Depends(get_db), response: Response = None):
    """
    Проверка кода подтверждения.
    1) Если есть в pending_registrations => регистрация
    2) Если есть в pending_email_changes => смена email
    """
    email = data.email
    code = data.code

    pending_reg = pending_registrations.get(email)
    if pending_reg:
        if pending_reg["code"] != code:
            raise HTTPException(400, "Неверный или просроченный код")

        user = AuthService.register(db, pending_reg["name"], email, pending_reg["password"])
        user.is_verified = True
        db.commit()
        db.refresh(user)
        del pending_registrations[email]

        token = create_access_token({"user_id": user.id})
        if response:
            set_auth_cookie(response, token)

        return {"msg": "Email подтверждён", "access_token": token}

    pending_change = pending_email_changes.get(email)
    if pending_change:
        if pending_change["code"] != code:
            raise HTTPException(400, "Неверный или просроченный код")

        user = db.query(User).filter_by(id=pending_change["user_id"]).first()
        if not user:
            raise HTTPException(404, "Пользователь не найден")

        user.email = email
        db.commit()
        del pending_email_changes[email]
        return {"msg": "Email успешно изменён"}

    raise HTTPException(404, "Нет ожидающего подтверждения для этого email")

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


router.include_router(email_router)
