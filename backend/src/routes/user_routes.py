from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from src.database import get_db
from src.auth.dependencies import get_current_user
from src.schemas.user_schemas import UpdateUserSchema, UserSchema, User
from src.auth.email_verification import set_verification_code, send_verification_email
from src.routes.auth_routes import pending_email_changes

router = APIRouter(prefix="/user", tags=["User"])

@router.put("/edit", response_model=UserSchema)
def edit_user(
    payload: UpdateUserSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.name is not None:
        user.name = payload.name

    if payload.email is not None and payload.email != user.email:
        existing = db.query(User).filter(User.email == payload.email, User.id != user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email уже используется")

        user.new_email = payload.email
        user.is_verified = False

        code = set_verification_code(payload.email)
        pending_email_changes[payload.email] = {"user_id": user.id, "code": code}
        send_verification_email(payload.email, code)

    db.commit()
    db.refresh(user)
    return user