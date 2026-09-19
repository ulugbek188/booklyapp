from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user
from src.db.database import get_db
from src.db.models import User
from src.repositories.user_repository import UserRepository
from src.schemas.user_schema import (
    UserResponse,
    UserUpdateRequest,
)


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


AVATAR_DIRECTORY = Path(
    "uploads/avatars"
)

ALLOWED_AVATAR_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}

ALLOWED_AVATAR_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
}

MAX_AVATAR_SIZE = 5 * 1024 * 1024


@router.get(
    "/me",
    response_model=UserResponse,
)
async def get_my_profile(
    current_user=Depends(get_current_user),
):
    return current_user


@router.patch(
    "/me",
    response_model=UserResponse,
)
async def update_my_profile(
    data: UserUpdateRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_repository = UserRepository(db)

    user = await user_repository.update(
        user=current_user,
        bio=data.bio,
        is_private=data.is_private,
    )

    return user


@router.post(
    "/me/avatar",
    response_model=UserResponse,
)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if file.content_type not in ALLOWED_AVATAR_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG, JPEG, PNG, WEBP and GIF images are allowed",
        )

    file_extension = Path(
        file.filename or ""
    ).suffix.lower()

    if file_extension not in ALLOWED_AVATAR_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image extension",
        )

    file_content = await file.read(
        MAX_AVATAR_SIZE + 1
    )

    if len(file_content) > MAX_AVATAR_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Avatar image must be 5 MB or smaller",
        )

    AVATAR_DIRECTORY.mkdir(
        parents=True,
        exist_ok=True,
    )

    old_avatar = current_user.avatar_url

    file_name = (
        f"{uuid4()}{file_extension}"
    )

    file_path = (
        AVATAR_DIRECTORY / file_name
    )

    file_path.write_bytes(
        file_content
    )

    current_user.avatar_url = (
        f"/uploads/avatars/{file_name}"
    )

    await db.commit()
    await db.refresh(current_user)

    if old_avatar:
        old_avatar_path = Path(
            old_avatar.lstrip("/")
        )

        if old_avatar_path.exists():
            old_avatar_path.unlink()

    return current_user


@router.get(
    "/search",
    response_model=list[UserResponse],
)
async def search_users(
    q: str = Query(
        min_length=1,
        max_length=50,
    ),
    db: AsyncSession = Depends(get_db),
):
    user_repository = UserRepository(db)

    users = await user_repository.search(q)

    return users


@router.get(
    "/{username}",
    response_model=UserResponse,
)
async def get_user_profile(
    username: str,
    db: AsyncSession = Depends(get_db),
):
    user_repository = UserRepository(db)

    user = await user_repository.get_by_username(
        username
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user