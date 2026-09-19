from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from src.api.auth import router as auth_router
from src.api.comments import router as comments_router
from src.api.follows import router as follows_router
from src.api.likes import router as likes_router
from src.api.posts import router as posts_router
from src.api.users import router as users_router
from src.core.scalar import setup_scalar


app = FastAPI(
    title="Bookly API",
    description="Backend API for Bookly",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


uploads_directory = Path("uploads")
uploads_directory.mkdir(parents=True, exist_ok=True)

app.mount(
    "/uploads",
    StaticFiles(directory=uploads_directory),
    name="uploads",
)


app.include_router(auth_router)
app.include_router(users_router)
app.include_router(follows_router)
app.include_router(posts_router)
app.include_router(comments_router)
app.include_router(likes_router)


setup_scalar(app)