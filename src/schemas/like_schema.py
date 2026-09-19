from datetime import datetime

from pydantic import BaseModel, ConfigDict

class LikeResponse(BaseModel):
    id:int
    user_id: int
    post_id: int | None
    comment_id: int | None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )