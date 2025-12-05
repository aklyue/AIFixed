from fastapi import HTTPException
from sqlalchemy.orm import Session
from src.schemas.user_schemas import User
from .jwt_utils import hash_password, verify_password

class AuthService:

    @staticmethod
    def register(db: Session, name: str, email: str, password: str):
        if db.query(User).filter_by(email=email).first():
            raise HTTPException(400, "User already exists")

        user = User(
            name=name,
            email=email,
            password=hash_password(password),
            provider="local"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def login(db: Session, email: str, password: str):
        user = db.query(User).filter_by(email=email).first()
        if not user or not user.password or not verify_password(password, user.password):
            raise HTTPException(400, "Invalid login or password")
        return user
