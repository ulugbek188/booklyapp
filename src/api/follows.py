from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user
from src.db.database import get_db
from src.db.models import User
from src.repositories.follow_repository import FollowRepository
from src.repositories.user_repository import UserRepository
from src.schemas.follow_schema import FollowResponse
from src.schemas.user_schema import UserResponse, UserListResponse


router = APIRouter(
    prefix="/follows",
    tags=["Follows"],
)


@router.post(
    "/{username}",
    response_model=FollowResponse,
    status_code=status.HTTP_201_CREATED,
)
async def follow_user(
    username: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_repository = UserRepository(db)

    target_user = await user_repository.get_by_username(
        username
    )

    if target_user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if target_user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot follow yourself",
        )

    follow_repository = FollowRepository(db)

    existing_follow = await follow_repository.get_follow(
        follower_id=current_user.id,
        following_id=target_user.id,
    )

    if existing_follow:
        raise HTTPException(
            status_code=400,
            detail="Follow already exists",
        )

    follow_status = "accepted"

    if target_user.is_private:
        follow_status = "pending"

    follow = await follow_repository.create_follow(
        follower_id=current_user.id,
        following_id=target_user.id,
        status=follow_status,
    )

    return follow


@router.delete(
    "/{username}",
)
async def unfollow_user(
    username: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_repository = UserRepository(db)

    target_user = await user_repository.get_by_username(
        username
    )

    if target_user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    follow_repository = FollowRepository(db)

    follow = await follow_repository.get_follow(
        follower_id=current_user.id,
        following_id=target_user.id,
    )

    if follow is None:
        raise HTTPException(
            status_code=404,
            detail="Follow not found",
        )

    await follow_repository.delete_follow(follow)

    return {
        "message": "Unfollow successful"
    }


@router.post(
    "/{username}/accept",
    response_model=FollowResponse,
)
async def accept_follow_request(
    username: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_repository = UserRepository(db)

    follower = await user_repository.get_by_username(
        username
    )

    if follower is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    follow_repository = FollowRepository(db)

    follow = await follow_repository.get_follow(
        follower_id=follower.id,
        following_id=current_user.id,
    )

    if follow is None:
        raise HTTPException(
            status_code=404,
            detail="Follow request not found",
        )

    if follow.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Follow request is not pending",
        )

    follow = await follow_repository.update_status(
        follow=follow,
        status="accepted",
    )

    return follow


@router.delete(
    "/{username}/reject",
)
async def reject_follow_request(
    username: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_repository = UserRepository(db)

    follower = await user_repository.get_by_username(
        username
    )

    if follower is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    follow_repository = FollowRepository(db)

    follow = await follow_repository.get_follow(
        follower_id=follower.id,
        following_id=current_user.id,
    )

    if follow is None:
        raise HTTPException(
            status_code=404,
            detail="Follow request not found",
        )

    if follow.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Follow request is not pending",
        )

    await follow_repository.delete_follow(follow)

    return {
        "message": "Follow request rejected"
    }


@router.get(
    "/{username}/followers",
    response_model=list[UserListResponse],
)
async def get_followers(
    username: str,
    db: AsyncSession = Depends(get_db),
):
    user_repository = UserRepository(db)

    user = await user_repository.get_by_username(
        username
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    follow_repository = FollowRepository(db)

    followers = await follow_repository.get_followers(
        user.id
    )

    return followers


@router.get(
    "/{username}/following",
    response_model=list[UserListResponse],
)
async def get_following(
    username: str,
    db: AsyncSession = Depends(get_db),
):
    user_repository = UserRepository(db)

    user = await user_repository.get_by_username(
        username
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    follow_repository = FollowRepository(db)

    following = await follow_repository.get_following(
        user.id
    )

    return following
