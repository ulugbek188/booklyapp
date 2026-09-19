from datetime import datetime, timezone

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.security import hash_token
from src.db.database import get_db
from src.repositories.session_repository import SessionRepository
from src.repositories.user_repository import UserRepository


security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    token = credentials.credentials
    token_hash = hash_token(token)

    session_repository = SessionRepository(db)

    session = await session_repository.get_by_token_hash(token_hash)

    if session is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )

    if session.expires_at <= datetime.now(timezone.utc):
        await session_repository.delete_by_token_hash(token_hash)

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )

    user_repository = UserRepository(db)

    user = await user_repository.get_by_id(session.user_id)

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found",
        )

    return user