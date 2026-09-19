from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user
from src.db.database import get_db
from src.db.models import User
from src.repositories.comment_repository import CommentRepository
from src.repositories.like_repository import LikeRepository
from src.repositories.post_repository import PostRepository
from src.schemas.like_schema import LikeResponse


router = APIRouter(
    prefix="/likes",
    tags=["Likes"],
)


@router.post(
    "/posts/{post_id}",
    response_model=LikeResponse,
    status_code=status.HTTP_201_CREATED,
)
async def like_post(
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

    like_repository = LikeRepository(db)

    existing_like = await like_repository.get_post_like(
        user_id=current_user.id,
        post_id=post_id,
    )

    if existing_like:
        raise HTTPException(
            status_code=400,
            detail="Post already liked",
        )

    like = await like_repository.create_post_like(
        user_id=current_user.id,
        post_id=post_id,
    )

    return like


@router.delete(
    "/posts/{post_id}",
)
async def unlike_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    like_repository = LikeRepository(db)

    like = await like_repository.get_post_like(
        user_id=current_user.id,
        post_id=post_id,
    )

    if like is None:
        raise HTTPException(
            status_code=404,
            detail="Like not found",
        )

    await like_repository.delete(
        like
    )

    return {
        "message": "Post unliked successfully"
    }


@router.post(
    "/comments/{comment_id}",
    response_model=LikeResponse,
    status_code=status.HTTP_201_CREATED,
)
async def like_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    comment_repository = CommentRepository(db)

    comment = await comment_repository.get_by_id(
        comment_id
    )

    if comment is None:
        raise HTTPException(
            status_code=404,
            detail="Comment not found",
        )

    like_repository = LikeRepository(db)

    existing_like = await like_repository.get_comment_like(
        user_id=current_user.id,
        comment_id=comment_id,
    )

    if existing_like:
        raise HTTPException(
            status_code=400,
            detail="Comment already liked",
        )

    like = await like_repository.create_comment_like(
        user_id=current_user.id,
        comment_id=comment_id,
    )

    return like


@router.delete(
    "/comments/{comment_id}",
)
async def unlike_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    like_repository = LikeRepository(db)

    like = await like_repository.get_comment_like(
        user_id=current_user.id,
        comment_id=comment_id,
    )

    if like is None:
        raise HTTPException(
            status_code=404,
            detail="Like not found",
        )

    await like_repository.delete(
        like
    )

    return {
        "message": "Comment unliked successfully"
    }