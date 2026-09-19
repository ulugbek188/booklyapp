from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UserResponse(BaseModel):
    id: int
    username: str
    bio: str | None
    avatar_url: str | None
    is_private: bool
    created_at: datetime
    followers_count: int
    following_count: int

    model_config = ConfigDict(
        from_attributes=True,
    )


class UserUpdateRequest(BaseModel):
    bio: str | None = Field(
        default=None,
        max_length=500,
    )

    is_private: bool | None = None


class UserListResponse(BaseModel):
    id: int
    username: str
    bio: str | None
    avatar_url: str | None
    is_private: bool
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )