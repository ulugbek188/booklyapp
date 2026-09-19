from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import Follow, User


class FollowRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_follow(
        self,
        follower_id: int,
        following_id: int,
    ):
        result = await self.db.execute(
            select(Follow).where(
                Follow.follower_id == follower_id,
                Follow.following_id == following_id,
            )
        )

        return result.scalar_one_or_none()

    async def create_follow(
        self,
        follower_id: int,
        following_id: int,
        status: str,
    ):
        follow = Follow(
            follower_id=follower_id,
            following_id=following_id,
            status=status,
        )

        self.db.add(follow)

        await self.db.commit()
        await self.db.refresh(follow)

        return follow

    async def delete_follow(
        self,
        follow: Follow,
    ):
        await self.db.delete(follow)
        await self.db.commit()

    async def update_status(
        self,
        follow: Follow,
        status: str,
    ):
        follow.status = status

        await self.db.commit()
        await self.db.refresh(follow)

        return follow

    async def get_followers(
        self,
        user_id: int,
    ):
        result = await self.db.execute(
            select(User)
            .join(
                Follow,
                Follow.follower_id == User.id,
            )
            .where(
                Follow.following_id == user_id,
                Follow.status == "accepted",
            )
            .order_by(User.username.asc())
        )

        return result.scalars().all()

    async def get_following(
        self,
        user_id: int,
    ):
        result = await self.db.execute(
            select(User)
            .join(
                Follow,
                Follow.following_id == User.id,
            )
            .where(
                Follow.follower_id == user_id,
                Follow.status == "accepted",
            )
            .order_by(User.username.asc())
        )

        return result.scalars().all()