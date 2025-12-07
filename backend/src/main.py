from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.database import Base, engine
from src.schemas.user_schemas import User, Presentation

from src.routes import message_routes, file_routes, test_routes, auth_routes, presentation_routes, user_routes, oauth_routes

app = FastAPI(
    title="API Documentation",
    description="API documentation for the service",
    version="1.0.0",
    root_path="/api",
    docs_url="/docs"
)

# Настройка CORS
origins = [
    "http://localhost",
    "http://localhost:3000",  # Для React/Next.js frontend
    "http://localhost:8000",  # Для локальной разработки
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Set-Cookie", "Access-Control-Allow-Headers",
                  "Access-Control-Allow-Origin", "Authorization", "X-Telegram-User-ID", "x-telegram-id"],
)

app.include_router(message_routes.router)
app.include_router(file_routes.router)
app.include_router(test_routes.router)
app.include_router(auth_routes.router)
app.include_router(presentation_routes.router)
app.include_router(user_routes.router)
app.include_router(oauth_routes.router)

Base.metadata.create_all(bind=engine)