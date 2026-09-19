from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CommentCreateRequest(BaseModel):
    text: str = Field(
        min_length=1,
        max_length=1000,
    )


class CommentResponse(BaseModel):
    id: int
    user_id: int
    post_id: int
    text: str
    created_at: datetime
    likes_count: int

    model_config = ConfigDict(
        from_attributes=True
    )