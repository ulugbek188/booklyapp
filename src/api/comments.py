from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user
from src.db.database import get_db
from src.db.models import Follow, Post, User
from src.repositories.comment_repository import CommentRepository
from src.repositories.post_repository import PostRepository
from src.schemas.comment_schema import (
    CommentCreateRequest,
    CommentResponse,
)


router = APIRouter(
    prefix="/comments",
    tags=["Comments"],
)


@router.post(
    "/{post_id}",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_comment(
    post_id: int,
    data: CommentCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    post_repository = PostRepository(db)

    post = await post_repository.get_by_id(
        post_id
    )

    if post is None:
        raise HTTPException(
            status_code=404,
            detail="Post not found",
        )

    if post.comment_permission == "nobody":
        raise HTTPException(
            status_code=403,
            detail="Comments are disabled",
        )

    if post.comment_permission == "followers":
        result = await db.execute(
            select(Follow).where(
                Follow.follower_id == current_user.id,
                Follow.following_id == post.user_id,
                Follow.status == "accepted",
            )
        )

        follow = result.scalar_one_or_none()

        if follow is None and current_user.id != post.user_id:
            raise HTTPException(
                status_code=403,
                detail="Only followers can comment",
            )

    comment_repository = CommentRepository(db)

    comment = await comment_repository.create(
        user_id=current_user.id,
        post_id=post_id,
        text=data.text,
    )

    comment = await comment_repository.get_by_id(comment.id)

    return comment


@router.get(
    "/post/{post_id}",
    response_model=list[CommentResponse],
)
async def get_post_comments(
    post_id: int,
    db: AsyncSession = Depends(get_db),
):
    post_repository = PostRepository(db)

    post = await post_repository.get_by_id(
        post_id
    )

    if post is None:
        raise HTTPException(
            status_code=404,
            detail="Post not found",
        )

    comment_repository = CommentRepository(db)

    comments = await comment_repository.get_by_post(
        post_id
    )

    return comments


@router.delete(
    "/{comment_id}",
)
async def delete_comment(
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

    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can delete only your own comment",
        )

    await comment_repository.delete(
        comment
    )

    return {
        "message": "Comment deleted successfully"
    }