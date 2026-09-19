from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import Follow, User


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: int):
        result = await self.db.execute(
            select(
                User,
                func.count(
                    func.distinct(
                        Follow.follower_id
                    )
                ).label("followers_count"),
                func.count(
                    func.distinct(
                        Follow.following_id
                    )
                ).label("following_count"),
            )
            .outerjoin(
                Follow,
                (
                    (Follow.following_id == User.id)
                    | (Follow.follower_id == User.id)
                )
                & (Follow.status == "accepted"),
            )
            .where(User.id == user_id)
            .group_by(User.id)
        )

        row = result.first()

        if row is None:
            return None

        user = row[0]
        user.followers_count = row[1]
        user.following_count = row[2]

        return user

    async def get_by_username(self, username: str):
        result = await self.db.execute(
            select(
                User,
                func.count(
                    func.distinct(
                        Follow.follower_id
                    )
                ).label("followers_count"),
                func.count(
                    func.distinct(
                        Follow.following_id
                    )
                ).label("following_count"),
            )
            .outerjoin(
                Follow,
                (
                    (Follow.following_id == User.id)
                    | (Follow.follower_id == User.id)
                )
                & (Follow.status == "accepted"),
            )
            .where(User.username == username)
            .group_by(User.id)
        )

        row = result.first()

        if row is None:
            return None

        user = row[0]
        user.followers_count = row[1]
        user.following_count = row[2]

        return user

    async def search(self, query: str):
        result = await self.db.execute(
            select(
                User,
                func.count(
                    func.distinct(
                        Follow.follower_id
                    )
                ).label("followers_count"),
                func.count(
                    func.distinct(
                        Follow.following_id
                    )
                ).label("following_count"),
            )
            .outerjoin(
                Follow,
                (
                    (Follow.following_id == User.id)
                    | (Follow.follower_id == User.id)
                )
                & (Follow.status == "accepted"),
            )
            .where(User.username.ilike(f"%{query}%"))
            .group_by(User.id)
            .order_by(User.username.asc())
            .limit(20)
        )

        rows = result.all()

        users = []

        for row in rows:
            user = row[0]
            user.followers_count = row[1]
            user.following_count = row[2]
            users.append(user)

        return users

    async def create(self, username: str, password_hash: str):
        user = User(
            username=username,
            password_hash=password_hash,
        )

        self.db.add(user)

        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def update(
        self,
        user: User,
        bio: str | None = None,
        is_private: bool | None = None,
    ):
        if bio is not None:
            user.bio = bio

        if is_private is not None:
            user.is_private = is_private

        await self.db.commit()
        await self.db.refresh(user)

        return user