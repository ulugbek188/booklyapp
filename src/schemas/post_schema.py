from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class PostCreateRequest(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=255,
    )

    cover: str | None = None

    description: str = Field(
        min_length=1,
    )

    gist: str = Field(
        min_length=5,
    )

    comment_permission: Literal[
        "anyone",
        "followers",
        "nobody",
    ] = "anyone"


class PostResponse(BaseModel):
    id: int
    user_id: int
    title: str
    cover: str | None
    description: str
    gist: str
    comment_permission: str
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class PostDetailResponse(PostResponse):
    likes_count: int
    comments_count: int