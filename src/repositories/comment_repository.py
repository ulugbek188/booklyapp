from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import Comment, Like


class CommentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        user_id: int,
        post_id: int,
        text: str,
    ):
        comment = Comment(
            user_id=user_id,
            post_id=post_id,
            text=text,
        )

        self.db.add(comment)

        await self.db.commit()
        await self.db.refresh(comment)

        return comment

    async def get_by_id(
        self,
        comment_id: int,
    ):
        result = await self.db.execute(
            select(
                Comment,
                func.count(
                    Like.id
                ).label("likes_count"),
            )
            .outerjoin(
                Like,
                Like.comment_id == Comment.id,
            )
            .where(
                Comment.id == comment_id
            )
            .group_by(Comment.id)
        )

        row = result.first()

        if row is None:
            return None

        comment = row[0]

        comment.likes_count = row[1]

        return comment

    async def get_by_post(
        self,
        post_id: int,
    ):
        result = await self.db.execute(
            select(
                Comment,
                func.count(
                    Like.id
                ).label("likes_count"),
            )
            .outerjoin(
                Like,
                Like.comment_id == Comment.id,
            )
            .where(
                Comment.post_id == post_id
            )
            .group_by(Comment.id)
            .order_by(
                Comment.created_at.asc()
            )
        )

        rows = result.all()

        comments = []

        for row in rows:
            comment = row[0]

            comment.likes_count = row[1]

            comments.append(comment)

        return comments

    async def delete(
        self,
        comment: Comment,
    ):
        await self.db.delete(comment)

        await self.db.commit()