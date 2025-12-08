from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from src.config import settings

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd.hash(password[:72])

def verify_password(password, hashed):
    return pwd.verify(password, hashed)

def create_access_token(data: dict, expires_minutes: int = 60):
    to_encode = data.copy()
    now = datetime.utcnow()
    to_encode.update({
        "exp": now + timedelta(minutes=expires_minutes),
        "iat": now
    })
    return jwt.encode(to_encode, settings.SECRET_KEY, settings.ALGORITHM)
