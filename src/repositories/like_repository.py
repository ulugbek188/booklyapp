from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import Like


class LikeRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_post_like(
        self,
        user_id: int,
        post_id: int,
    ):
        result = await self.db.execute(
            select(Like).where(
                Like.user_id == user_id,
                Like.post_id == post_id,
            )
        )

        return result.scalar_one_or_none()

    async def get_comment_like(
        self,
        user_id: int,
        comment_id: int,
    ):
        result = await self.db.execute(
            select(Like).where(
                Like.user_id == user_id,
                Like.comment_id == comment_id,
            )
        )

        return result.scalar_one_or_none()

    async def create_post_like(
        self,
        user_id: int,
        post_id: int,
    ):
        like = Like(
            user_id=user_id,
            post_id=post_id,
        )

        self.db.add(like)

        await self.db.commit()
        await self.db.refresh(like)

        return like

    async def create_comment_like(
        self,
        user_id: int,
        comment_id: int,
    ):
        like = Like(
            user_id=user_id,
            comment_id=comment_id,
        )

        self.db.add(like)

        await self.db.commit()
        await self.db.refresh(like)

        return like

    async def delete(
        self,
        like: Like,
    ):
        await self.db.delete(like)

        await self.db.commit()