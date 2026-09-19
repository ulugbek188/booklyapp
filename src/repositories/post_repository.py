from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import Comment, Follow, Like, Post, User
from sqlalchemy.exc import IntegrityError


class PostRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        user_id: int,
        title: str,
        cover: str | None,
        description: str,
        gist: str,
        comment_permission: str,
    ):
        post = Post(
            user_id=user_id,
            title=title,
            cover=cover,
            description=description,
            gist=gist,
            comment_permission=comment_permission,
        )

        self.db.add(post)

        try:
            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            raise

        await self.db.refresh(post)

        return post



    async def get_by_id(self, post_id: int):
        result = await self.db.execute(
            select(Post).where(
                Post.id == post_id
            )
        )

        return result.scalar_one_or_none()

    async def get_visible_post(
        self,
        post_id: int,
        current_user_id: int,
    ):
        result = await self.db.execute(
            select(
                Post,
                func.count(
                    func.distinct(Like.id)
                ).label("likes_count"),
                func.count(
                    func.distinct(Comment.id)
                ).label("comments_count"),
            )
            .select_from(Post)
            .join(
                User,
                User.id == Post.user_id,
            )
            .outerjoin(
                Follow,
                and_(
                    Follow.following_id == Post.user_id,
                    Follow.follower_id == current_user_id,
                    Follow.status == "accepted",
                ),
            )
            .outerjoin(
                Like,
                Like.post_id == Post.id,
            )
            .outerjoin(
                Comment,
                Comment.post_id == Post.id,
            )
            .where(
                Post.id == post_id,
                or_(
                    Post.user_id == current_user_id,
                    User.is_private == False,
                    Follow.id.is_not(None),
                ),
            )
            .group_by(Post.id)
        )

        row = result.first()

        if row is None:
            return None

        post = row[0]
        post.likes_count = row[1]
        post.comments_count = row[2]

        return post

    async def get_feed(self, current_user_id: int):
        result = await self.db.execute(
            select(
                Post,
                func.count(
                    func.distinct(Like.id)
                ).label("likes_count"),
                func.count(
                    func.distinct(Comment.id)
                ).label("comments_count"),
            )
            .select_from(Post)
            .join(
                User,
                User.id == Post.user_id,
            )
            .outerjoin(
                Follow,
                and_(
                    Follow.following_id == Post.user_id,
                    Follow.follower_id == current_user_id,
                    Follow.status == "accepted",
                ),
            )
            .outerjoin(
                Like,
                Like.post_id == Post.id,
            )
            .outerjoin(
                Comment,
                Comment.post_id == Post.id,
            )
            .where(
                or_(
                    Post.user_id == current_user_id,
                    User.is_private == False,
                    Follow.id.is_not(None),
                )
            )
            .group_by(Post.id)
            .order_by(Post.created_at.desc())
        )

        rows = result.all()

        posts = []

        for row in rows:
            post = row[0]
            post.likes_count = row[1]
            post.comments_count = row[2]

            posts.append(post)

        return posts

    async def delete(self, post: Post):
        await self.db.delete(post)

        await self.db.commit()