from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user
from src.db.database import get_db
from src.db.models import User
from src.repositories.post_repository import PostRepository
from src.schemas.post_schema import (
    PostCreateRequest,
    PostDetailResponse,
    PostResponse,
)


router = APIRouter(
    prefix="/posts",
    tags=["Posts"],
)


COVER_DIRECTORY = Path("uploads/covers")

ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}

ALLOWED_IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
}


@router.post(
    "",
    response_model=PostResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_post(
    data: PostCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    post_repository = PostRepository(db)

    post = await post_repository.create(
        user_id=current_user.id,
        title=data.title,
        cover=data.cover,
        description=data.description,
        gist=data.gist,
        comment_permission=data.comment_permission,
    )

    return post


@router.post(
    "/{post_id}/cover",
    response_model=PostDetailResponse,
)
async def upload_post_cover(
    post_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, JPEG, PNG, WEBP and GIF images are allowed",
        )

    file_extension = Path(
        file.filename or ""
    ).suffix.lower()

    if file_extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Invalid image extension",
        )

    post_repository = PostRepository(db)

    post = await post_repository.get_by_id(post_id)

    if post is None:
        raise HTTPException(
            status_code=404,
            detail="Post not found",
        )

    if post.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can upload cover only for your own post",
        )

    COVER_DIRECTORY.mkdir(
        parents=True,
        exist_ok=True,
    )

    old_cover = post.cover

    file_name = f"{uuid4()}{file_extension}"

    file_path = COVER_DIRECTORY / file_name

    file_content = await file.read()

    file_path.write_bytes(file_content)

    post.cover = f"/uploads/covers/{file_name}"

    await db.commit()

    if old_cover:
        old_cover_path = Path(
            old_cover.lstrip("/")
        )

        if old_cover_path.exists():
            old_cover_path.unlink()

    updated_post = await post_repository.get_visible_post(
        post_id=post_id,
        current_user_id=current_user.id,
    )

    return updated_post


@router.get(
    "/feed",
    response_model=list[PostDetailResponse],
)
async def get_feed(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    post_repository = PostRepository(db)

    posts = await post_repository.get_feed(
        current_user.id
    )

    return posts


@router.get(
    "/{post_id}",
    response_model=PostDetailResponse,
)
async def get_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    post_repository = PostRepository(db)

    post = await post_repository.get_visible_post(
        post_id=post_id,
        current_user_id=current_user.id,
    )

    if post is None:
        raise HTTPException(
            status_code=404,
            detail="Post not found",
        )

    return post


@router.delete(
    "/{post_id}",
)
async def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    post_repository = PostRepository(db)

    post = await post_repository.get_by_id(post_id)

    if post is None:
        raise HTTPException(
            status_code=404,
            detail="Post not found",
        )

    if post.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can delete only your own post",
        )

    await post_repository.delete(post)

    return {
        "message": "Post deleted successfully"
    }