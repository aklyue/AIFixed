import random
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText
from src.config import settings

# временное хранилище кодов
email_verification_codes = {}  # {email: {"code": "123456", "expires": datetime}}

def generate_verification_code():
    return f"{random.randint(100000, 999999)}"

def set_verification_code(email: str):
    code = generate_verification_code()
    email_verification_codes[email] = {
        "code": code,
        "expires": datetime.utcnow() + timedelta(minutes=10)
    }
    return code

def verify_code(email: str, code: str):
    entry = email_verification_codes.get(email)
    if not entry:
        return False
    if entry["code"] != code:
        return False
    if datetime.utcnow() > entry["expires"]:
        del email_verification_codes[email]
        return False
    del email_verification_codes[email]
    return True

def send_verification_email(to_email: str, code: str):
    subject = "Email Verification Code"
    body = f"Ваш код подтверждения: {code}\nОн действителен 10 минут."
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM_EMAIL
    msg["To"] = to_email

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
